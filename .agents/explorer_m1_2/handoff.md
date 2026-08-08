# Handoff Report: M1 Scraper Resilience & Performance Exploration

## 1. Observation

### 1.1 Task 1: Silent Mock Error Fallback in ERP Proxy
- **File**: `src/app/api/erp-proxy/[module]/route.ts`, lines 375–512.
- **Direct Code Quote**:
  ```typescript
  // Lines 375-383
  if (
    errMessage.includes('fetch failed') ||
    errMessage.includes('ENOTFOUND') ||
    errMessage.includes('ETIMEDOUT') ||
    errMessage.includes('ECONNREFUSED') ||
    errMessage.includes('ERP returned HTTP') ||
    errMessage.includes('Session expired')
  ) {
    if (modName === 'attendance') {
      return NextResponse.json({
        success: true,
        attendanceData: [ /* mock data */ ]
      });
    }
  ```
- **Observations**:
  - The `catch (error: unknown)` handler intercepts all real-session ERP network and timeout failures and returns HTTP 200 OK with hardcoded mock JSON.
  - SWR hooks and client components receive mock data instead of detecting network errors.
  - Duplicate `if (modName === 'timetable')` and `if (modName === 'marks')` branches exist at lines 397-407 and 420-456.

### 1.2 Task 2: Unbounded Profile Sub-tab Fetching
- **File**: `src/lib/scrapers/profile.ts`, lines 61–82.
- **Direct Code Quote**:
  ```typescript
  // Lines 61-63
  const entries = Array.from(tabUrls.entries());
  const tabHtmls = await Promise.all(
    entries.map(async ([url, name]) => { ... })
  );
  ```
- **Observations**:
  - Up to 25 profile sub-tab links are scraped and requested simultaneously via `Promise.all`.
  - Fires up to 25 parallel HTTP requests to `https://newerp.kluniversity.in`, triggering IIS worker pool saturation and 503/504 errors on legacy ERP infrastructure.

### 1.3 Task 3: CAPTCHA OCR Latency & Token Nonce Storage
- **Files**: `src/app/api/captcha/route.ts` (lines 38–84) and `src/lib/captcha.ts` (lines 12–25).
- **Direct Code Quotes**:
  - `route.ts` line 50: `signal: AbortSignal.timeout(2000)` (Attempt 1: Engine 2)
  - `route.ts` line 74: `signal: AbortSignal.timeout(2000)` (Attempt 2: Engine 1 sequential fallback)
  - `captcha.ts` lines 22-24:
    ```typescript
    if (consumedTokens.size > 1000) {
      consumedTokens.clear();
    }
    ```
- **Observations**:
  - OCR calls Engine 2 and Engine 1 sequentially (up to 4000ms total OCR delay). Combined with ERP captcha fetch (3000ms), total API route latency reaches up to 7000ms.
  - `consumedTokens.clear()` inside `cleanExpired()` completely clears the Set of burned tokens when size exceeds 1000, enabling token replay attacks.

---

## 2. Logic Chain

1. **ERP Proxy Error Handling**:
   - *Observation 1.1* shows real ERP network errors (e.g. `ETIMEDOUT`, `ENOTFOUND`, `fetch failed`) are intercepted by `catch` and return HTTP 200 OK with mock data.
   - *Step 1*: SWR hooks and UI state machines rely on HTTP status codes or `{ success: false }` to trigger error banners and retries. Returning 200 OK deceives the client UI into showing stale/fake student data during an ERP outage.
   - *Step 2*: Removing mock fallback in `catch` and categorizing errors into 401 Unauthorized, 504 Gateway Timeout, and 502 Bad Gateway restores REST compliance and UI resilience.

2. **Profile Scraper Concurrency Pool**:
   - *Observation 1.2* shows `Promise.all` issuing ~25 concurrent GET requests per profile scrape.
   - *Step 1*: Legacy university IIS servers reject high-concurrency request bursts per IP/session.
   - *Step 2*: Grouping requests into chunks of `BATCH_SIZE = 3` with `Promise.all` per chunk and adding a per-request `5000ms` signal limits concurrent connections to 3 without exceeding execution limits.

3. **CAPTCHA OCR & Token Nonce Handling**:
   - *Observation 1.3* shows sequential OCR execution causing up to 4000ms delay and `consumedTokens.clear()` risking replay attacks.
   - *Step 1*: Racing Engine 2 and Engine 1 concurrently with `Promise.allSettled` and a total 2000ms budget cuts max OCR delay by 50% (to 2000ms).
   - *Step 2*: Replacing `consumedTokens.clear()` with timestamp-based pruning (`consumedTokensMap = new Map<string, number>()`) ensures burned tokens are preserved until expiration.

---

## 3. Caveats
- **External OCR Service Dependencies**: `api.ocr.space` is a third-party free API (`apikey: 'helloworld'`). If `api.ocr.space` is completely unreachable or rate-limited, OCR will fail gracefully and fall back to manual user input.
- **Serverless Memory State**: In multi-region serverless deployments without Upstash Redis configured, `memoryTokens` and `memoryNonces` are local to the warm function instance. The fallback logic in `verifyCaptchaToken` handles valid token formats statelessly.

---

## 4. Conclusion
The architectural and refactoring plans formulated in `analysis.md` provide concrete, drop-in code implementations to satisfy all Milestone 1 (M1) requirements:
1. `src/app/api/erp-proxy/[module]/route.ts`: Replace silent mock fallbacks with explicit 401, 502, and 504 status responses.
2. `src/lib/scrapers/profile.ts`: Implement batch size 3 concurrency pool for profile sub-tabs.
3. `src/app/api/captcha/route.ts` & `src/lib/captcha.ts`: Implement concurrent dual-engine OCR race (2s budget) and timestamp-backed token burn pruning.

---

## 5. Verification Method

### 5.1 Static Analysis & Build Verification
Execute the project verification pipeline to confirm zero TypeScript compilation or lint regression:
```bash
npm run lint
npx tsc --noEmit
npm run test
```

### 5.2 Unit Test Execution
Confirm all existing 49 unit tests pass cleanly:
```bash
npx tsx --test src/**/*.test.ts
```

### 5.3 File Inspection Checklist
- Check `src/app/api/erp-proxy/[module]/route.ts` `catch` block does not contain `attendanceData` or `Alex Student` mock returns.
- Check `src/lib/scrapers/profile.ts` contains `BATCH_SIZE = 3` loop over `tabUrls`.
- Check `src/app/api/captcha/route.ts` uses parallel `Promise.allSettled` for OCR engines.
- Check `src/lib/captcha.ts` does not call `consumedTokens.clear()`.
