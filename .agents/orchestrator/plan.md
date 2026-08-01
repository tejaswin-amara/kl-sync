# Plan: Timetable Grid Re-orientation & Data Parsing Fix

## Objective
Re-structure the timetable grid UI in `src/app/dashboard/timetable/page.tsx` so that Days/Day Orders are listed vertically on the Y-axis as row headers and Periods are listed horizontally across the X-axis as column headers. Update `src/lib/timetable-parser.ts` and `src/lib/scraper.ts` to preserve all class sessions per day without overwriting, vertically stacking multiple sessions per day/period slot, and support matrix format normalization (`matrix_days_rows` and `matrix_days_columns`). Update `src/lib/scraper.test.ts` unit tests and verify clean production build (`npm run build`).

## Milestones & Work Items
1. **M11: Timetable Grid & Parsing Investigation** (STATUS: IN_PROGRESS)
   - Investigate `src/app/dashboard/timetable/page.tsx`, `src/lib/timetable-parser.ts`, `src/lib/scraper.ts`, and `src/lib/scraper.test.ts`.
   - Analyze requirements for Y-axis Days / X-axis Periods orientation, multi-session stacking, sticky left headers, and matrix format support (`matrix_days_rows`, `matrix_days_columns`).

2. **M12: Grid Re-orientation, Multi-Session Parsing & Test Suite Implementation** (STATUS: PLANNED)
   - Re-structure UI layout in `src/app/dashboard/timetable/page.tsx` (Days as `<th>` inside `<tbody>` rows, Periods as `<th>` inside `<thead>`).
   - Fix `src/lib/timetable-parser.ts` and `src/lib/scraper.ts` to store array of sessions per day/period slot instead of overwriting, and transpose `matrix_days_columns` to unified matrix model if needed.
   - Update `src/lib/scraper.test.ts` unit tests to test both `matrix_days_rows` and `matrix_days_columns` HTML parsing.
   - Verify `npm test` and `npm run build` pass cleanly.

3. **M13: Independent Code Quality & UI Review** (STATUS: PLANNED)
   - Conduct independent review of UI grid structure, sticky scrolling, empty cell rendering, multi-session stacking, test coverage, and build results.

4. **M14: Forensic Integrity Audit** (STATUS: PLANNED)
   - Independent verification pass ensuring no test result hardcoding, fake mocks, or integrity violations.

## Execution Summary
- M11 started. Explorer dispatched to investigate codebase.
