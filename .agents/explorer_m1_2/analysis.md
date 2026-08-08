# Technical Analysis & Refactoring Plans: M1 Scraper Resilience & Performance

## Executive Summary
This document presents the detailed findings and implementation blueprints for Milestone 1 (M1) backend scraper resilience, performance optimization, and captcha handling in KL Sync.

---

## 1. Task 1: ERP Proxy Resilient Error Handling (`src/app/api/erp-proxy/[module]/route.ts`)

### 1.1 Observation & Root Cause
- **Location**: `src/app/api/erp-proxy/[module]/route.ts` (lines 375–512)
- **Current Code Behavior**:
  ```typescript
  // Lines 375-382 (existing)
  if (
    errMessage.includes('fetch failed') ||
    errMessage.includes('ENOTFOUND') ||
    errMessage.includes('ETIMEDOUT') ||
    errMessage.includes('ECONNREFUSED') ||
    errMessage.includes('ERP returned HTTP') ||
    errMessage.includes('Session expired')
  ) {
    if (modName === 'attendance') { return NextResponse.json({ success: true, attendanceData: [...] }); }
    if (modName === 'timetable') { ... }
    // ... Returns mock 200 OK responses for ALL modules
  }
  ```
- **Flaws Identified**:
  1. **Deceptive Mock Fallback**: When an authenticated session fails to contact ERP (due to ERP server outage, timeout, or DNS failure), the backend silently intercepts the error and returns a `200 OK` status with hardcoded mock student data (`Alex Student`, `23CS2101R`, etc.).
  2. **Violation of REST Gateway Standards**: Network errors must return proper HTTP error status codes (`502 Bad Gateway`, `504 Gateway Timeout`, `401 Unauthorized`) so SWR hooks and UI state machines can trigger retries or display alert banners.
  3. **Unintended Scope**: Demo mode (`isDemoSession`) is already handled at lines 99–277. Real sessions entering `catch (error: unknown)` MUST fail explicitly.
  4. **Code Duplication**: Lines 397–407 and 420–456 contain duplicate `if (modName === 'timetable')` and `if (modName === 'marks')` branches inside the `catch` handler.

### 1.2 Refactoring Plan
- **Delete**: Lines 375–512 completely.
- **Implement**: Explicit status code classification in `catch (error: unknown)`:
  - `401 Unauthorized`: When session cookie/CSRF is expired or invalid (`Session expired`, `invalid ERP route`).
  - `504 Gateway Timeout`: When ERP fetch times out (`ETIMEDOUT`, `AbortError`, `TimeoutError`).
  - `502 Bad Gateway`: When ERP connection fails or returns 5xx (`fetch failed`, `ENOTFOUND`, `ECONNREFUSED`, `ERP returned HTTP 5xx`).
  - `500 Internal Server Error`: Unhandled exceptions.

### 1.3 Proposed Replacement Code Snippet
```typescript
  } catch (error: unknown) {
    let modName = 'unknown';
    try {
      const resolved = await params;
      modName = resolved?.module || 'unknown';
    } catch {}
    console.error(`[erp-proxy/${modName}] Error:`, error);
    const errMessage = error instanceof Error ? error.message : String(error);

    // 1. Session Expiration Check -> 401 Unauthorized
    const isSessionExpired =
      errMessage.includes('Session expired') ||
      errMessage.includes('invalid ERP route');
    if (isSessionExpired) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please re-login.' },
        { status: 401 }
      );
    }

    // 2. Timeout Check -> 504 Gateway Timeout
    const isTimeout =
      errMessage.includes('ETIMEDOUT') ||
      errMessage.includes('timeout') ||
      errMessage.includes('Timeout') ||
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          error: 'ERP Gateway Timeout',
          details: 'The ERP server took too long to respond. Please try again.',
        },
        { status: 504 }
      );
    }

    // 3. Network / Upstream Proxy Failure -> 502 Bad Gateway
    return NextResponse.json(
      {
        success: false,
        error: 'ERP Bad Gateway',
        details: errMessage || 'Failed to establish connection with ERP backend.',
      },
      { status: 502 }
    );
  }
```

---

## 2. Task 2: Profile Sub-tab Concurrency Pool Execution Plan (`src/lib/scrapers/profile.ts`)

### 2.1 Observation & Root Cause
- **Location**: `src/lib/scrapers/profile.ts` (lines 61–82)
- **Current Code Behavior**:
  ```typescript
  const entries = Array.from(tabUrls.entries());
  const tabHtmls = await Promise.all(
    entries.map(async ([url, name]) => {
      // Fetches all 15-25 sub-tabs concurrently
    })
  );
  ```
- **Flaws Identified**:
  1. **Unbounded Concurrency**: A student profile contains up to 25 sub-tab links (Personal, Academic, Transport, Hostel, Fee, etc.). `Promise.all` fires all 25 HTTP requests simultaneously.
  2. **IIS Connection Pool Overload**: University ERP runs on IIS / PHP. Firing 20+ simultaneous requests per profile fetch causes IIS worker exhaustion, HTTP 503/504 errors, and IP rate limiting.

