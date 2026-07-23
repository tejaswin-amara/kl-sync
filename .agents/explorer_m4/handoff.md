# Handoff Report - Explorer M4: Timetable Page & Dashboard Widget Robustness

## 1. Observation

### 1.1 Source Files Examined
- **`src/app/dashboard/timetable/page.tsx`**: Main student timetable page.
- **`src/app/dashboard/page.tsx`**: Dashboard containing the `TodayScheduleWidget` component (lines 424-588).
- **`src/lib/scraper.ts`**: ERP scraping engine containing `fetchTimetableData` (lines 520-616) and `parseGenericTable` (lines 379-450).
- **`src/app/api/erp-proxy/[module]/route.ts`**: Next.js API proxy route for ERP module data (lines 66-78).
- **`src/hooks/useAcademicSession.ts`**: Hook managing session year & semester selections.
- **`src/lib/utils.ts`**: Utility helpers including `exportTableToCSV`.

### 1.2 Directly Observed Code Patterns & Deficiencies

#### Issue 1: Naive Table Rendering in `src/app/dashboard/timetable/page.tsx`
Lines 198–245 render data by dynamically mapping object keys from `filteredData[0]`:
```tsx
198: <thead>
199:   <tr>
200:     {Object.keys(filteredData[0] || {}).map((key, i) => (
...
226:       {typeof val === 'string' && val.includes('-') && j > 0 ? (
227:         <div className="flex flex-col gap-1">
228:           <span className="text-sm font-medium text-zinc-100">{val.split('-')[0]}</span>
229:           <span className="text-xs font-mono tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded w-max">
230:             {val.substring(val.indexOf('-') + 1)}
231:           </span>
232:         </div>
233:       ) : ( val )}
```
- **Flaws**:
  1. Assumes all table headers can be rendered as flat column names.
  2. Does not distinguish between Matrix Timetables (Days vs Time Slots) and List Timetables (Session per row).
  3. Cell splitting logic (`val.includes('-')`) naively splits at the first hyphen, breaking multi-hyphen strings such as course codes (`22-CS-1101`) or complex venue titles (`C-101 - Lab`).
  4. No Grid vs List view toggle options, day filters, or responsive mobile view cards.

#### Issue 2: Flawed Day Matching & Data Mapping in `TodayScheduleWidget` (`src/app/dashboard/page.tsx`)
Lines 454–505:
```tsx
454: const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
463: const fullDay = days[new Date().getDay()].toLowerCase();
464: const shortDay = fullDay.slice(0, 3);
467: const dayKey = Object.keys(resData.data[0] || {}).find((key) => {
468:   const k = key.toLowerCase().trim();
469:   return k.includes(fullDay) || k.includes(shortDay);
470: });
```
Lines 495–503:
```tsx
495: } else {
496:   // Row-based layout
497:   todayClasses = resData.data.filter((row: any) => {
498:     return Object.values(row).some(
499:       (val) => typeof val === 'string' &&
500:         (val.toLowerCase().includes(fullDay) || val.toLowerCase().includes(shortDay))
501:     );
502:   });
503: }
```
Lines 545–547:
```tsx
545: const values = Object.values(c);
546: const title = String(values[1] || 'Class');
547: const room = String(values[values.length - 1] || 'N/A');
```
- **Flaws**:
  1. **Substring matching bug**: `val.toLowerCase().includes('mon')` matches words like "Common", "Demonstration", "MON-101", "Month", or "Raymond", producing false positive matches for Monday!
  2. **Day Name Variant Blindness**: Fails to match numeric days/day orders (`'1'`, `'Day 1'`, `'Day 2'`, etc.), capitalized variants (`'MON'`, `'MON.'`), or multi-language/abbreviated variants.
  3. **Broken Layout Mapping**:
     - For Matrix Timetables with Days as Rows: `dayKey` is `undefined` (because headers are time slots, e.g., "09:00 - 10:00"). The widget drops to the `else` branch, returns the single Monday row object, and renders 1 card (`P1`) taking `values[1]` as title and `values[last]` as room (which is `"-"`). All other periods for Monday are silently discarded!
     - For Matrix Timetables with Days as Columns: `dayKey` matches "Monday". The widget extracts `row["Monday"]` as `Subject`, but in rendering lines 545–547, `values` is `[Time, Subject, Day]`, so `title` gets `values[1]` (`Subject`) and `room` gets `values[last]` which is `"Monday"`! Room displays as `"Monday"` instead of the venue!
     - For List Timetables: `values[1]` gets mapped as `Time`, `values[last]` gets mapped as `Faculty`, showing Time as Course Title and Faculty as Room number!

