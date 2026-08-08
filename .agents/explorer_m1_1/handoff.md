# Handoff Report: M1 Data Hooks & Zod Schema Explorer

## 1. Observation
1. **`package.json` Inspection**:
   - Analyzed `package.json` dependencies:
     ```json
     "dependencies": {
       "@upstash/redis": "^1.38.1",
       "cap-widget": "^0.1.56",
       "capjs-core": "^0.1.1",
       "cheerio": "^1.2.0",
       "clsx": "^2.1.1",
       "lucide-react": "^1.21.0",
       "next": "16.2.9",
       "react": "19.2.4",
       "react-dom": "19.2.4",
       "tailwind-merge": "^3.6.0"
     }
     ```
   - Observed that neither `swr` nor `zod` is installed in `package.json`.

2. **Existing Custom Hook**:
   - `src/hooks/useERPData.ts`: Uses custom React state (`useState`, `useEffect`, `useCallback`) and `queueMicrotask` for `localStorage` hydration.
   - `src/hooks/useAcademicSession.ts`: Manages session choices (`selectedYear`, `selectedSem`) from `localStorage`/`sessionStorage`.

3. **Dashboard Page Data Fetching**:
   - `src/app/dashboard/attendance/page.tsx` (lines 23-44): Manual `fetch('/api/erp-proxy/attendance', { method: 'POST', body: ... })` inside `useEffect`.
   - `src/app/dashboard/timetable/page.tsx` (lines 115-344): `Promise.allSettled` fetching `/api/erp-proxy/timetable`, `/api/erp-proxy/profile`, and `/api/erp-proxy/marks`. Manual `sessionStorage` caching under `kl_timetable_${year}_${sem}`.
   - `src/app/dashboard/marks/page.tsx` (lines 26-45): Manual `fetch('/api/erp-proxy/marks', { method: 'POST' })`.
   - `src/app/dashboard/fee/page.tsx` (lines 21-36): Manual GET `fetch('/api/erp-proxy/fee')`.
   - `src/app/dashboard/profile/page.tsx` (lines 14-61): GET `fetch('/api/erp-proxy/profile?t=...')` with `cache: 'no-store'` and `localStorage` hydration.
   - `src/components/ERPTablePage.tsx` (lines 29-44): Generic GET `fetch('/api/erp-proxy/${module}')`.

4. **Directory Structure**:
   - `src/hooks/` contains `useERPData.ts` and `useAcademicSession.ts`.
   - `src/lib/schemas/` directory does not currently exist in the repository.

---

## 2. Logic Chain
1. **Observation 1 & 4**: `package.json` lacks `swr` and `zod`, and `src/lib/schemas/` does not exist.
   - **Reasoning**: The project requires M1 Architecture & Data Fetching Foundation where SWR client hooks and Zod schemas are specified in `PROJECT.md`.
   - **Step**: Implementers must install `swr` (`^2.3.3`) and `zod` (`^3.24.2`) via `npm install swr zod` and create `src/lib/schemas/`.

2. **Observation 3**: Existing data fetching in dashboard pages consists of scattered, duplicated `useEffect` and `fetch` blocks with inconsistent client-side caching (`sessionStorage` vs. `localStorage` vs. none).
   - **Reasoning**: Standardizing on SWR hooks (`useAttendance`, `useTimetable`, `useMarks`, `useFee`, `useProfile`) will eliminate boilerplate, provide global response deduplication, enable background revalidation, and prevent React 19 `set-state-in-effect` linting issues.
   - **Step**: Implementers should wrap `/api/erp-proxy/*` endpoints in unified SWR hooks that accept `(year, sem)` params and return standard `{ data, error, isLoading, mutate }`.

3. **Observation 3 & PROJECT.md Contracts**: API response payloads are unvalidated arrays or arbitrary key-value maps (`Record<string, unknown>[]`).
   - **Reasoning**: Adding Zod schemas (`attendance.ts`, `timetable.ts`, `marks.ts`, `fee.ts`, `profile.ts`, `login.ts`) with permissive `.passthrough()` allows dynamic ERP columns while assuring minimum typed guarantees for UI consumers and AI toolkits.
   - **Step**: Implementers will build schemas in `src/lib/schemas/` and parse incoming/outgoing data in both SWR hooks and Next.js route handlers (`/api/login`, `/api/erp-proxy/*`).

---

## 3. Caveats
- **ERP Dynamic Tables**: The university ERP table headers vary across semesters and departments. Zod schemas for table rows (`AttendanceSubject`, `MarksSubject`, `FeeItem`) MUST use `.passthrough()` to prevent stripping un-modeled ERP columns.
- **CSRF Token Resolution**: Attendance, Timetable, and Marks POST endpoints require a valid CSRF token. SWR hooks must extract `csrfToken` from `sessionStorage.getItem('kl_erp_csrf_token')` or fall back gracefully.
- **Node.js Package Installation**: If `npm install swr zod` cannot be executed due to environment restrictions, fallback implementations (a custom event-bus SWR hook and lightweight custom validator object) are documented in `analysis.md`.

---

## 4. Conclusion
The codebase is ready for Milestone 1 implementation. Detailed design specifications, schema definitions, and SWR hook interfaces have been documented in `analysis.md`. The implementation requires installing `swr` and `zod`, creating `src/lib/schemas/*.ts`, implementing `src/hooks/use*.ts`, and refactoring the dashboard pages to consume these hooks.

---

## 5. Verification Method

### Files to Inspect
1. `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_1\analysis.md`
2. `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_1\handoff.md`

### Independent Verification Steps
1. Run `npx tsc --noEmit` to verify TypeScript syntax across existing files.
2. Run `npm run test` (`npx tsx --test src/lib/scraper.test.ts`) to verify existing unit tests pass.
3. Verify that `analysis.md` contains complete type definitions and implementation plans for all 5 SWR hooks (`useAttendance`, `useTimetable`, `useMarks`, `useFee`, `useProfile`) and all 6 Zod schema files (`attendance.ts`, `timetable.ts`, `marks.ts`, `fee.ts`, `profile.ts`, `login.ts`).
