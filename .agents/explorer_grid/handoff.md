# Handoff Report: Timetable Grid UI & Data Parsing Fix

## 1. Observation

### 1.1 Current Timetable Grid UI (`src/app/dashboard/timetable/page.tsx`)
- **State & Data Flow**: `TimetablePage` uses `ParsedTimetable` returned by `parseTimetable(rawRows)`. In `grid` view mode (lines 458–652), it renders an HTML `<table>` wrapped in a scrolling container `<div className="p-6 overflow-x-auto custom-scrollbar flex-1">` with `<div className="min-w-[1100px] flex flex-col gap-6">`.
- **Header & Axis Orientation**:
  - The `<thead>` (lines 468–516) renders a top-left corner header `Day / Period` (`sticky left-0 z-20 bg-zinc-900/95 backdrop-blur-md min-w-[120px] border-r border-white/10 text-indigo-400 text-center`), followed by period columns (`Period 1`, `Period 2`, ..., `Period N`) derived from `parsedTT.timeSlotsPresent`.
  - The `<tbody>` (lines 518–648) iterates over days (`Monday` through `Sunday`). Each day is a `<tr>` with a sticky day header `<td className="p-4 sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md font-bold text-xs text-zinc-200 border-r border-white/10 text-center whitespace-nowrap">`.
  - Period cells are rendered via `<td className="p-2.5 vertical-top border-r border-white/5 last:border-r-0 h-32 align-top">`.
- **Session Lookup in UI**:
  - Currently, lines 568 and 579 perform an imperative array filter:
    `const daySessions = parsedTT.sessions.filter((s) => isSameDay(s.day, day));`
    `const matchingSessions = daySessions.filter((s) => s.timeSlot === periodNum || normalizeSlotKey(s.timeSlot) === normalizeSlotKey(periodNum));`
  - Rather than leveraging `parsedTT.matrixGrid[day]?.[periodNum]` directly, the component re-filters the flattened `sessions` array for every cell.
- **Cell Height & Stacking**:
  - Cells have a fixed height class `h-32`. When multiple sessions (e.g. Lecture + Practical, or elective sessions) occur in the same period, cards are rendered in `<div className="flex flex-col gap-2 h-full">`. However, fixed `h-32` can cause overflow or text truncation if 3+ sessions are stacked.

### 1.2 Timetable Parser & Scraper Analysis (`src/lib/timetable-parser.ts` & `src/lib/scraper.ts`)
- **Data Structures**:
  - `NormalizedClassSession`: Represents a single class/lab/skill session (`id`, `day`, `dayShort`, `dayIndex`, `timeSlot`, `courseCode`, `courseTitle`, `component`, `section`, `room`, `faculty`, `rawText`).
  - `TimetableLayoutType`: `'matrix_days_columns' | 'matrix_days_rows' | 'list_rows' | 'unknown'`.
  - `ParsedTimetable`: Contains `layout`, `headers`, `rawRows`, `sessions`, `daysPresent`, `timeSlotsPresent`, and `matrixGrid: Record<string, Record<string, NormalizedClassSession[]>>`.
- **Layout Handling in `parseTimetable`**:
  - `matrix_days_rows`: Row headers in col 0 are days/day orders (`DAY ORDER - 1`), while column headers are period slots (`1`, `2`, `3`).
  - `matrix_days_columns`: Column headers are days (`Monday`, `Tuesday`), while row headers in col 0 are period slots (`Period 1`, `Period 2`).
- **Multi-Session Cell Bug (Data Loss)**:
  - In `src/lib/scraper.ts`, `parseGenericTable` converts `<br>` tags and block elements into spaces (`getNodeText`, lines 472–482).
  - In `src/lib/timetable-parser.ts`, `parseCellContent` (lines 186–301) uses single `.match()` calls (e.g., `klCodeMatch = raw.match(...)`). When an ERP table cell contains multiple sessions separated by `<br>`, newlines, or delimiters, `parseCellContent` extracts **only the first match** and silently drops subsequent sessions.
- **Matrix Normalization & Transposition**:
  - When raw HTML is `matrix_days_columns` (days as columns, periods as rows), `parseTimetable` iterates over rows (periods) and column headers (days).
  - While `matrixGrid[normDay.full][timeSlot]` is populated, `matrixGrid` lacks guaranteed completeness (missing day/slot entries are `undefined` instead of empty arrays `[]`), and slot keys may differ in canonical formatting if not normalized consistently.