#### Issue 3: Complete Absence of Caching & Unhandled Exception States
- **No Caching**: Navigating between Dashboard, Timetable, and Marks triggers a fresh ERP network fetch (taking 2–5 seconds).
- **Silent Errors**: `TodayScheduleWidget` uses `.catch(console.error)` without setting an error state, causing an empty widget state ("No classes scheduled for today") even when the request fails due to network or session expiration.
- **Uncaught Edge Cases**: When `resData.data` is empty (`[]`) or malformed, `resData.data[0]` is `undefined`, causing runtime TypeError exceptions if not guarded.

---

## 2. Logic Chain

1. **Premise 1**: KL ERP outputs timetable tables in multiple HTML formats depending on university batch, semester, or system view:
   - **Matrix Format A1**: Rows = Days (`Monday`, `Tuesday`), Columns = Time Slots (`09:00 - 10:00`, `10:00 - 11:00`).
   - **Matrix Format A2**: Rows = Time Slots, Columns = Days (`Mon`, `Tue`, `Wed`).
   - **List Format B**: Rows = Individual Class Sessions, Columns = `['Day', 'Time', 'Course Code', 'Course Title', 'Venue', 'Faculty']`.

2. **Premise 2**: A single rigid rendering assumption (`filteredData[0]` key mapping or `values[1]`/`values[last]` positional access) will fail whenever the ERP output shifts between Format A1, Format A2, or Format B.

3. **Step-by-Step Breakdown of Failures**:
   - *Observation 1.2 (Issue 2, Matrix A1)* -> Headers are Time Slots -> `dayKey` search in headers fails (`undefined`). Code drops to row filter -> Finds Monday row -> Maps row to `todayClasses` as a 1-element array -> Render picks `values[1]` as Title, `values[last]` as Room -> **Result**: 1 period shown, remaining periods lost, Room shown as `"-"`.
   - *Observation 1.2 (Issue 2, Matrix A2)* -> Headers have Days -> `dayKey` matches `"Monday"` -> Maps `{ Time, Subject, Day }` -> Render picks `values[last]` as Room -> **Result**: Room number is rendered as `"Monday"`.
   - *Observation 1.2 (Issue 2, Substring Match)* -> `val.includes('mon')` matches course name "Common Electronics" on Wednesday -> **Result**: Wednesday course incorrectly shown on Monday!
   - *Observation 1.2 (Issue 1, Timetable Page)* -> Dynamic table lacks grid layout, period column highlighting, day tabs, or mobile responsiveness -> **Result**: Wide table overflows horizontally, displays raw `"-"` strings, and lacks user controls.

4. **Conclusion**: Both pages require an intelligent Timetable Data Classifier & Normalizer utility (`src/lib/timetable-parser.ts`) that standardizes raw ERP data into a uniform structure (`NormalizedClassSession[]` and `ParsedTimetable`) regardless of input layout, paired with client-side caching and resilient fallback UI components.

---

## 3. Caveats

- **Read-Only Scope**: This report provides comprehensive analysis and concrete code proposals. No source code modifications were performed in `src/`.
- **ERP Format Variations**: ERP HTML table structures may contain unannounced HTML element changes (e.g. `<th>` vs `<td>` headers, nested `<br>` tags). The proposed parser relies on Cheerio's generic text extraction already in `scraper.ts`.
- **Day Order Timetables**: Some university timetables use Day Order (`Day 1` through `Day 6`) instead of calendar day names (`Monday` through `Saturday`). The proposed normalizer maps numeric day orders seamlessly.

---

## 4. Conclusion & Recommendations

To deliver a rock-solid, freeze-free, and adaptable Timetable system, implement the following three components:

### Recommendation A: Create `src/lib/timetable-parser.ts`

