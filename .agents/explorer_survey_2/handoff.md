# Handoff Report — Backend, Data & Scraper Exploration

**Explorer**: Backend, Data & Scraper Explorer (`explorer_survey_2`)
**Target**: `C:\Users\speed\Documents\antigravity\optimistic-pascal`
**Date**: 2026-08-06

---

## 1. Observation

Direct observations from examining the codebase and running tools:

1. **Scraper Architecture & Barrel File**:
   - `src/lib/scraper.ts` lines 1-7 re-exports modular scrapers from `./scrapers/` (`http-jar`, `attendance`, `timetable`, `marks`, `fee`, `profile`).
   - `src/lib/scrapers/http-jar.ts` lines 9-20 defines legacy ERP endpoints:
     ```ts
     export const ERP_ENDPOINTS: Record<string, string> = {
       marks: `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fgetstudentinternalmarks`,
       timetable: `${ERP_URL}/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Findexstudentindisearch`,
       fee: `${ERP_URL}/index.php?r=feepayments%2Fstudentfeeorderdetailsinfo%2Fmy_fee_orders`,
       profile: `${ERP_URL}/index.php?r=studentinfo%2Fstudentprofileinfo%2Fviewprofileindi`,
       ...
     };
     ```

2. **Session Security & Token Storage**:
   - `src/lib/session.ts` lines 22-57 encrypts session cookies using AES-256-GCM (`ENC_PREFIX`) with key derived from `process.env.SESSION_SECRET`.
   - `src/lib/captcha.ts` lines 36-105 uses `@upstash/redis` (when `UPSTASH_REDIS_REST_URL` is set) for single-use CAPTCHA nonces and tokens, with in-memory fallback Maps (`memoryNonces`, `memoryTokens`, `consumedTokens`).

3. **Performance & Scraper Resiliency Findings**:
   - **Profile Sub-tab Parallel Fetching**: `src/lib/scrapers/profile.ts` lines 62-82 executes unbounded `Promise.all` across all sub-tab URLs extracted from profile HTML:
     ```ts
     const tabHtmls = await Promise.all(
       entries.map(async ([url, name]) => fetchWithJar(...))
     );
     ```
   - **OCR.space External Blocking Latency**: `src/app/api/captcha/route.ts` lines 43-84 performs 2 external HTTP requests to `https://api.ocr.space/parse/image` with 2000ms timeouts each.
   - **Timetable Multi-Endpoint Fallback Loop**: `src/lib/scrapers/timetable.ts` lines 156-265 iterates through 4 candidate URLs and 3 request strategies (POST, GET with params, plain GET), making up to 12 HTTP calls sequentially.
   - **Silent Mock Fallback Masking**: `src/app/api/erp-proxy/[module]/route.ts` lines 375-382 catches network errors (`fetch failed`, `ETIMEDOUT`, `ENOTFOUND`, `ECONNREFUSED`) and returns mock JSON with `success: true`:
     ```ts
     if (errMessage.includes('fetch failed') || errMessage.includes('ETIMEDOUT') ...) {
       if (modName === 'attendance') return NextResponse.json({ success: true, attendanceData: [...] });
     }
     ```

4. **UI & Data Fetching Integration**:
   - `src/app/dashboard/attendance/page.tsx` lines 29-38 fetches attendance via manual `fetch('/api/erp-proxy/attendance')` in `useCallback` / `useEffect` hooks.
   - `src/components/ERPTablePage.tsx` lines 32-43 fetches generic module data via `fetch('/api/erp-proxy/${module}')`.
   - No global client caching library (SWR or TanStack Query) is currently integrated in dashboard pages.