### 1.3 Unit Test Coverage (`src/lib/scraper.test.ts`)
- **Existing Coverage**: Tests `normalizeDay` (day order variations DO 1..7), `parseCellContent` (room/section/faculty extraction), `parseGenericTable` & `parseTimetable` for `matrix_days_rows` and `list_rows`, and `normalizeSlotKey`.
- **Missing Coverage**: No unit tests exist for `matrix_days_columns` HTML tables, nor for multi-session cells within a single period slot.

---

## 2. Logic Chain

### 2.1 Re-orienting & Optimizing Grid UI (`src/app/dashboard/timetable/page.tsx`)
1. **Axis Alignment**:
   - The UI already renders Days on the Y-axis (left row headers) and Periods on the X-axis (top column headers).
   - To make this robust across all timetable layouts, the grid MUST consume `parsedTT.matrixGrid[day]?.[periodNum]` directly instead of re-filtering `parsedTT.sessions` array on every render pass.
2. **Horizontal Scrolling & Sticky Day Headers**:
   - Wrap the `<table>` in an outer scroll container `<div className="overflow-x-auto custom-scrollbar">` with inner wrapper `<div className="min-w-[1100px]">`.
   - Top-left corner `<th>` (Intersection of Day/Period):
     `className="p-4 sticky left-0 z-20 bg-zinc-900/95 backdrop-blur-md min-w-[130px] border-r border-white/10 text-indigo-400 font-bold text-xs text-center uppercase tracking-wider"`
   - Row Day Headers (`<td` for Monday–Sunday):
     `className="p-4 sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md font-bold text-xs text-zinc-200 border-r border-white/10 text-center whitespace-nowrap min-w-[130px]"`
   - `sticky left-0` with non-transparent background (`bg-zinc-900/95` and `bg-zinc-950/90`) ensures period columns smoothly scroll underneath the day column without visual bleed. `z-20` for corner and `z-10` for day cells preserve proper z-index stacking over scrollable period content.
3. **Empty Period Cells**:
   - Replace fixed `h-32` with flexible vertical cell height `min-h-[110px] h-auto vertical-top align-top`.
   - Empty period cell markup:
     ```tsx
     <div className="h-full min-h-[90px] rounded-xl border border-dashed border-white/5 bg-zinc-900/10 flex items-center justify-center text-zinc-700/50 text-xs font-mono select-none">
       -
     </div>
     ```