Define a dedicated parser that auto-detects layout type, normalizes day names, parses cell content, and outputs structured sessions.

#### Proposed Types & Normalizer (`src/lib/timetable-parser.ts`):

```typescript
export interface NormalizedClassSession {
  id: string;
  day: string;            // Normalized day name e.g. 'Monday'
  dayShort: string;       // Normalized short day e.g. 'Mon'
  dayIndex: number;       // 0=Sun, 1=Mon, ..., 6=Sat (-1 if Day Order)
  timeSlot: string;       // e.g. '09:00 AM - 10:00 AM' or 'Period 1'
  courseCode: string;     // e.g. '22CS1101'
  courseTitle: string;    // e.g. 'Data Structures'
  room: string;           // e.g. 'C101'
  faculty: string;        // e.g. 'Dr. Smith'
  rawText: string;        // Original cell string
}

export type TimetableLayoutType = 'matrix_days_columns' | 'matrix_days_rows' | 'list_rows' | 'unknown';

export interface ParsedTimetable {
  layout: TimetableLayoutType;
  headers: string[];
  rawRows: Array<Record<string, string>>;
  sessions: NormalizedClassSession[];
  daysPresent: string[];
  timeSlotsPresent: string[];
  matrixGrid: Record<string, Record<string, NormalizedClassSession | null>>; // day -> timeSlot -> session
}
```

#### Day Name Normalization Map & Helper:

```typescript
const DAY_MAP: Record<string, { full: string; short: string; index: number }> = {
  monday: { full: 'Monday', short: 'Mon', index: 1 },
  mon: { full: 'Monday', short: 'Mon', index: 1 },
  '1': { full: 'Monday', short: 'Mon', index: 1 },
  'day 1': { full: 'Monday', short: 'Mon', index: 1 },
  'day1': { full: 'Monday', short: 'Mon', index: 1 },

  tuesday: { full: 'Tuesday', short: 'Tue', index: 2 },
  tue: { full: 'Tuesday', short: 'Tue', index: 2 },
  tues: { full: 'Tuesday', short: 'Tue', index: 2 },
  '2': { full: 'Tuesday', short: 'Tue', index: 2 },
  'day 2': { full: 'Tuesday', short: 'Tue', index: 2 },
  'day2': { full: 'Tuesday', short: 'Tue', index: 2 },

  wednesday: { full: 'Wednesday', short: 'Wed', index: 3 },
  wed: { full: 'Wednesday', short: 'Wed', index: 3 },
  '3': { full: 'Wednesday', short: 'Wed', index: 3 },
  'day 3': { full: 'Wednesday', short: 'Wed', index: 3 },
  'day3': { full: 'Wednesday', short: 'Wed', index: 3 },

  thursday: { full: 'Thursday', short: 'Thu', index: 4 },
  thu: { full: 'Thursday', short: 'Thu', index: 4 },
  thur: { full: 'Thursday', short: 'Thu', index: 4 },
  thurs: { full: 'Thursday', short: 'Thu', index: 4 },
  '4': { full: 'Thursday', short: 'Thu', index: 4 },
  'day 4': { full: 'Thursday', short: 'Thu', index: 4 },
  'day4': { full: 'Thursday', short: 'Thu', index: 4 },

  friday: { full: 'Friday', short: 'Fri', index: 5 },
  fri: { full: 'Friday', short: 'Fri', index: 5 },
  '5': { full: 'Friday', short: 'Fri', index: 5 },
  'day 5': { full: 'Friday', short: 'Fri', index: 5 },
  'day5': { full: 'Friday', short: 'Fri', index: 5 },

  saturday: { full: 'Saturday', short: 'Sat', index: 6 },
  sat: { full: 'Saturday', short: 'Sat', index: 6 },
  '6': { full: 'Saturday', short: 'Sat', index: 6 },
  'day 6': { full: 'Saturday', short: 'Sat', index: 6 },
  'day6': { full: 'Saturday', short: 'Sat', index: 6 },

  sunday: { full: 'Sunday', short: 'Sun', index: 0 },
  sun: { full: 'Sunday', short: 'Sun', index: 0 },
  '7': { full: 'Sunday', short: 'Sun', index: 0 },
  'day 7': { full: 'Sunday', short: 'Sun', index: 0 },
  'day7': { full: 'Sunday', short: 'Sun', index: 0 },
};

export function normalizeDay(dayStr: string) {
  if (!dayStr) return null;
  const clean = dayStr.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  return DAY_MAP[clean] || null;
}

export function isSameDay(dayA: string, dayB: string): boolean {
  const normA = normalizeDay(dayA);
  const normB = normalizeDay(dayB);
  if (normA && normB) return normA.full === normB.full;
  return dayA.toLowerCase().trim() === dayB.toLowerCase().trim();
}
```

