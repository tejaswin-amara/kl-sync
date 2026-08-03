# Handoff Report — UI & Dashboard Routes Exploration

**Agent**: teamwork_preview_explorer_m1_2  
**Role**: Explorer  
**Working Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_explorer_m1_2`  
**Target Milestone**: m1_2  

---

## 1. Observation

Direct observations from codebase inspection across `src/app/`, `src/components/`, `src/hooks/`, `src/lib/`:

1. **Empty Directory**:
   - `src/components/ui/` exists as a directory with 0 files (verified via `list_dir`).

2. **Unused Exports / Dead Code**:
   - `src/components/attendance-calculator.tsx`:
     - Lines 12–40: `export function Card(...)`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`.
     - Lines 42–73: `export function Alert(...)`, `AlertTitle`, `AlertDescription`.
     - Lines 356–546: `export function LTPSCalculator(...)`.
     - None of these functions are imported anywhere in `src/app/` or `src/components/` (grep search for `LTPSCalculator` returns 0 hits outside `attendance-calculator.tsx`).
   - `src/app/globals.css`:
     - Lines 46–48: `@keyframes blob-a { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(40px,-55px)scale(1.1)} 70%{transform:translate(-25px,25px)scale(.93)} }`
     - Lines 51–52: `@keyframes blob-a { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(30px,-40px)scale(1.05)} 70%{transform:translate(-20px,20px)scale(.95)} }` (Duplicate definition).

3. **Redundant React State Wrapper Pattern (`queueMicrotask` in `useEffect`)**:
   - `src/components/Navigation.tsx` (lines 52–54): `queueMicrotask(() => { setUser({ name, initials, id, photoUrl: cachedPhoto }); });`
   - `src/app/page.tsx` (lines 65–67, 70–72, 76–78, 85–89): Multiple `queueMicrotask` calls wrapping `setSessionId`, `fetchCaptcha`, `setDeviceId`, `setUsername`, `setPassword`.
   - `src/app/dashboard/page.tsx` (lines 39, 99, 551): `queueMicrotask` wrapping state setters.
   - `src/app/dashboard/timetable/page.tsx` (lines 326, 332, 336): `queueMicrotask` wrapping `setLoading` and `fetchData`.
   - `src/app/dashboard/attendance/page.tsx` (line 61): `queueMicrotask(() => { fetchData(); });`
   - `src/app/dashboard/marks/page.tsx` (line 63): `queueMicrotask(() => { fetchData(selectedYear, selectedSem); });`
   - `src/app/dashboard/profile/page.tsx` (line 19): `queueMicrotask` wrapping `setData` & `setLoading`.
   - `src/app/dashboard/tools/page.tsx` (line 79): `queueMicrotask` wrapping `fetchData`.
   - `src/hooks/useAcademicSession.ts` (lines 73, 82): `queueMicrotask` wrapping `setYears`, `setSemesters`, `setSelectedYear`, `setSelectedSem`, `setSessionError`.

4. **Missing/Undefined CSS Variable**:
   - `src/app/dashboard/profile/page.tsx` (line 99): `<div className="bg-[var(--color-primary-variant)] p-4 sm:p-6 relative">`. `--color-primary-variant` is NOT defined in `src/app/globals.css`.

5. **Non-Functional UI Elements & Duplication**:
   - `src/components/Navigation.tsx` (line 294): `<button className="...">Current Sem</button>` has hover styles but no `onClick` event handler or state attachment.
   - `src/components/Navigation.tsx` (lines 159–176 vs 308–328): Identical 20-line JSX profile picture rendering block duplicated between Mobile Header and Desktop Header.
   - `src/app/dashboard/attendance/page.tsx` (line 133) & `src/app/dashboard/fee/page.tsx` (line 66): `<p className="md-h5 text-red-400">` uses non-existent CSS utility `md-h5`.

