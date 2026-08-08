# Comprehensive Backend, Data & Scraper Analysis

**Explorer Survey 2 Report**
**Target Working Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal`
**Agent Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_survey_2`
**Date**: 2026-08-06

---

## Executive Summary

KL Sync operates as a stateless edge proxy layer for KL University's legacy ASP.NET ERP system (`https://newerp.kluniversity.in`). It converts legacy HTML WebForms tables into normalized JSON payloads for a Next.js 16 (App Router) / React 19 dashboard.

This investigation conducted a full read-only analysis of `src/lib/scraper.ts`, `src/lib/scraper.test.ts`, all scraper sub-modules in `src/lib/scrapers/`, session security in `src/lib/session.ts`, CAPTCHA handling in `src/lib/captcha.ts`, utilities (`cgpa.ts`, `fee-utils.ts`, `timetable-parser.ts`), Next.js API route handlers in `src/app/api/`, data fetching integration across dashboard pages, and unit test coverage across the repository.

---

## 1. Codebase Architecture & Key File Inventory

### 1.1 Core Scraper & Transport Layer (`src/lib/`)
- **`src/lib/scraper.ts`**: Barrel / facade file re-exporting modular functions from `src/lib/scrapers/`.
- **`src/lib/scrapers/http-jar.ts`**: Core HTTP client engine. Defines `ERP_URL`, `LOGIN_URL`, `ATTENDANCE_URL`, `COURSE_LIST_URL`, `ERP_ENDPOINTS`, `USER_AGENT`, `fetchWithJar` (custom fetch with manual redirect handling & cookie merging), cookie utilities (`getSetCookies`, `mergeSetCookies`, `cookieHeader`, `jarToArray`, `arrayToJar`), and `parseGenericTable` (Cheerio HTML table parser & JSON detector).
- **`src/lib/scrapers/attendance.ts`**: Exports `getCaptcha` (fetches ERP login page HTML + base64 captcha image + CSRF token), `loginAndFetchSemesters` (authenticates user, handles `kl_erp_device_id` first-time registration crashes, extracts academic year/semester dropdown options), and `fetchAttendanceData` (fetches attendance tables).
- **`src/lib/scrapers/timetable.ts`**: Exports `isLikelyTimetableData` and `fetchTimetableData`. Implements a multi-candidate URL & multi-strategy fallback loop (POST with params, GET with query params, plain GET) across 4 ERP endpoints.
- **`src/lib/scrapers/marks.ts`**: Exports `fetchMarksData` (internal marks), `fetchEndExamResults` (semester grade cards), and `fetchCGPAData` (official summary CGPA with POST/GET fallback).
- **`src/lib/scrapers/fee.ts`**: Exports `fetchFeeData` (my fee orders endpoint) and `fetchGenericModuleData` (fallback GET proxy for generic ERP routes).
- **`src/lib/scrapers/profile.ts`**: Exports `fetchProfileData` and `parseProfileData`. Fetches main student profile page, extracts sub-tab URLs via regex/link inspection, fetches sub-tabs concurrently via `Promise.all`, and extracts demographics, photo URL, and structured tables.

### 1.2 Security, Utilities & Calculators
- **`src/lib/session.ts`**: Implements AES-256-GCM authenticated encryption (`ENC_PREFIX`) using `SESSION_SECRET` (with SHA-256 key derivation) to protect sensitive ERP cookie jars round-tripped through client requests. Falls back to base64 encoding (`B64_PREFIX`) if encryption fails.
- **`src/lib/captcha.ts`**: Proof-of-Work (PoW) CAPTCHA verification using `capjs-core`. Integrates Upstash Redis (`@upstash/redis`) for nonces and single-use challenge tokens, with an in-memory Map fallback (`memoryNonces`, `memoryTokens`, `consumedTokens`).
- **`src/lib/cgpa.ts`**: Extracts official CGPA/SGPA summaries or computes weighted GPA from grade letter mappings on a 10-point scale. Preserves failed course credits while ignoring audit/non-credit courses.
- **`src/lib/fee-utils.ts`**: Parses currency symbols (₹, $, €, £, ¥, INR, Rs), handles accounting parentheses `(1,500.00) -> -1500`, identifies status/due columns, detects summary rows, and calculates net pending fee balance.
- **`src/lib/timetable-parser.ts`**: Universal timetable parser supporting 3 layout structures (`matrix_days_columns`, `matrix_days_rows`, `list_rows`). Normalizes day order strings (`Day Order 1` -> `Monday`) and splits multi-session cell strings (`\n`, `<br>`, `||`, `---`).