### 2.2 Refactoring Plan
- Implement a batching concurrency pool with **batch size = 3**.
- Wrap each sub-tab fetch with `AbortSignal.timeout(5000)` so individual hanging sub-tabs fail gracefully without blocking the pipeline.
- Process sub-tabs sequentially in chunks of 3.

### 2.3 Proposed Replacement Code Snippet
```typescript
  const entries = Array.from(tabUrls.entries());
  const BATCH_SIZE = 3;
  const tabHtmls: { name: string; html: string }[] = [];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ([url, name]) => {
        try {
          const tabRes = await fetchWithJar(
            `https://newerp.kluniversity.in${url}`,
            jar,
            {
              method: 'GET',
              extraHeaders: {
                Origin: ERP_URL,
                Referer: ERP_ENDPOINTS['profile'],
                'X-Requested-With': 'XMLHttpRequest',
              },
              signal: AbortSignal.timeout(5000),
            }
          );
          return { name, html: await tabRes.text() };
        } catch {
          return { name, html: '' };
        }
      })
    );
    tabHtmls.push(...batchResults);
  }
```

---

## 3. Task 3: CAPTCHA OCR & Nonce Handling Resilience Plan (`src/app/api/captcha/route.ts` & `src/lib/captcha.ts`)

### 3.1 Observation & Root Cause
- **Location 1**: `src/app/api/captcha/route.ts` (lines 32–88)
- **Current Code Behavior**:
  - OCR Engine 2 is called with 2000ms timeout.
  - If Engine 2 fails or yields <3 characters, OCR Engine 1 is called with another 2000ms timeout sequentially.
  - Total OCR delay: up to 4000ms. When added to ERP captcha fetch timeout (3000ms), total route latency reaches 7000ms.
  - If OCR fails, `solvedCaptcha` defaults to `'8888'` even for real ERP captcha images, sending bad data to ERP login.
- **Location 2**: `src/lib/captcha.ts` (lines 12–25, 69–110)
- **Current Code Behavior**:
  - `consumedTokens` is stored as a `Set<string>`.
  - When `consumedTokens.size > 1000`, line 23 calls `consumedTokens.clear()`.
  - Calling `.clear()` wipes all consumed token hashes, allowing previously burned tokens to be replayed!

### 3.2 Refactoring Plan

#### A. OCR Parallel Race (2000ms Cap)
Run OCR Engine 2 and Engine 1 concurrently using `Promise.allSettled` or `Promise.race` with an `AbortController` bound to a single 2000ms total budget.
Whichever engine returns valid alphanumeric text (>=3 chars) first is used; remaining request is aborted immediately.
If both fail, return `solvedCaptcha: ''` so the UI cleanly prompts user input rather than submitting fake `'8888'`.

#### B. Nonce Storage & Token Burn Resilience (`src/lib/captcha.ts`)
Replace `consumedTokens = new Set<string>()` with a timestamp-backed map `consumedTokensMap = new Map<string, number>()` storing `tokenKey -> expirationTimestamp`.
In `cleanExpired()`, prune ONLY entries where `expiresAt <= Date.now()`. Never call `.clear()`.

### 3.3 Proposed Replacement Code Snippets

#### `src/app/api/captcha/route.ts` (OCR Race Snippet):
```typescript
    if (captchaImage && !session.csrfToken.includes('demo_csrf_token_123')) {
      try {
        const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
        const cleanBase64 = captchaImage
          .replace(/^data:image\/[a-z]+;base64,/, '')
          .replace(/[\r\n\s]/g, '');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const runOcrEngine = async (engine: string): Promise<string> => {
          const formData = new URLSearchParams();
          formData.append('base64Image', `data:image/png;base64,${cleanBase64}`);
          formData.append('OCREngine', engine);

          const res = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            signal: controller.signal,
          });

          if (!res.ok) return '';
          const ocrData = await res.json();
          const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || '';
          return parsedText.trim().replace(/[^a-zA-Z0-9]/g, '');
        };

        // Race Engine 2 and Engine 1 in parallel
        const results = await Promise.allSettled([
          runOcrEngine('2'),
          runOcrEngine('1'),
        ]);
        clearTimeout(timeoutId);

        for (const res of results) {
          if (res.status === 'fulfilled' && res.value.length >= 3) {
            solvedCaptcha = res.value;
            break;
          }
        }
        if (solvedCaptcha === '8888') solvedCaptcha = ''; // Do not default to fake '8888' on real image failure
      } catch (e) {
        console.error('OCR solving failed:', e);
        solvedCaptcha = '';
      }
    }
```

#### `src/lib/captcha.ts` (Token Pruning Snippet):
```typescript
// Replace: const consumedTokens = new Set<string>();
// With:
const consumedTokensMap = new Map<string, number>();

function cleanExpired() {
  const now = Date.now();
  for (const [k, exp] of memoryNonces.entries()) {
    if (exp <= now) memoryNonces.delete(k);
  }
  for (const [k, exp] of memoryTokens.entries()) {
    if (exp <= now) memoryTokens.delete(k);
  }
  for (const [k, exp] of consumedTokensMap.entries()) {
    if (exp <= now) consumedTokensMap.delete(k);
  }
}
```