#### Smart Cell Content Parser:

```typescript
export function parseCellContent(text: string): { courseCode: string; courseTitle: string; room: string; faculty: string } {
  if (!text || text === '-' || text.toLowerCase() === 'free' || text.toLowerCase() === 'n/a') {
    return { courseCode: '', courseTitle: '', room: '', faculty: '' };
  }

  // Split by common delimiters: '-', '/', '\n', '|'
  const parts = text.split(/[-/\n|]/).map(p => p.trim()).filter(Boolean);

  let courseCode = '';
  let courseTitle = '';
  let room = '';
  let faculty = '';

  const codeRegex = /^[0-9]{2}[A-Z]{2,4}[0-9]{3,4}[A-Z]?$/i;
  const roomRegex = /^(room|venue|hall|lab|c|r|b|l|m|tp)?\s*[-]?\s*[0-9]{3,4}[a-z]?$/i;

  parts.forEach(part => {
    if (!courseCode && codeRegex.test(part)) {
      courseCode = part;
    } else if (!room && (roomRegex.test(part) || part.toLowerCase().includes('room') || part.toLowerCase().includes('lab'))) {
      room = part;
    } else if (!courseTitle) {
      courseTitle = part;
    } else if (!faculty) {
      faculty = part;
    }
  });

  // Fallbacks if regex did not match discrete parts
  if (!courseCode && parts.length > 0) courseCode = parts[0];
  if (!room && parts.length > 1) room = parts[parts.length - 1];

  return { courseCode, courseTitle, room, faculty };
}
```

#### Layout Classification Engine:

