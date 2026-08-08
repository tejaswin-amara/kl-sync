# Handoff Report: R1 & R4 Investigation

**Agent**: `explorer_1`  
**Role**: Explorer Subagent for KL Sync Simplification (R1 & R4)  
**Date**: 2026-08-08  

---

## 1. Observation
1. **R1 Custom Crypto Implementation**:
   - `src/lib/session.ts` lines 11-37 & 44-65:
     ```ts
     const ALGO = 'aes-256-gcm';
     function getKey(): Buffer {
       const secret = process.env.SESSION_SECRET || ...
       return crypto.createHash('sha256').update(secret).digest();
     }
     export function encodeSession(session: ScraperSession): string {
       ...
       const cipher = crypto.createCipheriv(ALGO, key, iv);
       ...
       const tag = cipher.getAuthTag();
       return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
     }
     export function decodeSession(token: string | null | undefined): ScraperSession {
       ...
       const decipher = crypto.createDecipheriv(ALGO, key, iv);
       decipher.setAuthTag(tag);
       ...
     }
     ```
   - Uses Node.js built-in `crypto.createCipheriv`, `crypto.createDecipheriv`, `crypto.createHash`, and manual 12-byte IV / 16-byte authentication tag concatenation/parsing.

2. **R4 Dispersed Fallback Mock Data**:
   - `src/lib/session.ts` lines 68-73: Hardcoded fallback `ScraperSession` (`PHPSESSID`, `demo_phpsessid_123`, `demo_csrf_token_123`).
   - `src/lib/ai/executor.ts` lines 55-206: Hardcoded datasets `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`.
   - `src/app/api/erp-proxy/[module]/route.ts` lines 49-60, 134-308: In-line duplicated mock responses for `attendance`, `timetable`, `marks`, `profile`, `cgpa`, and `fee`.
   - `src/app/api/captcha/route.ts` lines 19-25: In-line duplicated `captchaImage` fallback SVG base64 and fallback session object.
   - `src/app/api/login/route.ts` lines 93-112: In-line duplicated fallback `demoSession` and `demo` login response object.
   - `src/app/api/ai/chat/route.ts` lines 56-67: In-line duplicated fallback `ScraperSession` objects.

3. **Current Test Baseline**:
   - Test execution command `npm test` (`npx tsx --test src/**/*.test.ts`) completed with zero failures:
     `ℹ tests 186` | `ℹ suites 32` | `ℹ pass 186` | `ℹ fail 0`

---

## 2. Logic Chain
1. **From Observation 1 to R1 Simplification Strategy**:
   - Observation 1 shows `src/lib/session.ts` manually manages AES-256-GCM authentication tags and IVs using Node's `crypto.createCipheriv` and `crypto.createDecipheriv`.
   - Requirement R1 explicitly prohibits `crypto.createCipheriv` logic and asks for Web Crypto API or `iron-session`.
   - Web Crypto API (`crypto.subtle`) provides native `encrypt` and `decrypt` with automatic AES-GCM tag verification, removing custom Node stream/tag handling without introducing third-party dependencies.
   - Updating `src/lib/session.ts` to use `crypto.subtle` or native Web Crypto API eliminates `crypto.createCipheriv` while preserving fallback handling for `b64.` prefix, invalid tokens, and missing parameters.

2. **From Observation 2 to R4 Fixture Consolidation Strategy**:
   - Observation 2 demonstrates that fallback datasets (`DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_SESSION`, `DEMO_CGPA`, `DEMO_CAPTCHA_SVG`, `DEMO_LOGIN_RESULT`) are scattered and duplicated across 6 files (`session.ts`, `executor.ts`, `erp-proxy/[module]/route.ts`, `captcha/route.ts`, `login/route.ts`, `chat/route.ts`).
   - Creating a single `src/lib/fixtures/index.ts` module to hold these typed exports establishes a single source of truth.
   - Importing these fixtures into all consumer routes and helpers eliminates copy-pasted mock structures across the application.

3. **From Observation 3 to Verification Assurance**:
   - Baseline unit tests currently pass 186/186.
   - Refactoring `session.ts` and consolidating mock fixtures must maintain 100% test pass rate on `npm test` and pass Playwright E2E tests.

---

## 3. Caveats
- If `encodeSession` and `decodeSession` are converted to `async` functions using Web Crypto `crypto.subtle`, callers in `src/app/api/captcha/route.ts`, `login/route.ts`, `erp-proxy/[module]/route.ts`, `fetch-photo/route.ts`, `ai/chat/route.ts`, and test files must use `await`.
- `src/lib/session.ts` must maintain backwards compatibility with `b64.` prefixed strings and invalid tokens so that fallback handling remains seamless.

---

## 4. Conclusion
1. **R1**: Replace manual AES-256-GCM `crypto.createCipheriv` in `src/lib/session.ts` with Next.js native Web Crypto API (`crypto.subtle`).
2. **R4**: Create `src/lib/fixtures/index.ts` containing all fallback datasets (`DEMO_SESSION`, `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_CGPA`, `DEMO_CAPTCHA_SVG`, `DEMO_LOGIN_RESULT`). Replace all hardcoded inline fallback definitions across `src/lib/session.ts`, `src/lib/ai/executor.ts`, `src/app/api/captcha/route.ts`, `src/app/api/login/route.ts`, `src/app/api/erp-proxy/[module]/route.ts`, and `src/app/api/ai/chat/route.ts` with imports from `@/lib/fixtures`.

---

## 5. Verification Method
1. **Crypto Audit**:
   - Run search: `grep "createCipheriv" src/lib/session.ts` -> must return zero matches.
2. **Unit Tests**:
   - Run `npm test` (`npx tsx --test src/**/*.test.ts`) -> all 186 tests must pass.
3. **Static Analysis**:
   - Run `npm run build`
   - Run `npm run lint`
   - Run `npx tsc --noEmit`
4. **E2E Verification**:
   - Run `npx playwright test`
