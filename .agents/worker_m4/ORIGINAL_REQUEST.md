## 2026-07-24T00:50:09Z

You are Implementation Worker M4 for Milestone M4 (R4. Timetable Page & Dashboard Widget Robustness).
Your working directory is C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4.
Project root is C:\Users\speed\Documents\antigravity\optimistic-pascal.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task Scope (Requirement R4):
Ensure `src/app/dashboard/timetable/page.tsx` and `src/app/dashboard/page.tsx` ("Today's Schedule") handle matrix timetables, list timetables, day name variants (e.g. Mon vs Monday), and empty/error states without loading freezes.

Specific Instructions:
1. Read the design and specifications in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m4\handoff.md`.
2. Create `src/lib/timetable-parser.ts`:
   - Layout classification engine (`matrix_days_columns`, `matrix_days_rows`, `list_rows`).
   - Day name normalizer (`normalizeDay`, `isSameDay`) mapping 'Mon', 'Monday', '1', 'Day 1', etc.
   - Smart cell content parser (`parseCellContent`) extracting course code, course title, room/venue, and faculty cleanly.
   - `parseTimetable(rawRows)` producing structured `ParsedTimetable` and `NormalizedClassSession[]`.
3. Refactor `TodayScheduleWidget` in `src/app/dashboard/page.tsx`:
   - Use `parseTimetable` to normalize timetable rows regardless of matrix or list layout.
   - Filter today's classes using `isSameDay`.
   - Add client-side `sessionStorage` caching (`kl_timetable_${year}_${sem}`).
   - Provide clean UI states for loading skeletons, weekend/empty classes ("No classes scheduled for today"), and error state with retry.
4. Refactor `src/app/dashboard/timetable/page.tsx`:
   - Use `parseTimetable` and `sessionStorage` caching.
   - Provide Dual View Modes: Grid View (interactive weekly matrix grid with active day tabs) and List View (class cards with search filter, day filter, CSV export).
   - Provide robust fallback states for loading, empty results, and fetch errors.
5. Run `npm run build` and ensure 0 TypeScript and Next.js build errors.
6. Document all changes and build output in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4\handoff.md`.
7. Send a completion message back to parent orchestrator.