6. **ERP Data Parsing & Rendering Verification**:
   - Route `/`: Authenticates via POST `/api/login`, saves `kl_erp_session` cookie and `kl_erp_year`/`kl_erp_sem` in `localStorage`.
   - Route `/dashboard`: Aggregates CGPA (`cgpa.ts`), Attendance %, Pending Fee (`fee-utils.ts`), Today's Schedule (`timetable-parser.ts`), and Active Courses.
   - Route `/dashboard/timetable`: `parseTimetable` in `timetable-parser.ts` normalizes 3 layout formats (matrix col, matrix row, list), course codes, components, rooms, and sections.
   - Route `/dashboard/attendance`: Color-coded thresholds and live attendance projections ("Need X classes" / "Safe to skip Y").
   - Route `/dashboard/marks`: Dynamic table rendering, search query filter, CSV export.
   - Route `/dashboard/profile`: Dynamically splits scalar attributes (rendered in info grid) and array attributes (rendered in tabbed data tables).
   - Route `/dashboard/fee`: `parseCurrency` handles ₹, $, accounting parens `(1,500.00)`, status badges for paid vs pending.

---

## 2. Logic Chain

1. **Observation 1 & 2** show empty directories (`components/ui`), unused primitives/calculators (`LTPSCalculator` in `attendance-calculator.tsx`), and duplicate CSS keyframe rules (`@keyframes blob-a` in `globals.css`).
   - *Inference*: Scaffolding leftovers and abandoned component primitives add dead bytes to the bundle and clutter the project structure.

2. **Observation 3** shows 15+ instances of `queueMicrotask(() => setState(...))` inside React `useEffect` hooks across `page.tsx`, `Navigation.tsx`, `useAcademicSession.ts`, and 6 dashboard route pages.
   - *Inference*: In React 18, state updates triggered inside `useEffect` are already batched and run asynchronously. Explicitly wrapping `setState` calls in `queueMicrotask` is an anti-pattern that creates unnecessary microtask scheduling overhead and micro-task stack frames without providing state consistency benefits.

3. **Observation 4 & 5** highlight styling bugs (`--color-primary-variant` missing, undefined `md-h5` class), a non-interactive header button ("Current Sem"), and duplicated avatar JSX.
   - *Inference*: The profile page header banner renders with a transparent background due to the missing variable. The "Current Sem" button gives users a false affordance of interactivity.

4. **Observation 6** confirms ERP data flow is functionally sound across all 7 routes:
   - Data is properly received from `/api/erp-proxy/*`, passed to domain parsers (`timetable-parser.ts`, `fee-utils.ts`, `cgpa.ts`), and safely rendered with fallbacks for null/empty data.

---

## 3. Caveats

- **Network Restrictions**: Investigation was conducted strictly via static read-only analysis of source code (`src/app/`, `src/components/`, `src/hooks/`, `src/lib/`). Live network proxy behavior against a real KL ERP endpoint was not executed live.
- **Assumptions**: We assume Next.js 15 / React 18 default batching behavior applies across all client components tagged with `'use client'`.

---

## 4. Conclusion

The application's core ERP data processing pipeline across all 7 dashboard routes is robust and functional. However, the codebase exhibits frontend bloat and state management anti-patterns:
- **Dead Code**: Remove `src/components/ui/`, unused `LTPSCalculator` and primitives in `attendance-calculator.tsx`, and duplicate keyframes in `globals.css`.
- **State Cleanup**: Refactor redundant `queueMicrotask` calls in `useEffect` hooks to direct state setter calls across all route pages and `useAcademicSession.ts`.
- **UI Fixes**: Define `--color-primary-variant` (or replace with standard Tailwind token e.g. `bg-zinc-900`), deduplicate profile avatar rendering in `Navigation.tsx`, and wire up or remove the "Current Sem" header button.

---

## 5. Verification Method

To verify these findings independently:

1. **Inspect Dead Code**:
   - Check `src/components/ui/` (empty).
   - Search for usages of `LTPSCalculator` across `src/`:
     ```bash
     grep -rn "LTPSCalculator" src/
     ```
     (Will confirm 0 matches outside its definition file).

2. **Inspect Undefined CSS Variable**:
   - Inspect line 99 of `src/app/dashboard/profile/page.tsx` and search `src/app/globals.css` for `--color-primary-variant`.

3. **Inspect Microtask Pattern**:
   - View `src/hooks/useAcademicSession.ts` lines 73–79 and `src/components/Navigation.tsx` lines 52–54 to observe `queueMicrotask` wrapping React state setters inside `useEffect`.