```typescript
export function parseTimetable(rawRows: Array<Record<string, string>>): ParsedTimetable {
  if (!rawRows || rawRows.length === 0) {
    return {
      layout: 'unknown',
      headers: [],
      rawRows: [],
      sessions: [],
      daysPresent: [],
      timeSlotsPresent: [],
      matrixGrid: {},
    };
  }

  const headers = Object.keys(rawRows[0] || {});
  
  // Check Layout Type
  const dayHeaders = headers.filter(h => normalizeDay(h) !== null);
  const firstColValues = rawRows.map(r => r[headers[0]] || '');
  const dayRows = firstColValues.filter(v => normalizeDay(v) !== null);

  let layout: TimetableLayoutType = 'unknown';
  if (dayHeaders.length >= 3) {
    layout = 'matrix_days_columns';
  } else if (dayRows.length >= 3) {
    layout = 'matrix_days_rows';
  } else if (headers.some(h => h.toLowerCase().includes('day')) && headers.some(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('period') || h.toLowerCase().includes('course'))) {
    layout = 'list_rows';
  }

  const sessions: NormalizedClassSession[] = [];
  const matrixGrid: Record<string, Record<string, NormalizedClassSession | null>> = {};
  const daysSet = new Set<string>();
  const timeSlotsSet = new Set<string>();

  if (layout === 'matrix_days_columns') {
    const timeColKey = headers.find(h => !normalizeDay(h)) || headers[0];
    rawRows.forEach((row, rIdx) => {
      const timeSlot = row[timeColKey] || `Period ${rIdx + 1}`;
      timeSlotsSet.add(timeSlot);
      dayHeaders.forEach(dayHeader => {
        const normDay = normalizeDay(dayHeader);
        if (!normDay) return;
        daysSet.add(normDay.full);

        const cellVal = row[dayHeader] || '';
        if (cellVal && cellVal !== '-' && cellVal.toLowerCase() !== 'free') {
          const parsedCell = parseCellContent(cellVal);
          const session: NormalizedClassSession = {
            id: `${normDay.full}-${timeSlot}-${rIdx}`,
            day: normDay.full,
            dayShort: normDay.short,
            dayIndex: normDay.index,
            timeSlot,
            ...parsedCell,
            rawText: cellVal,
          };
          sessions.push(session);
          if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
          matrixGrid[normDay.full][timeSlot] = session;
        }
      });
    });
  } else if (layout === 'matrix_days_rows') {
    const dayColKey = headers[0];
    const timeSlotHeaders = headers.slice(1);
    timeSlotHeaders.forEach(ts => timeSlotsSet.add(ts));

    rawRows.forEach((row, rIdx) => {
      const dayVal = row[dayColKey];
      const normDay = normalizeDay(dayVal);
      if (!normDay) return;
      daysSet.add(normDay.full);

      timeSlotHeaders.forEach(tsHeader => {
        const cellVal = row[tsHeader] || '';
        if (cellVal && cellVal !== '-' && cellVal.toLowerCase() !== 'free') {
          const parsedCell = parseCellContent(cellVal);
          const session: NormalizedClassSession = {
            id: `${normDay.full}-${tsHeader}-${rIdx}`,
            day: normDay.full,
            dayShort: normDay.short,
            dayIndex: normDay.index,
            timeSlot: tsHeader,
            ...parsedCell,
            rawText: cellVal,
          };
          sessions.push(session);
          if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
          matrixGrid[normDay.full][tsHeader] = session;
        }
      });
    });
  } else {
    // List Timetable or Unknown
    rawRows.forEach((row, rIdx) => {
      const dayKey = headers.find(h => h.toLowerCase().includes('day')) || headers[0];
      const timeKey = headers.find(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('period') || h.toLowerCase().includes('slot'));
      const codeKey = headers.find(h => h.toLowerCase().includes('code') || h.toLowerCase().includes('course'));
      const roomKey = headers.find(h => h.toLowerCase().includes('room') || h.toLowerCase().includes('venue') || h.toLowerCase().includes('hall'));
      const facultyKey = headers.find(h => h.toLowerCase().includes('faculty') || h.toLowerCase().includes('instructor') || h.toLowerCase().includes('staff'));

      const normDay = normalizeDay(row[dayKey]) || { full: row[dayKey] || 'General', short: 'Gen', index: -1 };
      daysSet.add(normDay.full);
      const timeSlot = (timeKey && row[timeKey]) || `Period ${rIdx + 1}`;
      timeSlotsSet.add(timeSlot);

      const session: NormalizedClassSession = {
        id: `session-${rIdx}`,
        day: normDay.full,
        dayShort: normDay.short,
        dayIndex: normDay.index,
        timeSlot,
        courseCode: (codeKey && row[codeKey]) || Object.values(row)[1] || '',
        courseTitle: Object.values(row)[2] || '',
        room: (roomKey && row[roomKey]) || Object.values(row)[Object.values(row).length - 1] || 'N/A',
        faculty: (facultyKey && row[facultyKey]) || '',
        rawText: Object.values(row).join(' | '),
      };
      sessions.push(session);
    });
  }

  return {
    layout,
    headers,
    rawRows,
    sessions,
    daysPresent: Array.from(daysSet),
    timeSlotsPresent: Array.from(timeSlotsSet),
    matrixGrid,
  };
}
```

---

### Recommendation B: Refactor Today's Schedule Widget (`src/app/dashboard/page.tsx`)

#### Key Improvements:
1. Parse fetched timetable via `parseTimetable(resData.data)`.
2. Get current day name (e.g. `const currentDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]`).
3. Filter today's classes cleanly using `isSameDay(session.day, currentDay)`.
4. Render robust cards showing Period/Time Slot, Course Code, Course Title, Room/Venue, and Faculty.
5. Provide distinct states for:
   - Loading: Skeleton cards.
   - Weekend / No Classes Scheduled: "No classes scheduled for today. Enjoy your day!" (with calendar icon).
   - Fetch Error: "Timetable data unavailable" with a Retry button.