4. **Multi-Session Cell Vertical Stacking**:
   - When `matchingSessions.length > 0`, stack session cards vertically in a flex container:
     ```tsx
     <div className="flex flex-col gap-2 h-full">
       {matchingSessions.map((session, sIdx) => (
         <div
           key={session.id || sIdx}
           className="bg-zinc-900/80 border border-white/10 hover:border-indigo-500/50 p-3 rounded-xl flex flex-col justify-between gap-1.5 shadow-md group transition-all shrink-0"
         >
           {/* Component & Section Badges */}
           <div className="flex items-center justify-between gap-1">
             {session.component && (
               <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                 session.component === 'Lecture' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                 session.component === 'Practical' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                 session.component === 'Skill' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
               }`}>
                 {session.component}
               </span>
             )}
             {session.section && (
               <span className="text-[9px] font-mono bg-white/10 text-zinc-300 px-1 py-0.5 rounded">
                 {session.section}
               </span>
             )}
           </div>
           {/* Course Title */}
           <h5 className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
             {session.courseTitle || session.courseCode}
           </h5>
           {/* Footer: Code & Room */}
           <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-400 pt-1 border-t border-white/5 mt-auto">
             <span className="font-mono text-zinc-400 truncate">{session.courseCode}</span>
             {session.room && (
               <span className="text-emerald-400 font-medium flex items-center gap-0.5 shrink-0">
                 <MapPin className="w-2.5 h-2.5" />
                 {session.room}
               </span>
             )}
           </div>
         </div>
       ))}
     </div>
     ```

### 2.2 Parser & Scraper Multi-Session Refactoring (`src/lib/timetable-parser.ts` & `src/lib/scraper.ts`)
1. **Preserving Cell Structure in `parseGenericTable`**:
   - In `src/lib/scraper.ts`, modify `getNodeText` or `parseGenericTable` to replace `<br>` and `\n` with a distinct delimiter like `\n` or ` || ` instead of collapsing everything into a single space.
2. **Multi-Session Cell Parser (`parseCellContent` refactor)**:
   - Create `parseCellContentMultiple(text: string)` in `src/lib/timetable-parser.ts`:
     - Split input string on `\n`, `||`, `<br>`, or multiple course code matches.
     - For each substring/segment containing a course code match, run single-session parsing.
     - Return an array of session details `Array<{ courseCode, courseTitle, component, section, room, faculty }>`.
3. **Unified Matrix Transposition in `parseTimetable`**:
   - Regardless of whether raw input is `matrix_days_rows` or `matrix_days_columns`:
     - Map all day names to canonical full day names (`Monday`–`Sunday`).
     - Map all period slots to canonical keys (`1`, `2`, ..., `N`).
     - For `matrix_days_columns`, transpose cells so that day is always the primary row key and timeSlot is the column key.
     - Initialize `matrixGrid[day][timeSlot] = []` for all days (`Monday`..`Sunday`) and all present time slots (`1`..`maxSlot`), ensuring `matrixGrid[day][slot]` is always a non-null array.

---

## 3. Caveats

1. **ERP Timetable Variations**:
   - Some ERP semesters return day orders (`DAY ORDER - 1` through `DAY ORDER - 7`), while others return standard day names (`Monday` through `Sunday`). `normalizeDay` maps Day Orders 1–7 directly to Monday–Sunday.
2. **Non-Standard Time Slots**:
   - While most semesters use period numbers (`1` to `8`), some timetables use explicit time range strings (e.g. `09:00 AM - 09:50 AM`). `normalizeSlotKey` preserves time strings while converting `Period 1` or `P1` to numeric string `'1'`.
3. **Read-Only Scope**:
   - As Explorer 4, no application files were modified during this investigation. Implementation instructions are provided in Section 4 for the Worker.

---

## 4. Conclusion

- The current UI layout in `src/app/dashboard/timetable/page.tsx` is structured with Days on Y-axis and Periods on X-axis, but requires refactoring to consume `parsedTT.matrixGrid[day][slot]` directly, prevent fixed-height cell clipping (`min-h-[110px] h-auto`), and apply sticky positioning classes.
- `parseTimetable` in `src/lib/timetable-parser.ts` requires multi-session extraction logic (`parseCellContentMultiple`) so that multiple sessions inside a single cell are not dropped, and matrix normalization to guarantee a complete 2D grid structure for both `matrix_days_rows` and `matrix_days_columns`.
- Comprehensive unit tests in `src/lib/scraper.test.ts` must be added to cover `matrix_days_columns` and multi-session slots.

---

## 5. Verification Method

### 5.1 Automated Unit Testing
Run the test suite using Node's test runner:
```bash
node --test --import tsx src/lib/scraper.test.ts
```
Or via npm script:
```bash
npm test
```

### 5.2 Specific Test Cases to Verify
1. **`matrix_days_columns` Layout Test**:
   - Pass HTML payload with days as column headers and period numbers as rows.
   - Assert `parsedTT.layout === 'matrix_days_columns'`.
   - Assert `parsedTT.matrixGrid['Monday']['1']` returns the expected session array.
2. **Multi-Session Cell Stacking Test**:
   - Pass HTML payload where a single cell contains two sessions separated by `<br>` (e.g., `25CS1302E-L - S-10 - RoomNo-H-005<br/>25SC2107E-S - S-10 - RoomNo-H-006`).
   - Assert `parsedTT.matrixGrid['Monday']['1'].length === 2`.
   - Assert both sessions (`25CS1302E` and `25SC2107E`) are correctly parsed with their respective components (`Lecture` and `Skill`).
3. **Sticky UI & Responsive Layout Inspection**:
   - Inspect `src/app/dashboard/timetable/page.tsx` in browser or dev server (`npm run dev`) and test horizontal scrolling at 1000px viewport width to verify sticky day headers (`sticky left-0 z-10 bg-zinc-950/90`).

---

## 6. Implementation Plan for Worker

The Worker agent should execute the following steps in order:

### Step 1: Update `src/lib/scraper.ts` to Preserve Line Breaks in Table Cells
- In `src/lib/scraper.ts`, update `getNodeText` (around line 472) to convert `<br>` tags to newlines (`\n`) or ` || ` delimiters instead of collapsing all child text into single spaces.
  ```ts
  function getNodeText($cell: cheerio.Cheerio<Element>): string {
    const $clone = $cell.clone();
    $clone.find('script, style, noscript, template, input[type="hidden"]').remove();
    $clone.find('br').replaceWith('\n');
    $clone
      .find('div, p, span, a, b, i, strong, em, small, font, li, td, th, h1, h2, h3, h4, h5, h6')
      .before(' ')
      .after(' ');
    let text = $clone.text();
    text = text.replace(/\u00a0/g, ' ');
    return text.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  }
  ```

### Step 2: Refactor `src/lib/timetable-parser.ts` for Multi-Session Parsing & Unified Matrix
1. **Multi-Session Cell Parsing**:
   - Implement `parseCellContentMultiple(text: string)` in `src/lib/timetable-parser.ts`:
     - Split `text` by `\n` or `||`. If multiple segments exist, parse each segment independently using `parseCellContent`.
     - Return `Array<ReturnType<typeof parseCellContent>>`.
2. **Update `parseTimetable` Matrix Population**:
   - In both `matrix_days_columns` and `matrix_days_rows` branches:
     - Call `parseCellContentMultiple(rawText)` to get all sessions in the cell.
     - For each parsed session object, create a `NormalizedClassSession` and push it to `sessions` array AND `matrixGrid[normDay.full][timeSlot]`.
3. **Ensure Complete Matrix Grid**:
   - At the end of `parseTimetable`, ensure `matrixGrid` has initialized empty arrays `[]` for all standard days (`Monday`..`Sunday`) and all time slots in `timeSlotsPresent`.

### Step 3: Update Grid UI in `src/app/dashboard/timetable/page.tsx`
1. **Direct Matrix Lookup**:
   - Replace manual `parsedTT.sessions.filter(...)` in table body with direct lookup:
     `const matchingSessions = parsedTT.matrixGrid[day]?.[periodNum] || [];`
2. **Cell Height & Styling**:
   - Change period cell class from `h-32` to `min-h-[110px] h-auto align-top p-2.5 border-r border-white/5 last:border-r-0`.
3. **Sticky Day Header Alignment**:
   - Corner cell: `<th className="p-4 sticky left-0 z-20 bg-zinc-900/95 backdrop-blur-md min-w-[130px] border-r border-white/10 text-indigo-400 font-bold text-xs text-center uppercase">Day / Period</th>`
   - Day cells: `<td className="p-4 sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md font-bold text-xs text-zinc-200 border-r border-white/10 text-center whitespace-nowrap min-w-[130px]">{day}</td>`
4. **Empty Cell Rendering**:
   - Render empty cell with dashed border:
     `<div className="h-full min-h-[90px] rounded-xl border border-dashed border-white/5 bg-zinc-900/10 flex items-center justify-center text-zinc-700/50 text-xs font-mono">-</div>`

### Step 4: Add Unit Tests in `src/lib/scraper.test.ts`
Add test cases in `src/lib/scraper.test.ts`:
1. **Test `matrix_days_columns` HTML payload**:
   ```ts
   it('parses matrix format with days as columns HTML payload cleanly', () => {
     const htmlPayload = `
       <table class="table table-bordered">
         <thead>
           <tr>
             <th>Time/Period</th>
             <th>Monday</th>
             <th>Tuesday</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td>Period 1</td>
             <td>25CS1302E-L - S-10 - RoomNo-H-005</td>
             <td>22CS1101-L - S-05 - RoomNo-C-101</td>
           </tr>
         </tbody>
       </table>
     `;
     const rawRows = parseGenericTable(htmlPayload);
     const parsed = parseTimetable(rawRows);
     assert.equal(parsed.layout, 'matrix_days_columns');
     assert.equal(parsed.matrixGrid['Monday']['1'][0].courseCode, '25CS1302E');
     assert.equal(parsed.matrixGrid['Tuesday']['1'][0].courseCode, '22CS1101');
   });
   ```
2. **Test Multi-Session Cell in `parseTimetable`**:
   ```ts
   it('parses multiple sessions in a single period cell cleanly', () => {
     const htmlPayload = `
       <table class="table">
         <thead>
           <tr><th>Day/Period</th><th>1</th></tr>
         </thead>
         <tbody>
           <tr>
             <td>Monday</td>
             <td>25CS1302E-L - S-10 - RoomNo-H-005<br/>25SC2107E-S - S-10 - RoomNo-H-006</td>
           </tr>
         </tbody>
       </table>
     `;
     const rawRows = parseGenericTable(htmlPayload);
     const parsed = parseTimetable(rawRows);
     const mondaySlot1 = parsed.matrixGrid['Monday']['1'];
     assert.equal(mondaySlot1.length, 2);
     assert.equal(mondaySlot1[0].courseCode, '25CS1302E');
     assert.equal(mondaySlot1[1].courseCode, '25SC2107E');
   });
   ```

### Step 5: Verify Build & Tests
- Execute `npm test` or `node --test --import tsx src/lib/scraper.test.ts`.
- Ensure all tests pass with zero regressions.
