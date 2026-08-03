# Detailed Analysis Report: `src/lib/`, `src/app/api/`, Unit Tests & TypeScript Verification

**Explorer**: `teamwork_preview_explorer_m1_1`  
**Target Project**: `optimistic-pascal` (`kl-sync`)  
**Date**: 2026-08-02  

---

## Executive Summary

A comprehensive, read-only analysis of `src/lib/`, `src/app/api/`, unit test suite (`npm test`), and TypeScript type checking (`npx tsc --noEmit`) was executed.

- **TypeScript Compilation**: `npx tsc --noEmit` passed with **0 errors**.
- **Unit Tests**: `npm test` executed 19 tests across 5 test suites; **all 19 tests passed (0 failures)**.
- **CAPTCHA Architecture**: Dual CAPTCHA system identified — 1) Cap CAPTCHA (proof-of-work with Upstash Redis / Memory fallback) for auth route protection, and 2) OCR Space API dual-engine auto-solve (Engine 2 primary + Engine 1 fallback) for ERP login captchas.
- **Dead Code & Over-Engineering**: Identified 11 unused exported constants in `src/lib/constants.ts`, 5 internally-used-only exported functions (`mapGradeToPoints`, `parseNumericValue` in `cgpa.ts`; `findExplicitDueKey`, `findDueAmountKey`, `getPendingAmountForRow` in `fee-utils.ts`), and 1 unused interface/option parameter (`ParseTableOptions` in `http-jar.ts`).

---

## 1. CAPTCHA Solving Architecture

The application contains two distinct CAPTCHA components:

### A. Cap CAPTCHA (Proof of Work Authorization Gate)
- **Files**:
  - `src/lib/captcha.ts`
  - `src/app/api/captcha/challenge/route.ts`
  - `src/app/api/captcha/redeem/route.ts`
  - `src/app/api/login/route.ts`
  - `src/components/Captcha.tsx`