```tsx
function TodayScheduleWidget({ activeYearId, activeSemId }: { activeYearId: string; activeSemId: string }) {
  const [todaySessions, setTodaySessions] = useState<NormalizedClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    if (!activeYearId || !activeSemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Check client cache first
      const cacheKey = `kl_timetable_${activeYearId}_${activeSemId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsedCached = JSON.parse(cached);
        const parsedTT = parseTimetable(parsedCached);
        const currentDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
        const today = parsedTT.sessions.filter(s => isSameDay(s.day, currentDay));
        setTodaySessions(today);
        setLoading(false);
      }

      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      const res = await fetch('/api/erp-proxy/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: activeYearId, semesterId: activeSemId, csrfToken: csrf }),
      });
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data)) {
        sessionStorage.setItem(cacheKey, JSON.stringify(resData.data));
        const parsedTT = parseTimetable(resData.data);
        const currentDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
        const today = parsedTT.sessions.filter(s => isSameDay(s.day, currentDay));
        setTodaySessions(today);
      } else {
        if (!cached) setError(resData.error || 'Failed to fetch timetable');
      }
    } catch (err: any) {
      if (!todaySessions.length) setError(err.message || 'Error loading timetable');
    } finally {
      setLoading(false);
    }
  }, [activeYearId, activeSemId]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // Render UI with clean fallback cards ...
}
```

---

### Recommendation C: Refactor Timetable Page (`src/app/dashboard/timetable/page.tsx`)

#### Key Improvements:
1. **Client Caching**: Utilize `sessionStorage.getItem('kl_timetable_${selectedYear}_${selectedSem}')` for instant navigation loading.
2. **Dual View Modes (Grid View vs List View)**:
   - **Grid View**: Renders interactive Weekly Matrix Grid (Days vs Period Time Slots) with highlighted active day tab and responsive horizontal scrolling.
   - **List View**: Renders detailed class cards with Search filter, Day filter, and CSV Export (`exportTableToCSV`).
3. **Robust Fallback & Error UI**:
   - Loading skeletons during initial fetch.
   - Clear empty state card ("No classes found for the selected session") when `sessions.length === 0`.
   - Error banner with retry trigger when proxy call fails.

---

## 5. Verification Method

To verify these changes independently after implementation:

### 1. Verification Commands
Run lint, vet, and build checks from project root:
```bash
npm run lint
npm run build
```

### 2. Manual Test Cases & Edge Case Scenarios

| Test Case | Inputs / Scenario | Expected Outcome |
|---|---|---|
| **Matrix Days-as-Rows** | ERP payload where Row 0 is `{"Day": "Monday", "09:00-10:00": "22CS1101 - C101", "10:00-11:00": "22EC1202 - C102"}` | `parseTimetable` classifies layout as `matrix_days_rows`. Extracts 2 sessions for Monday. Widget renders both periods accurately. |
| **Matrix Days-as-Columns** | ERP payload where headers are `["Time", "Mon", "Tue", "Wed"]` | `parseTimetable` classifies layout as `matrix_days_columns`. Widget matches today's day column and extracts room/course correctly without setting Room to `"Monday"`. |
| **List Timetable** | ERP payload where rows are `{"Day": "Mon", "Time": "9 AM", "Course": "22CS1101", "Room": "C101"}` | `parseTimetable` classifies layout as `list_rows`. Renders cards with proper field bindings. |
| **Day Name Variants** | Day string values `'MON'`, `'Mon'`, `'Monday'`, `'1'`, `'Day 1'` | `normalizeDay` maps all variants to `{ full: 'Monday', short: 'Mon', index: 1 }`. Today's schedule matches regardless of variant. |
| **Word Boundary Substring Guard** | Course titled `"Common Electronics"` or faculty `"Raymond"` | `isSameDay` ignores non-day substring occurrences. No false-positive class additions to Monday. |
| **Empty / Error State** | Proxy returns `[]` or status 500 | UI displays friendly fallback ("No classes scheduled for today" or "Failed to sync with ERP") without spinner freeze or JS crash. |

### 3. Invalidation Conditions
- If ERP alters column header casing or HTML table markup significantly, Cheerio generic table parser fallback should still return raw rows without throwing uncaught exceptions.
