# Comprehensive UI & Route Analysis Report: KL Sync (`src/app/`)

**Author**: teamwork_preview_explorer_m1_2  
**Date**: 2026-08-02  
**Scope**: All 7 primary dashboard routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`), secondary routes (`circulars`, `exam-seating`, `hostels`, `library`, `tools`), UI components (`src/components/`), custom hooks (`src/hooks/`), and utilities (`src/lib/`).

---

## Executive Summary

The frontend of KL Sync is built using Next.js App Router (React 18), Tailwind CSS, and Lucide React icons. It provides a client-side rendered dashboard interface that communicates with the ERP backend via internal Next.js API proxy routes (`/api/erp-proxy/*`). 

While the data parsing utilities (`timetable-parser.ts`, `fee-utils.ts`, `cgpa.ts`) are robust and handle dirty/unstructured ERP data effectively, the UI and page routes contain several code quality issues:
1. **Dead Code & Unused Components**: An empty directory `src/components/ui/` exists, and several exported components in `src/components/attendance-calculator.tsx` (such as `LTPSCalculator` and custom `Card`/`Alert` primitives) are never imported or rendered anywhere in the application.
2. **Redundant React State Wrapper Anti-Pattern**: Widespread use of `queueMicrotask(() => { setState(...) })` inside `useEffect` hooks across almost every page component and custom hook, adding unnecessary microtask queue overhead.
3. **Styling & Layout Vulnerabilities**: Forced root dark mode with broken/missing CSS variables (e.g., `bg-[var(--color-primary-variant)]` in `profile/page.tsx`), duplicate `@keyframes` definitions in `globals.css`, non-functional header buttons ("Current Sem"), and matrix grid layout overflow on smaller viewports.

---

## 1. Route-by-Route Investigation Findings

### Route 1: `/` — Login Page (`src/app/page.tsx`)
- **ERP Data Received & Flow**:
  - GET `/api/captcha`: Returns `captchaImage` (base64) and auto-solved `solvedCaptcha` (if available), along with `x-session-id` header.
  - POST `/api/login`: Accepts `username`, `password`, `captcha`, `captchaToken`, and `deviceId`. Returns `sessionId`, `csrfToken`, `academicYears`, and `semesters`.
  - Storage: Stores session cookie (`kl_erp_session`), `sessionStorage` (`kl_erp_session_id`, `kl_erp_csrf_token`), and `localStorage` (`kl_erp_academic_years`, `kl_erp_semesters`, `kl_erp_year`, `kl_erp_sem`, `studentId`).
- **Code Audit Issues**:
  - Lines 65-78, 85-89: Wrapping `setSessionId`, `fetchCaptcha`, `setDeviceId`, `setUsername`, `setPassword` inside `queueMicrotask` within `useEffect`.
  - Redundant State: `sessionId` and `deviceId` are held in React state as well as `localStorage`/`sessionStorage`.

---

### Route 2: `/dashboard` — Main Dashboard Overview (`src/app/dashboard/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches from 6 ERP proxy endpoints: `/api/erp-proxy/cgpa`, `/api/erp-proxy/attendance`, `/api/erp-proxy/fee`, `/api/erp-proxy/timetable`, `/api/erp-proxy/marks`, `/api/erp-proxy/profile`.
  - Overview calculates CGPA/credits via `processERPDataForCGPA`, total attendance % from row key scanning, pending fee balance via `calculatePendingFee`, today's class schedule via `TodayScheduleWidget`, and active courses via `CurrentCoursesWidget`.
- **Code Audit Issues**:
  - **Over-fetching & Redundant API Calls**: `TodayScheduleWidget` (lines 390-402) fetches `/api/erp-proxy/profile` AND `/api/erp-proxy/marks` concurrently just to build a course code to course title/faculty lookup map before fetching `/api/erp-proxy/timetable`. Meanwhile, `CurrentCoursesWidget` (lines 751-787) independently fetches `/api/erp-proxy/profile` and `/api/erp-proxy/marks` again!
  - Lines 39, 99, 551: Unnecessary `queueMicrotask` wrappers around `setState` inside `useEffect`.

---

### Route 3: `/dashboard/timetable` — Timetable (`src/app/dashboard/timetable/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches `/api/erp-proxy/timetable` (POST with `academicYear`, `semesterId`, `csrfToken`).
  - Enriches raw timetable rows with course descriptions and faculty names by fetching `/api/erp-proxy/profile` and `/api/erp-proxy/marks`.
  - Uses `parseTimetable` (`src/lib/timetable-parser.ts`) to normalize days, periods, course codes, rooms, and sections.
- **Code Audit Issues**:
  - **Sibling Year Scan Loop** (lines 263-288): If the selected academic year returns 0 rows, it enters a `for...of` loop sequentially making HTTP requests to `/api/erp-proxy/timetable` for all sibling academic years. This can trigger 3-4 consecutive POST requests if data is empty.
  - **Layout Truncation / Overflow Risk**: In Grid View (line 570), table uses `min-w-max` with fixed column widths (`min-w-[170px]`) for periods, creating a total table width exceeding 1400px. On mobile devices, this forces heavy horizontal scrolling inside a nested scroll container.
  - Lines 326, 332, 336: `queueMicrotask` wrapper anti-pattern in `useEffect`.

---

### Route 4: `/dashboard/attendance` — Attendance (`src/app/dashboard/attendance/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches `/api/erp-proxy/attendance` (POST).
  - Dynamically extracts columns and renders interactive rows with attendance threshold indicators (≥85% Green, 75–84% Yellow, <75% Red).
  - Calculates live projections (e.g. "Need X classes" or "Safe to skip Y classes") inline during rendering (lines 188–215).
- **Code Audit Issues**:
  - Line 61: `queueMicrotask(() => fetchData())` inside `useEffect`.
  - Inconsistent Typography Classes: Uses non-standard CSS class `md-h5` on line 133 (`<p className="md-h5 text-red-400">`).

---

### Route 5: `/dashboard/marks` — Marks & Grades (`src/app/dashboard/marks/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches `/api/erp-proxy/marks` (POST).
  - Renders tabular list of marks, grade points, and letter grades.
  - Supports search filtering (`searchQuery`) and CSV export (`exportTableToCSV`).
- **Code Audit Issues**:
  - Line 63: `queueMicrotask(() => fetchData(selectedYear, selectedSem))` inside `useEffect`.

---

### Route 6: `/dashboard/profile` — Student Profile (`src/app/dashboard/profile/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches `/api/erp-proxy/profile` (GET).
  - Parses student name, university ID, photo URL, scalar attributes (branch, section, semester, etc.), and array attributes (registered courses, academic history).
- **Code Audit Issues**:
  - **Undefined CSS Variables**: Line 99 uses `bg-[var(--color-primary-variant)]` and `border-[var(--color-primary)]`. `--color-primary-variant` is NOT defined anywhere in `globals.css` (only `--primary` exists), rendering the profile header banner background as transparent instead of themed.
  - Line 19: `queueMicrotask` wrapper inside `useEffect`.

---

### Route 7: `/dashboard/fee` — Fee Details (`src/app/dashboard/fee/page.tsx`)
- **ERP Data Received & Flow**:
  - Fetches `/api/erp-proxy/fee` (GET).
  - Parses fee heads, total fee, paid amount, and due balance via `fee-utils.ts`. Renders status tags (`CheckCircle` for Paid, `Clock` for Pending).
- **Code Audit Issues**:
  - Line 66: Inconsistent `md-h5` typography class used in error state (`<p className="md-h5 text-red-400">`).

---

## 2. Component & Global Asset Audit

### A. Dead Code & Unused UI Assets
1. **Empty `src/components/ui/` Directory**: Directory exists in the file system but contains 0 files.
2. **Unused Components in `src/components/attendance-calculator.tsx`**:
   - `LTPSCalculator` (lines 356–546): Never imported anywhere in `src/app`.
   - Primitive UI Wrappers: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Alert`, `AlertTitle`, `AlertDescription` (lines 12–73) are exported but never imported anywhere. Only `SimpleCalculator` is used (in `src/app/dashboard/tools/page.tsx`).
3. **Duplicate CSS Keyframes in `src/app/globals.css`**:
   - Lines 46–48 define `@keyframes blob-a` and `@keyframes blob-b`.
   - Lines 50–56 re-define `@keyframes blob-a` and `@keyframes blob-b` immediately below with slightly different transform values.

### B. Navigation & Layout Bloat (`src/components/Navigation.tsx`)
1. **Non-functional UI Elements**:
   - Line 294: Desktop header contains a `<button>` titled "Current Sem" with active hover styles but NO `onClick` handler or dynamic data binding.
2. **Duplicated Avatar Rendering Code**:
   - Lines 159–176 (Mobile header) and lines 308–328 (Desktop header) contain identical, 20-line JSX blocks for fetching and rendering profile photos with fallback initials.
3. **Redundant Profile Fetching**:
   - Lines 57–86: `Navigation.tsx` performs its own fetch to `/api/erp-proxy/profile` on mount if `kl_student_name` is missing from `localStorage`.

---

## 3. Summary Matrix of Findings

| Route / Component | Dead Code / Unused Imports | Redundant State / Microtasks | Styling & Responsiveness Issues | ERP Parsing & Rendering |
|---|---|---|---|---|
| `/` (`page.tsx`) | None | `queueMicrotask` in `useEffect` (x3), `sessionId`/`deviceId` state redundancy | Hardcoded zinc dark themes | Parses session & semester arrays accurately |
| `/dashboard` | None | `queueMicrotask` (x3), redundant profile & marks fetches across widgets | Card hover scale effects OK | CGPA, attendance %, fee totals calculated correctly |
| `/dashboard/timetable` | Sibling year fallback loop rarely needed | `queueMicrotask` (x3) | Matrix grid table min-width >1400px causes scroll bloat | Handles 3 layout formats via `parseTimetable` |
| `/dashboard/attendance` | None | `queueMicrotask` (x1) | Non-standard `md-h5` class | Color-coded thresholds & projection formulas |
| `/dashboard/marks` | None | `queueMicrotask` (x1) | None | Dynamic column mapping & CSV export |
| `/dashboard/profile` | None | `queueMicrotask` (x1) | `bg-[var(--color-primary-variant)]` undefined | Parses scalar vs array attributes & photo fallback |
| `/dashboard/fee` | None | None | Non-standard `md-h5` class | `parseCurrency` handles ₹, $, accounting parens |
| `Navigation.tsx` | None | `queueMicrotask` (x1), redundant profile fetch | Unhandled "Current Sem" button, duplicated profile picture JSX | Reads cached student name & photo |
| `attendance-calculator.tsx` | `LTPSCalculator`, `Card*`, `Alert*` unused | None | None | `SimpleCalculator` formulas verified |
| `globals.css` | Duplicate `@keyframes blob-a`/`blob-b` | N/A | Missing `--color-primary-variant` token | N/A |
| `components/ui/` | Entire directory is empty | N/A | N/A | N/A |