5. **Existing Test Suite**:
   - Running `npx tsx --test src/**/*.test.ts` executes **30 unit tests** across 5 test files:
     - `src/lib/scraper.test.ts` (11 tests)
     - `src/lib/captcha.test.ts` (3 tests)
     - `src/lib/cgpa.test.ts` (5 tests)
     - `src/lib/fee-utils.test.ts` (4 tests)
     - `src/components/ui/primitives.test.ts` (7 tests)
   - Zero test files exist for API routes (`/api/login`, `/api/captcha`, `/api/erp-proxy/[module]`, `/api/fetch-photo`), `src/lib/session.ts`, or `src/lib/scrapers/http-jar.ts`.

---

## 2. Logic Chain

1. **From Observation 1 & 2 to Storage & Security Architecture**:
   - The application maintains zero SQL/NoSQL user credential persistence ("Zero Database Persistence").
   - Session security relies on encrypted cookie tokens (`kl_erp_session` cookie or `x-session-id` header) storing session cookie jars, while CAPTCHA PoW verification uses Upstash Redis with in-memory fallback.

2. **From Observation 3 to Performance & Resilience Vulnerabilities**:
   - Unbounded `Promise.all` in `fetchProfileData` can overload legacy ERP IIS servers, causing connection resets or HTTP 503 errors.
   - Dual 2s external OCR timeouts in `/api/captcha/route.ts` add up to 4s blocking serverless latency on captcha loads.
   - Exhaustive 12-request sequential fallback loops in `fetchTimetableData` lead to high request latency when primary timetable routes fail.
   - Masking real network errors behind hardcoded mock JSON with `success: true` creates silent failure modes where users are shown fake data without warning during ERP downtime.

3. **From Observation 4 to Data Fetching Architecture (R4)**:
   - Dashboard pages use basic `useState` + `useEffect` + `fetch()` without request deduplication, background revalidation, or stale-while-revalidate caching.
   - Adding SWR or TanStack Query will modernize the data fetching architecture, satisfy requirement R4, and prevent redundant network calls across UI components.

4. **From Observation 5 to Test Coverage Requirements**:
   - Current test coverage is strictly limited to utility functions and UI primitives.
   - To ensure system resilience and satisfy acceptance criteria, new unit tests must be added for API route handlers, session encryption/decryption, and HTTP cookie jar operations.

---

## 3. Caveats

- **No Live Upstream ERP Access**: Scraper behavior against live ERP servers was evaluated via existing unit tests, mock fixtures, and code inspection. Live ERP responses could not be executed during this read-only investigation.
- **No Caveats on Local Codebase Structure**: Complete source files across `src/lib/`, `src/app/api/`, and `src/components/` were fully inspected and verified.

---

## 4. Conclusion

The KL Sync backend provides a solid, stateless proxy foundation, but has key performance bottlenecks (sequential ERP calls, OCR API delays, unbounded sub-tab fetches), scraper resilience vulnerabilities (regex parsing, silent mock fallbacks), and data fetching gaps (manual `useEffect` fetches without SWR).

**Key Actionable Steps for Implementation Team**:
1. Replace silent mock fallbacks on network errors in `/api/erp-proxy/[module]` with explicit 502/504 error statuses.
2. Introduce SWR or React Query client data fetching hooks for dashboard modules to achieve R4 performance gains.
3. Add a concurrency queue pool for sub-tab fetching in `fetchProfileData`.
4. Add unit test suites for API routes (`/api/login`, `/api/erp-proxy/[module]`, `/api/fetch-photo`), `src/lib/session.ts`, and `src/lib/scrapers/http-jar.ts`.

---

## 5. Verification Method

To verify findings independently:

1. **Run Existing Test Suite**:
   ```bash
   npx tsx --test src/**/*.test.ts
   ```
   *Expected Result*: All 30 tests pass cleanly across 5 test files.

2. **Inspect Scraper & Route Files**:
   - `src/lib/scraper.ts` & `src/lib/scrapers/*`
   - `src/app/api/erp-proxy/[module]/route.ts`
   - `src/app/api/login/route.ts`
   - `src/lib/session.ts`

3. **Invalidation Conditions**:
   - If tests fail, or if additional test files exist that were not detected.
   - If server-side database models (Prisma/Drizzle) are found in the project.
