# Handoff Report — Timetable Module Investigation

**Sender**: Explorer 3 (`teamwork_preview_explorer`)  
**Working Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_timetable\`  
**Target Module**: Timetable (`/dashboard/timetable`, `src/lib/scraper.ts`, `src/lib/timetable-parser.ts`, `src/app/dashboard/timetable/page.tsx`)  
**Handoff Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct observations from codebase inspection:

1. **Course Code / Profile Title Lookup Mismatch**:
   - `src/app/dashboard/timetable/page.tsx:180-181`:
     ```ts
     const info = courseLookup[s.courseCode.toUpperCase()];
     ```
   - Contrast with `src/app/dashboard/page.tsx:381-384, 396-397`:
     ```ts
     const strippedCode = rawCode.replace(/[-_][LTPSS]$/i, '').trim();
     const info = courseLookup[rawCode] || courseLookup[strippedCode];
     ```
   - In `timetable/page.tsx`, `s.courseCode` extracted from cells often includes component suffixes (e.g. `25CS1302E-L`), while profile/marks data returns base course codes (`25CS1302E`). No suffix stripping is performed, causing lookup failure.

2. **Day Normalization Failure**:
   - `src/lib/timetable-parser.ts:145`:
     ```ts
     const clean = dayStr.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').trim();
     ```
   - `src/lib/timetable-parser.ts:65-124` (`DAY_MAP`):
     Mapped entries only include single-space strings like `'day order 1'`. Replacing `-` in `"DAY ORDER - 1"` leaves double spaces `"day order  1"`. Token splitting produces `["day", "order", "1"]`. Neither matches `DAY_MAP['day order 1']`, returning `null`.
   - `src/app/dashboard/timetable/page.tsx:430-462`: `daysToRender` strictly iterates over `['Monday', ..., 'Sunday']`. When `normalizeDay` returns `null`, sessions on unmapped days are hidden from Grid View.

3. **Cell Parsing Bug in `parseCellContent`**:
   - `src/lib/timetable-parser.ts:197`:
     ```ts
     const klRegex = /([A-Z0-9]{5,10})[-_]([LTPSS])\b.*?\b(S-\d+|\w+)\b.*?\b(?:RoomNo|Room|Hall|Lab|Venue)?[-:\s]*([A-Z0-9-]+)/i;
     ```
   - Requires 4 capture groups including Room. Fails for cells without room (e.g. `"25CS1302E-L - S-10"`).
   - In `"25CS1302E-L - S-10"`, `\w+` matches `"S"`, and `([A-Z0-9-]+)` matches `"10"`, incorrectly setting `section: "S"` and `room: "10"`.
   - `src/lib/timetable-parser.ts:218, 237`: `faculty: ''` is hardcoded to empty string.

4. **Time Slot Sorting Bug**:
   - `src/app/dashboard/timetable/page.tsx:465-474`:
     ```ts
     return a.localeCompare(b);
     ```
   - Clock time strings like `"01:10 PM - 02:00 PM"` and `"09:00 AM - 09:50 AM"` return `NaN` when converted with `Number()`. Alphabetical sorting places `"01:10 PM"` before `"09:00 AM"`.

5. **Period Row Hiding Bug**:
   - `src/app/dashboard/timetable/page.tsx:489`:
     ```ts
     if (!hasAnyClass && sortedTimeSlots.length > 0) return null;
     ```
   - Hides periods without scheduled sessions, rendering discontinuous grids (e.g. P1, P3, P4 without P2).

6. **Test Framework Infrastructure**:
   - `package.json` contains no `"test"` script and no test runner dependencies (`vitest`, `jest`, `playwright`).
   - No `vitest.config.ts` or `jest.config.js` exists in the repository.

---

## 2. Logic Chain

1. **Observation 1** demonstrates that `timetable/page.tsx` fails to strip component suffixes (`[-_][LTPSS]$`) when matching course codes against `courseLookup`.  
   **Inference**: Profile/Marks data keying (`25CS1302E`) never matches session codes (`25CS1302E-L`). Therefore, human-readable course titles and faculty names are not populated in the timetable view.

2. **Observation 2** demonstrates that `normalizeDay` fails on double spaces from hyphen removal (e.g. `"DAY ORDER - 1"`) and unlisted alias formats (`"DO 1"`, `"DAY ORDER 01"`).  
   **Inference**: Unrecognized day strings return `null`. Since Grid View (`page.tsx`) explicitly loops over `['Monday', ..., 'Sunday']`, any sessions on unrecognized day orders are omitted from the rendered matrix.

3. **Observation 3** demonstrates that `klRegex` mandates 4 match groups and misparses section hyphens (`S-10` -> `section: S`, `room: 10`).  
   **Inference**: Cell parsing corrupts section/room metadata and sets `faculty: ''`, degrading table accuracy.

4. **Observation 4** demonstrates that non-numeric time slots are sorted via `localeCompare`.  
   **Inference**: String comparison places `"01:10 PM"` ahead of `"09:00 AM"`, causing afternoon periods to display at the top of the schedule.

5. **Observation 5** shows that periods with zero sessions across all days return `null` in Grid View.  
   **Inference**: Free periods disappear from the matrix table, causing visual gap defects in period numbers.

---

## 3. Caveats

- **Live ERP Payload Variation**: Live ERP server responses could not be dynamically fetched during read-only investigation. Analysis is based on static code parsing, scraper structure, and mock script `src/scripts/test-timetable.ts`.
- **No Test Framework**: Because no test runner exists, verification relies on TypeScript compilation (`npx tsc --noEmit`), ESLint (`npm run lint`), and manual verification or standalone Node scripts.

---

## 4. Conclusion

The timetable module breaks due to 5 distinct root causes across `src/lib/timetable-parser.ts`, `src/app/dashboard/timetable/page.tsx`, and `src/lib/scraper.ts`:
1. Unstripped course code component suffixes breaking profile course title lookup.
2. Incomplete day normalization logic causing day order schedules to be omitted from Grid View.
3. Overly rigid regex parsing in `parseCellContent` corrupting section and room numbers.
4. Alphabetical string comparison of 12-hour time slots causing afternoon periods to sort above morning periods.
5. Grid view hiding empty period rows, causing visual breaks in period numbering.

---

## 5. Verification Method

To independently verify findings and future fixes:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **ESLint Audit**:
   ```bash
   npm run lint
   ```
3. **Execution Script Test**:
   ```bash
   npx tsx src/scripts/test-timetable.ts
   ```
4. **Code Inspection Check**:
   - Inspect `src/app/dashboard/timetable/page.tsx:180` to verify `strippedCode` logic matches `src/app/dashboard/page.tsx:381`.
   - Inspect `src/lib/timetable-parser.ts:145` to verify whitespace collapsing and `DAY_MAP` coverage.
   - Inspect `src/app/dashboard/timetable/page.tsx:465` to verify 24-hour time slot sorting helper.