### 1.3 Next.js API Routes (`src/app/api/`)
- **`/api/captcha/route.ts`**: Fetches fresh ERP captcha & session. Calls external OCR.space API (Engine 2 then Engine 1 with 2s timeouts) to attempt auto-OCR solving. Returns base64 captcha image and solved text string.
- **`/api/captcha/challenge/route.ts` & `/api/captcha/redeem/route.ts`**: Generates and validates Cap PoW challenges, burning single-use tokens in Redis / memory.
- **`/api/login/route.ts`**: Validates Cap CAPTCHA token, decodes session, calls `loginAndFetchSemesters`, sets `kl_device` httpOnly cookie (180 days), handles first-time device registration retry flow, and returns updated session ID + academic dropdown options. Supports demo fallback when username is `demo` or network fails.
- **`/api/erp-proxy/[module]/route.ts`**: Route handler proxying requests for all ERP modules (`attendance`, `timetable`, `marks`, `end-exam`, `profile`, `cgpa`, `fee`, `circulars`, `hostel`, `library`, `exam-seating`). Decodes session token, validates CSRF token, executes module scraper, or returns fallback mock data when demo session or connection error occurs.
- **`/api/fetch-photo/route.ts`**: Image proxy for student profile pictures. Enforces path traversal validation, proxies request to ERP with session cookies, and outputs binary image stream with `Cache-Control: public, max-age=86400`.

---

## 2. System Design & Performance Analysis (R4)

### 2.1 Performance Bottlenecks

1. **Sequential Upstream ERP HTTP Requests**:
   - In `loginAndFetchSemesters` (`src/lib/scrapers/attendance.ts:91-138`), login requires sequential roundtrips: GET `LOGIN_URL` -> POST `LOGIN_URL` -> GET `ATTENDANCE_URL`.
   - In `fetchAttendanceData` (`src/lib/scrapers/attendance.ts:275-330`), fetching attendance makes 2 sequential POST requests: `ATTENDANCE_URL` followed by `COURSE_LIST_URL`.
   - Total roundtrip latency to legacy ERP averages 1.5s - 3.5s per module fetch.

2. **Unbounded Parallel Profile Sub-Tab Fetches**:
   - In `fetchProfileData` (`src/lib/scrapers/profile.ts:62-82`), sub-tab links (which can range from 4 to 12 endpoints) are fetched simultaneously using `Promise.all`:
     ```ts
     const tabHtmls = await Promise.all(
       entries.map(async ([url, name]) => fetchWithJar(...))
     );
     ```
   - Legacy IIS / ASP.NET servers frequently throttle or drop connections when receiving 10+ concurrent requests from the same session cookie, causing sub-tab timeouts.

3. **External OCR API Latency on Captcha Load**:
   - `/api/captcha/route.ts:43-84` executes external HTTP calls to `https://api.ocr.space/parse/image` with 2-second timeouts per engine. If OCR.space is slow or unresponsive, initial page load latency increases by 2 to 4 seconds.

4. **Exhaustive Timetable Fallback Loop**:
   - `fetchTimetableData` (`src/lib/scrapers/timetable.ts:156-265`) loops over 4 candidate URLs and tries up to 3 request strategies (POST with params, GET with query params, plain GET) per URL. In worst-case scenarios, this causes up to 12 sequential HTTP calls before returning.

