## 2026-08-01T06:37:59+05:30
<USER_REQUEST>
You are Worker 3 (teamwork_preview_worker).
Working Directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_timetable
Project Root: C:\Users\speed\Documents\antigravity\optimistic-pascal

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context:
Explorer 3 conducted a technical investigation of the broken timetable page (`/dashboard/timetable`). Read Explorer 3's findings at:
- `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_timetable\handoff.md`
- `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_timetable\analysis.md`

Tasks to Complete:

1. **Fix Course Code & Title Resolution (`src/app/dashboard/timetable/page.tsx`)**:
   - In `timetable/page.tsx` line 180, strip component suffixes (`[-_][LTPSS]$`) when matching timetable course codes against `courseLookup`, matching `src/app/dashboard/page.tsx`:
     `const strippedCode = rawCode.replace(/[-_][LTPSS]$/i, '').trim();`
     `const info = courseLookup[rawCode] || courseLookup[strippedCode] || courseLookup[rawCode.toUpperCase()] || courseLookup[strippedCode.toUpperCase()];`

2. **Fix Day Normalization & DAY_MAP Coverage (`src/lib/timetable-parser.ts`, `src/lib/scraper.ts`)**:
   - In `normalizeDay`, collapse multiple spaces (`replace(/\s+/g, ' ')`) after removing hyphens/special chars so `"DAY ORDER - 1"` becomes `"day order 1"`.
   - Expand `DAY_MAP` to include day order variations: `"day order 1"` through `"day order 7"`, `"day order 01"` through `"day order 07"`, `"do 1"` through `"do 7"`, `"d1"` through `"d7"`, `"day 1"` through `"day 7"`, as well as standard short/full day names (`"mon"`, `"monday"`, etc.).

3. **Fix Cell Content Parser (`src/lib/timetable-parser.ts`)**:
   - Fix `klRegex` and parsing logic in `parseCellContent` so room matching is optional and cells without room numbers (e.g. `"25CS1302E-L - S-10"`) are parsed correctly.
   - Prevent section strings like `"S-10"` from being split into `section: "S"` and `room: "10"`.
   - Preserve faculty information if present in cell data or course lookup.

4. **Fix Time Slot Sorting & Period Display (`src/app/dashboard/timetable/page.tsx`)**:
   - Fix time slot sorting so 12-hour time strings (e.g. `"09:00 AM"`, `"01:10 PM"`) are sorted chronologically by converting them to minutes-from-midnight, not string `localeCompare`.
   - Fix empty period hiding logic in Grid View so period numbers don't show discontinuous gaps or blank states.

5. **Create Unit Test Suite (`src/lib/scraper.test.ts`) & Configure Test Runner**:
   - Create `src/lib/scraper.test.ts` mocking an ERP timetable HTML payload (both matrix format and list format tables).
   - Verify that `parseTimetable` / `fetchTimetableData` / `parseGenericTable` correctly extract day, period, time, course code, section, room, and title without throwing exceptions or hanging.
   - Check `package.json` and configure `"test"` script (e.g. `tsx --test src/lib/scraper.test.ts` or `node --import tsx --test src/lib/scraper.test.ts` or `vitest` / `node --test` / `jest` appropriate for the environment) so `npm test` executes the unit test suite cleanly.

6. **Run Verification Commands**:
   - Run `npm test` and verify that all unit tests pass with 0 errors.
   - Run `npx tsc --noEmit` and `npm run lint` (or `make lint`).
   - Run `npm run build` and verify Next.js production build completes with zero TypeScript or build errors.

Document all changes, test outputs, build outputs, and verification results in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_timetable\handoff.md`.
</USER_REQUEST>
