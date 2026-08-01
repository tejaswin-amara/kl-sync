# Original User Request

## 2026-08-01T08:11:31Z

You are the Project Orchestrator for the Timetable Grid & Data Parsing Fix task.
Please read ORIGINAL_REQUEST.md at C:/Users/speed/Documents/antigravity/optimistic-pascal/.agents/ORIGINAL_REQUEST.md.
Your working directory is C:/Users/speed/Documents/antigravity/optimistic-pascal/.agents/orchestrator.

Your objective:
1. Re-structure the timetable grid UI in `src/app/dashboard/timetable/page.tsx` so that Days/Day Orders (Monday–Sunday / Day Order 1–7) are listed vertically down the left column (Y-axis) as row headers, and Periods (Period 1, Period 2, ..., Period N) are listed horizontally across the top row (X-axis) as column headers.
2. Fix `src/lib/timetable-parser.ts` and `src/lib/scraper.ts` to ensure that all class sessions per day are preserved without overwriting or dropping slots. Support parsing and vertically stacking multiple class/lab/skill sessions occurring within the same day/period slot.
3. Ensure horizontal scrolling container for period columns is smooth, sticky left day headers stay aligned during scroll, and empty period slots render cleanly without breaking grid alignment.
4. Update/add unit tests in `src/lib/scraper.test.ts` to verify `parseTimetable` generates complete matrix grids for both `matrix_days_rows` and `matrix_days_columns` formats.
5. Ensure `npm run build` succeeds with zero TypeScript or lint errors.

Organize your specialists (explorers, workers, reviewers), maintain your plan.md and progress.md in `.agents/orchestrator/`, and report completion when all acceptance criteria are met.