- **Mechanism**:
  - Uses `capjs-core` (`generateChallenge`, `validateChallenge`) and `cap-widget` UI component.
  - Challenge issued via `/api/captcha/challenge`, validated via `/api/captcha/redeem`.
  - Nonces and tokens stored in **Upstash Redis** (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`) when configured, falling back to in-memory `Map` objects (`memoryNonces`, `memoryTokens`) with automatic periodic expiration (`cleanExpired()`).
  - `/api/login` calls `verifyCaptchaToken(token)` to single-use verify and burn the token before processing authentication.

### B. ERP Login OCR CAPTCHA Auto-Solve
- **Files**:
  - `src/app/api/captcha/route.ts`
  - `src/lib/scrapers/attendance.ts` (`getCaptcha`, `loginAndFetchSemesters`)
- **Mechanism**:
  - `getCaptcha()` fetches KL University ERP login page (`LOGIN_URL`), extracts CSRF token and CAPTCHA image element (`#loginFormCaptcha-image`), returning base64 image data and scraper session.
  - `/api/captcha/route.ts` performs automated OCR text extraction via OCR Space API (`https://api.ocr.space/parse/image` using `OCR_SPACE_API_KEY` or fallback `'helloworld'` key):
    - **Attempt 1 (Primary)**: POST request with `OCREngine=2`. Alphanumeric text extracted (`replace(/[^a-zA-Z0-9]/g, '')`).
    - **Attempt 2 (Fallback)**: If Engine 2 returns empty string or < 3 chars, POST request with `OCREngine=1`.
  - Scraper session sent in `x-session-id` response header as AES-256-GCM encrypted or Base64 encoded string (`encodeSession`).
  - **Device Registration Flow**: If ERP returns a token crash on first login, `loginAndFetchSemesters` harvests `kl_erp_device_id` cookie and sets `needsCaptchaRetry: true`, returning the harvested device ID to survive ERP session re-registration.

---

## 2. Codebase Audit (`src/lib/` & `src/app/api/`)

### A. Dead Code & Unused Exports
1. **`src/lib/constants.ts` (11 Unused Constant Exports)**
   - The following 11 constants are exported from `constants.ts` but are **never imported anywhere** in `src/`:
     - `COOKIE_SESSION` (`'kl_erp_session'`)
     - `COOKIE_DEVICE` (`'kl_device'`)
     - `LS_STUDENT_NAME` (`'kl_student_name'`)
     - `LS_STUDENT_PHOTO` (`'kl_student_photo'`)
     - `LS_STUDENT_PROFILE` (`'kl_student_profile'`)
     - `LS_STUDENT_ID` (`'studentId'`)
     - `LS_DASHBOARD_CGPA` (`'kl_dashboard_cgpa'`)
     - `LS_DASHBOARD_CREDITS` (`'kl_dashboard_credits'`)
     - `LS_DASHBOARD_ATTENDANCE` (`'kl_dashboard_attendance'`)
     - `LS_DASHBOARD_FEE` (`'kl_dashboard_fee'`)
     - `SS_CSRF_TOKEN` (`'kl_erp_csrf_token'`)
   - *Observation*: API routes and components use string literals directly (e.g., `'kl_erp_session'` in `src/app/api/erp-proxy/[module]/route.ts:21` and `'kl_device'` in `src/app/api/login/route.ts:19`).
2. **`src/lib/cgpa.ts` (2 Internal-Only Exports)**
   - `mapGradeToPoints` (lines 20-85) and `parseNumericValue` (lines 90-100) are exported but only called inside `cgpa.ts`.
3. **`src/lib/fee-utils.ts` (3 Internal-Only Exports)**
   - `findExplicitDueKey` (lines 160-223), `findDueAmountKey` (lines 230-294), and `getPendingAmountForRow` (lines 425-459) are exported but only called inside `fee-utils.ts`.

### B. Over-Engineered Abstractions & /ponytail Doctrine Review
1. **`src/lib/scrapers/http-jar.ts`**:
   - `export interface ParseTableOptions { preferHeadingText?: boolean; }`
   - `options` parameter in `parseGenericTable(html, options)`: `options` is accepted as a parameter and passed recursively, but its `preferHeadingText` property is never read or used anywhere. Speculative abstraction that can be simplified.
2. **`src/lib/session.ts`**:
   - Uses Node.js standard library `crypto` for AES-256-GCM encryption/decryption with `SESSION_SECRET` and fallback Base64. Follows /ponytail doctrine well (no unnecessary external NPM dependencies for crypto).

---

## 3. Test Suite & TypeScript Verification

### A. TypeScript Type Check (`npx tsc --noEmit`)
- **Status**: PASSED
- **Output**: 0 errors.

### B. Unit Test Suite (`npm test` / `npx tsx --test src/**/*.test.ts`)
- **Status**: PASSED (19 / 19 tests passing)
- **Suite Breakdown**:
  1. `verifyCaptchaToken rejects missing or invalid tokens` (1 test) — `src/lib/captcha.test.ts`
  2. `Timetable Day Normalization & DAY_MAP Coverage` (4 tests) — `src/lib/scraper.test.ts`
  3. `Cell Content Parser (parseCellContent & splitCellSessions)` (6 tests) — `src/lib/scraper.test.ts`
  4. `Cell Content Multiple Parser (parseCellContentMultiple)` (2 tests) — `src/lib/scraper.test.ts`
  5. `HTML Parsing & Matrix Formats (parseGenericTable & parseTimetable)` (4 tests) — `src/lib/scraper.test.ts`
  6. `Slot Key Normalization` (1 test) — `src/lib/scraper.test.ts`
- **Total Duration**: ~390ms

---

## 4. Summary Table of File Inventory & Status

| File Path | Purpose | Issues / Observations |
|---|---|---|
| `src/lib/captcha.ts` | Token verification & Redis/Memory nonce storage | Clean fallback implementation |
| `src/lib/cgpa.ts` | Official CGPA parsing & weighted fallback calculation | `mapGradeToPoints` & `parseNumericValue` exported but internal-only |
| `src/lib/constants.ts` | Cookie & LocalStorage key definitions | 11 out of 17 exported constants are unused dead code |
| `src/lib/fee-utils.ts` | Fee currency parsing & pending fee calculation | 3 functions exported but internal-only |
| `src/lib/scraper.ts` | Barrel facade file re-exporting scrapers | Concise re-export |
| `src/lib/scrapers/http-jar.ts` | Cheerio table parser & fetch session cookie jar | `ParseTableOptions` parameter unused |
| `src/lib/scrapers/attendance.ts` | ERP login & attendance data fetch | Robust device cookie retry handling |
| `src/lib/scrapers/timetable.ts` | Timetable scraper & multi-strategy fallback | High reliability heuristic detector |
| `src/lib/scrapers/marks.ts` | Marks, end-exam, & CGPA scrapers | Clean implementation |
| `src/lib/scrapers/fee.ts` | Fee module scraper | Concise |
| `src/lib/scrapers/profile.ts` | Student profile & tab scraper | Deep HTML parsing |
| `src/lib/session.ts` | Session AES-256-GCM encryption | Stdlib crypto, follows /ponytail |
| `src/lib/timetable-parser.ts` | Multi-layout matrix timetable parser | Exhaustively unit-tested |
| `src/lib/utils.ts` | Classname merge (`cn`) & CSV export | Clean helpers |
| `src/app/api/captcha/route.ts` | ERP captcha fetch & OCR auto-solve API | OCR Space dual-engine auto-solve |
| `src/app/api/captcha/challenge/route.ts` | Cap CAPTCHA challenge generator | Clean POST endpoint |
| `src/app/api/captcha/redeem/route.ts` | Cap CAPTCHA redemption endpoint | Clean POST endpoint |
| `src/app/api/login/route.ts` | ERP login route | Device cookie persistence & captcha check |
| `src/app/api/erp-proxy/[module]/route.ts` | Dynamic module proxy endpoint | Centralized handler for all ERP endpoints |
| `src/app/api/fetch-photo/route.ts` | Student photo proxy with path validation | Path-traversal protected |
| `src/lib/captcha.test.ts` | Unit tests for captcha token verification | 1 test, PASS |
| `src/lib/scraper.test.ts` | Unit tests for timetable & HTML table parsing | 18 tests, PASS |