5. **Absence of Server-Side Response Caching**:
   - Neither `/api/erp-proxy/[module]` nor the scraper layer caches ERP responses on edge/serverless memory or Redis. Every UI tab navigation re-executes full scraper passes against the ERP backend.

6. **No Request Deduplication / Batching**:
   - Concurrent UI components (e.g. Dashboard overview stats + Today's schedule widget) fire independent parallel requests to `/api/erp-proxy/attendance` and `/api/erp-proxy/timetable` without request deduplication or batching.

### 2.2 Scraper Resilience Weaknesses

1. **Cheerio Table Parsing Schema Assumptions**:
   - `parseGenericTable` (`src/lib/scrapers/http-jar.ts:126-324`) relies on `<table>`, `<tr>`, `<th>`, and `<td>` structure. If the ERP modifies table styling, uses nested wrapper tables, or replaces tables with `<div>` flexbox grids, key-value extraction degrades or returns empty rows.

2. **Regex Fragility for Auth Tokens & Elements**:
   - CSRF tokens and captcha image sources are extracted using hardcoded regexes:
     - `html.match(/name="_csrf"[^>]*value="([^"]+)"/)` (`attendance.ts:32`)
     - `html.match(/id="loginFormCaptcha-image"[^>]*src="([^"]+)"/)` (`attendance.ts:43`)
   - Any minor whitespace or attribute reordering by ERP breaks token extraction.

3. **Yii Framework Query String Endpoint Coupling**:
   - Endpoints in `ERP_ENDPOINTS` (`http-jar.ts:9-20`) use specific Yii route parameters (e.g. `r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput`). Upstream route renames or parameter updates instantly break proxy endpoints.

4. **Manual Redirect Processing in `fetchWithJar`**:
   - `fetchWithJar` (`http-jar.ts:109-122`) manually intercepts 301/302/303 redirects and converts method to `GET`. If ERP responds to a form POST with 302 redirecting to a page that expects POST parameters, data is dropped.

5. **First-Time Device Cookie Registration Crash**:
   - ERP exhibits a known bug where new logins without `kl_erp_device_id` throw a Yii `UserAccessToken` crash. `loginAndFetchSemesters` (`attendance.ts:161-179`) detects this crash text to harvest the cookie and requests a captcha retry. If ERP error message text changes, the scraper throws an unhandled exception instead of completing device registration.

### 2.3 Error Handling Gaps

1. **Silent Fallback to Mock Data on Network Failure**:
   - In `/api/login/route.ts:81-115` and `/api/erp-proxy/[module]/route.ts:374-512`, network errors (`fetch failed`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNREFUSED`) return mock demo data with `success: true`:
     ```ts
     if (errMessage.includes('fetch failed') || errMessage.includes('ETIMEDOUT') ...) {
       if (modName === 'attendance') return NextResponse.json({ success: true, attendanceData: [...] });
     }
     ```
   - **Critical Problem**: Users receiving mock data have no visual indication that real ERP connection failed. Genuine ERP server outages present fake demo data to logged-in students.

2. **Swallowed Exceptions**:
   - `fetchCGPAData` (`marks.ts:116`) uses an empty `catch {}` block to suppress Strategy 1 failures without logging diagnostics.

3. **Generic Error Responses**:
   - Proxy endpoints return generic strings like `'Failed to fetch data'` or `'Session expired'` without structured error codes (`ERP_TIMEOUT`, `PARSING_ERROR`, `INVALID_CREDENTIALS`, `CAPTCHA_INCORRECT`).

4. **Missing Retry Logic with Exponential Backoff**:
   - `fetchWithJar` relies on static timeouts (`AbortSignal.timeout(25000)`). It lacks automatic retries with exponential backoff for transient 502/503/504 ERP server errors.

### 2.4 Data Fetching Architecture (R4)

1. **Manual Client Component State Management**:
   - Client pages (`attendance/page.tsx`, `ERPTablePage.tsx`) use basic `useState` + `useEffect` + `fetch()`. There is no global cache or unified data fetching library (such as SWR or TanStack Query), leading to boilerplate duplication and lack of automatic revalidation.

2. **Lack of Stale-While-Revalidate & Offline Persistence**:
   - Navigating between dashboard pages re-triggers fetches from scratch. If the user loses network connectivity or the ERP goes down, previously loaded data is lost upon tab navigation.

---

## 3. UI Connection & Test Coverage Analysis

### 3.1 UI to Backend Connection Map

| UI Component / Page | API Endpoint / Module | Backend Scraper / Utility File | Data Flow / Responsibilities |
| :--- | :--- | :--- | :--- |
| `src/app/page.tsx` (Login) | `/api/captcha`<br>`/api/captcha/redeem`<br>`/api/login` | `src/lib/scrapers/attendance.ts`<br>`src/lib/captcha.ts`<br>`src/lib/session.ts` | Displays captcha image, solves OCR, verifies Cap PoW token, authenticates against ERP, receives session cookie & device ID |
| `src/app/dashboard/attendance/page.tsx` | `/api/erp-proxy/attendance` | `src/lib/scrapers/attendance.ts` | Posts `academicYear`, `semesterId`, `csrfToken`. Renders course attendance table, calculates overall percentage and class projection indicators |
| `src/app/dashboard/timetable/page.tsx` | `/api/erp-proxy/timetable` | `src/lib/scrapers/timetable.ts`<br>`src/lib/timetable-parser.ts` | Fetches raw table rows, invokes `parseTimetable` to build matrix/list grid, renders day/period view |
| `src/app/dashboard/marks/page.tsx` | `/api/erp-proxy/marks`<br>`/api/erp-proxy/end-exam` | `src/lib/scrapers/marks.ts`<br>`src/lib/cgpa.ts` | Fetches internal marks and end-exam grade cards, calculates SGPA/CGPA via `processERPDataForCGPA` |
| `src/app/dashboard/fee/page.tsx` | `/api/erp-proxy/fee` | `src/lib/scrapers/fee.ts`<br>`src/lib/fee-utils.ts` | Parses fee orders, computes paid vs pending amounts via `calculatePendingFee` and `parseCurrency` |
| `src/app/dashboard/profile/page.tsx` | `/api/erp-proxy/profile`<br>`/api/fetch-photo` | `src/lib/scrapers/profile.ts`<br>`src/app/api/fetch-photo/route.ts` | Fetches student profile, loads avatar via `/api/fetch-photo?id=...`, renders extended sub-tab details |
| `src/components/ERPTablePage.tsx` | `/api/erp-proxy/[module]` | `src/lib/scrapers/fee.ts` (`fetchGenericModuleData`) | Generic container rendering tables for `circulars`, `hostel`, `library`, `exam-seating` |
| `src/app/dashboard/tools/page.tsx` | Client Calculators | `src/lib/cgpa.ts`<br>`src/lib/fee-utils.ts`<br>`src/components/attendance-calculator.tsx` | Attendance target calculator & CGPA goal predictor |

### 3.2 Existing Test Inventory

The project currently contains **5 test files** with **30 unit test assertions** executed via `npx tsx --test src/**/*.test.ts`:

1. **`src/lib/scraper.test.ts`** (11 tests):
   - Day normalization for Day Order 1 through 7 & day aliases.
   - Cell content parsing (`parseCellContent`), component classification (Lecture, Skill, Practical), room extraction, and multi-session cell splitting (`splitCellSessions`).
   - Matrix day-rows, matrix day-columns, and list timetable HTML parsing (`parseGenericTable` & `parseTimetable`).
   - Slot key normalization (`normalizeSlotKey`).

2. **`src/lib/captcha.test.ts`** (3 tests):
   - Rejection of missing/invalid CAPTCHA tokens.
   - Single-use CAPTCHA token burning (`storeRedeemedToken` & `verifyCaptchaToken`).
   - Nonce single-use enforcement (`consumeNonce`).

3. **`src/lib/cgpa.test.ts`** (5 tests):
   - Official CGPA/SGPA summary extraction from rows and profile data.
   - Dynamic weighted GPA calculation from letter grades (`S`, `A+`, `A`, `B+`, `F`).
   - Exclusion of non-credit/audit courses (`PASS`, `NC`).
   - Graceful handling of empty/invalid inputs.

4. **`src/lib/fee-utils.test.ts`** (4 tests):
   - `parseCurrency` handling of symbols (₹, $, INR, Rs), negative numbers, and accounting parens `(₹1,500.00)`.
   - `findStatusKey` location of status columns.
   - `isSummaryRow` detection of total/summary rows.
   - `isRowUnpaid` and `calculatePendingFee` balance calculations.

5. **`src/components/ui/primitives.test.ts`** (7 tests):
   - Button 44px touch targets, variants, loading spinner, and custom classes.
   - Input touch target, icons, and error states.
   - Badge styling, dot indicator, and color variants.
   - Card surface styles and interactive hover-lift.
   - Dialog overlay, accessible roles, and context validation.
   - Skeleton shimmer animation.

### 3.3 Test Coverage Gaps & Recommended Additions

1. **API Route Integration Tests**:
   - Zero unit or integration tests exist for API routes (`/api/login`, `/api/captcha`, `/api/erp-proxy/[module]`, `/api/fetch-photo`).
   - *Needed*: Tests verifying session token parsing, missing parameter validation (e.g. missing `academicYear` returning 400), CSRF verification, and error status codes.

2. **HTTP Jar & Cookie Scraper Tests**:
   - `src/lib/scrapers/http-jar.ts` functions (`getSetCookies`, `mergeSetCookies`, `cookieHeader`, `jarToArray`, `arrayToJar`, `parseGenericTable`) lack dedicated test files.
   - *Needed*: Unit tests for cookie header merging, duplicate cookie handling, and edge-case HTML table structures in `parseGenericTable`.

3. **Scraper Error & Fallback Logic Tests**:
   - No tests exist for `loginAndFetchSemesters` error text parsing (e.g. incorrect password, invalid captcha, device registration crash).
   - *Needed*: Mock HTML tests verifying that error messages are correctly identified and thrown.

4. **Session Security & AES-256-GCM Tests**:
   - `src/lib/session.ts` (`encodeSession` / `decodeSession`) lacks unit tests verifying encryption integrity, secret key derivation, fallback handling, and tampering rejection.

5. **Client Data Hooks & Error State Tests**:
   - No tests exist for `useAcademicSession` hook or dashboard page error rendering when API calls fail.

---

## 4. Key Recommendations for Architectural Improvement

1. **Eliminate False-Positive Mock Fallbacks**:
   - Update `/api/erp-proxy/[module]` and `/api/login` so that network errors or ERP outages return explicit HTTP 502/504 errors with descriptive error messages instead of returning mock demo data as `success: true`.

2. **Implement Request Deduplication & SWR Client Caching**:
   - Adopt SWR or TanStack Query in dashboard client pages to deduplicate parallel requests, cache module data in memory, and support automatic background revalidation.

3. **Optimize Profile Sub-Tab Fetching**:
   - Limit concurrency of sub-tab requests in `fetchProfileData` using a concurrency pool (e.g. max 3 parallel requests) or fetch sub-tabs lazily on demand when the user clicks a tab in the UI.

4. **Add Exponential Backoff Retries to Scraper Fetches**:
   - Enhance `fetchWithJar` in `http-jar.ts` to include automatic retries (up to 3 attempts with exponential backoff) for 502/503/504 gateway errors.

5. **Expand Test Suite**:
   - Create unit test files for `src/lib/session.ts`, `src/lib/scrapers/http-jar.ts`, and API route handlers in `src/app/api/`.
