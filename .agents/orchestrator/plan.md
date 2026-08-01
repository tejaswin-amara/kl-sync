# Plan: Timetable Parsing & UI Rendering Repair

## Objective
Investigate and resolve timetable parsing and UI rendering failures in KL Sync dashboard (`/dashboard/timetable`). Fix HTML parsing logic in `src/lib/scraper.ts` & `src/lib/timetable-parser.ts`, fix UI rendering in `src/app/dashboard/timetable/page.tsx`, create unit test `src/lib/scraper.test.ts` mocking an ERP timetable HTML payload, run tests (`npm test`), and verify clean Next.js production build (`npm run build`).

## Milestones & Work Items
1. **M7: Timetable Data Parsing & UI Investigation** (STATUS: DONE)
   - Explored `src/lib/scraper.ts`, `src/lib/timetable-parser.ts`, `src/app/dashboard/timetable/page.tsx`, `src/app/api/timetable/route.ts`, and related types/data fetching.
   - Identified 5 distinct root causes for timetable parsing failures, missing day order mappings, suffix resolution failures, cell parsing regex bugs, 12-hour time slot sorting bugs, and period display gaps.

2. **M8: Timetable Fix & Unit Test Implementation** (STATUS: DONE)
   - Fixed course title lookup in `timetable/page.tsx` by stripping component suffixes (`[-_][LTPSS]$`).
   - Fixed `normalizeDay` and expanded `DAY_MAP` coverage in `timetable-parser.ts` for all Day Order variations (`DAY ORDER 1-7`, `DO 1-7`, `D1-7`, `day1-7`, `Mon-Sun`).
   - Refactored `parseCellContent` in `timetable-parser.ts` to make room optional and explicitly exclude section strings (`S-10`) from room candidates.
   - Added `parseTimeSlotToMinutes` in `timetable/page.tsx` for chronological 12-hour time slot sorting.
   - Created `src/lib/scraper.test.ts` with 12 unit tests using `node:test` and configured `"test": "npx tsx --test src/lib/scraper.test.ts"` in `package.json`.
   - Verified `npm test` (12/12 passing) and `npm run build` (0 errors).

3. **M9: Independent Review & Verification** (STATUS: DONE)
   - Conducted independent review of code changes, styling consistency, test coverage, and build outcomes. Verdict: APPROVE.

4. **M10: Forensic Integrity Audit** (STATUS: DONE)
   - Independent verification pass ensuring no test result hardcoding, fake mocks, or integrity violations. Verdict: CLEAN.

## Execution Summary
- All milestones M7 through M10 are complete and verified.
