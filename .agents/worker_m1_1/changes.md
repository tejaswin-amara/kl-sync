# Changes Report: Milestone 1 (M1: Architecture & Data Fetching Foundation)

## Summary of Changes

### 1. Package Installation
- Installed `zod` (`^3.24.2`) and `swr` (`^2.3.3`) as production dependencies in `package.json`.

### 2. Zod Validation Schemas (`src/lib/schemas/`)
- Created `src/lib/schemas/attendance.ts`: Defines `attendanceSubjectSchema` (with `.passthrough()`) and `attendanceResponseSchema`.
- Created `src/lib/schemas/timetable.ts`: Defines `rawTimetableRowSchema`, `timetableSlotSchema`, and `timetableResponseSchema`.
- Created `src/lib/schemas/marks.ts`: Defines `marksSubjectSchema` (with `.passthrough()`) and `marksResponseSchema`.
- Created `src/lib/schemas/fee.ts`: Defines `feeItemSchema` (with `.passthrough()`) and `feeResponseSchema`.
- Created `src/lib/schemas/profile.ts`: Defines `profileDataSchema` (with `.passthrough()`) and `profileResponseSchema`.
- Created `src/lib/schemas/login.ts`: Defines `loginRequestSchema`, `loginResponseSchema`, and `semesterOptionSchema`.
- Created `src/lib/schemas/index.ts`: Barrel export for all Zod schemas and TypeScript types.

### 3. SWR Client Data Fetching Hooks (`src/hooks/`)
- Created `src/hooks/useAttendance.ts`: Custom SWR hook fetching attendance records, performing Zod schema validation, computing overall attended/conducted statistics, and returning `{ data, raw, overallPercentage, totalAttended, totalConducted, isLoading, error, mutate }`.
- Created `src/hooks/useTimetable.ts`: Custom SWR hook fetching raw timetable grid rows, performing Zod schema validation, parsing into `ParsedTimetable` via `parseTimetable()`, and returning `{ data, isLoading, error, mutate }`.
- Created `src/hooks/useMarks.ts`: Custom SWR hook fetching academic marks, performing Zod schema validation, and returning `{ data, isLoading, error, mutate }`.
- Created `src/hooks/useFee.ts`: Custom SWR hook fetching fee records, performing Zod schema validation, computing pending/paid fees via `calculatePendingFee()`, and returning `{ data, totalPending, totalPaid, isLoading, error, mutate }`.
- Created `src/hooks/useProfile.ts`: Custom SWR hook fetching student profile, performing Zod schema validation, handling automated logout on 401 session expiration, and returning `{ data, isLoading, error, mutate }`.
- Created `src/hooks/index.ts`: Barrel export for all SWR hooks.
- Refactored `src/app/dashboard/attendance/page.tsx`: Replaced manual `useEffect` + `fetch` with `useAttendance(selectedYear, selectedSem)`.
- Refactored `src/app/dashboard/timetable/page.tsx`: Replaced complex `Promise.allSettled` + `useEffect` fetching with `useTimetable(selectedYear, selectedSem)`.
- Refactored `src/app/dashboard/marks/page.tsx`: Replaced manual `useEffect` + `fetch` with `useMarks(selectedYear, selectedSem)`.
- Refactored `src/app/dashboard/fee/page.tsx`: Replaced manual `useEffect` + `fetch` with `useFee()`.
- Refactored `src/app/dashboard/profile/page.tsx`: Replaced manual `useEffect` + `fetch` + `localStorage` with `useProfile()`.
- Refactored `src/components/ERPTablePage.tsx`: Replaced manual `fetch` state with `useSWR('/api/erp-proxy/${module}')`.

### 4. Backend Scraper Resilience & Performance
- `src/app/api/erp-proxy/[module]/route.ts`:
  - Removed silent mock fallbacks in `catch (error: unknown)`.
  - Implemented explicit REST error status responses: `401 Unauthorized` for expired sessions, `504 Gateway Timeout` for ERP timeouts, and `502 Bad Gateway` for connection failures.
  - Implemented upfront parameter, CSRF, and route validation.
- `src/lib/scrapers/profile.ts`:
  - Replaced unbounded `Promise.all` across profile sub-tabs with a batch-size 3 concurrency queue (`BATCH_SIZE = 3`).
  - Added per-subtab request timeouts via `AbortSignal.timeout(5000)`.
- `src/app/api/captcha/route.ts` & `src/lib/captcha.ts`:
  - Implemented 2s dual OCR engine race (Engine 2 vs Engine 1 in parallel with single 2000ms budget).
  - Replaced unsafe `consumedTokens.clear()` with timestamp-backed pruning map `consumedTokensMap` in `cleanExpired()`.
  - Prevented submitting fallback `'8888'` captchas to live ERP.

### 5. Unit Test Suite Expansion
- Created `src/lib/session.test.ts`: Added tests for AES-256-GCM encryption/decryption roundtrips, legacy base64 session decoding, corrupted payload handling, secret key mismatch, and null/empty inputs.
- Created `src/lib/scrapers/http-jar.test.ts`: Added tests for `cookieHeader`, `jarToArray`, `arrayToJar`, `mergeSetCookies`, and `ERP_ENDPOINTS` dictionary validation.
- Created `src/app/api/erp-proxy.test.ts`: Added tests for proxy CSRF token checks, missing parameter checks, unknown module 404 responses, and demo session mock dispatching.

### 6. Codebase Verification Status
- `npm run build`: Success (0 errors).
- `npm run lint`: Success (0 errors, 0 warnings).
- `npx tsc --noEmit`: Success (0 errors).
- `npm run test`: Success (63 unit tests passed across 12 suites, 0 failures).
- `npx tsx --test src/lib/scraper.test.ts`: Success (18 unit tests passed, 0 failures).
