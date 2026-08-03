## 2026-08-02T17:34:27Z
You are teamwork_preview_worker_m2.
Your working directory is `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_worker_m2`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Execute Milestone M2: Ponytail Optimization, Code Cleanup, and Unit Test Verification across `src/`.

Tasks to perform:
1. Dead Code & Bloat Removal:
   - Remove unused exported `LTPSCalculator` and unused `Card*`/`Alert*` primitive components in `src/components/attendance-calculator.tsx`.
   - Remove duplicate `@keyframes blob-a` in `src/app/globals.css`.
   - Prune unused exported constants in `src/lib/constants.ts`.
   - Make internal helper functions module-private in `src/lib/cgpa.ts` (`mapGradeToPoints`, `parseNumericValue`) and `src/lib/fee-utils.ts` (`findExplicitDueKey`, `findDueAmountKey`, `getPendingAmountForRow`).
   - Remove unused `preferHeadingText` in `src/lib/scrapers/http-jar.ts`.
2. UI & Styling Fixes:
   - Fix missing CSS variable `--color-primary-variant` usage in `src/app/dashboard/profile/page.tsx` (replace with standard dark tailwind class e.g. `bg-zinc-900` or `bg-slate-900` matching dark theme).
   - Replace non-existent `md-h5` class in `src/app/dashboard/attendance/page.tsx` and `src/app/dashboard/fee/page.tsx` with standard Tailwind font size classes (e.g., `text-xl font-semibold`).
   - Deduplicate profile picture JSX in `src/components/Navigation.tsx`.
3. State Cleanup:
   - Refactor redundant `queueMicrotask(() => setState(...))` calls inside `useEffect` across client components (`page.tsx`, `Navigation.tsx`, `useAcademicSession.ts`, dashboard route pages) to direct `setState(...)` calls.
4. Verification:
   - Run `npx tsc --noEmit` and confirm 0 type errors.
   - Run `npm test` (`npx tsx --test src/**/*.test.ts`) and confirm all 19 unit tests pass.
5. Create handoff report in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_worker_m2\handoff.md` detailing all edits, command outputs, and verification results. Message parent orchestrator when complete.
