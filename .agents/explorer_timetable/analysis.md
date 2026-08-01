# Comprehensive Timetable Module Technical Analysis Report

**Target Area**: Timetable Module (`/dashboard/timetable`, `src/lib/scraper.ts`, `src/lib/timetable-parser.ts`, `src/app/api/erp-proxy/[module]/route.ts`, `src/app/dashboard/timetable/page.tsx`)  
**Date**: 2026-08-01  
**Investigator**: Explorer 3 (`teamwork_preview_explorer`)

---

## Executive Summary

The timetable page (`/dashboard/timetable`) experiences multiple functional and visual failures ranging from missing course titles and faculty names, missing/misaligned grid rows, afternoon classes sorting to the top of the schedule, unrendered day-order schedules (e.g. `DAY ORDER 1`), to silent data extraction failures when ERP HTML headers or cell formats deviate from ideal assumptions. 

This report provides an exhaustive audit of all components, root causes, evidence chains, edge cases, and concrete fix recommendations for the Worker agent.

---

## 1. Test Frameworks & Test Runner Audit

- **`package.json` Examination**:
  - `scripts`: `"dev"`, `"build"`, `"start"`, `"lint"`. No `"test"` script exists.
  - `dependencies`: `cheerio`, `clsx`, `lucide-react`, `next`, `react`, `react-dom`, `sharp`, `tailwind-merge`.
  - `devDependencies`: `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `eslint-config-prettier`, `eslint-plugin-prettier`, `prettier`, `tailwindcss`, `typescript`.
- **Runner Configuration Files**:
  - No `vitest.config.ts`, `jest.config.js`, `playwright.config.ts`, or `.mocharc` files exist in the repository.
- **Existing Verification Harness**:
  - Ad-hoc execution script: `src/scripts/test-timetable.ts` (runnable via `npx tsx src/scripts/test-timetable.ts`).
  - Standard project build/lint checks: `npm run lint` (`eslint`) and `npx tsc --noEmit`.

---

## 2. API Proxying & Session Handling Analysis (`src/app/api/erp-proxy/[module]/route.ts`)

- **Proxy Architecture**:
  - Route handler handles `/api/erp-proxy/[module]`. When `module === 'timetable'`, `handleProxy` reads the session cookie (`kl_erp_session`).
  - Decodes the encrypted session payload via `decodeSession(sessionCookie.value)`.
  - Extracts `academicYear`, `semesterId`, and `csrfToken` from either the POST body or query parameters (`nextUrl.searchParams`).
  - Invokes `fetchTimetableData(session, resolvedCsrf, academicYear, semesterId)` from `src/lib/scraper.ts`.
- **Response Format**:
  - On success: Returns JSON `{ success: true, data: Record<string, unknown>[] }`.
  - On error: Returns HTTP status `401` (if session expired) or `500`/`400` with `{ success: false, error: string }`.
- **Findings**:
  - The API proxying layer is stable and correctly passes parameters to `fetchTimetableData`.
  - Content-Type verification in client-side code (`page.tsx`) correctly checks `res.headers.get('content-type')?.includes('application/json')` to prevent HTML error page crashes.

---

## 3. Scraper & HTML Table Extraction Analysis (`src/lib/scraper.ts`)

### 3.1 `fetchTimetableData` Flow
1. **Candidate URL Rotation** (lines 932-943): Iterates over 10 potential ERP timetable endpoints (POST with form data, GET with params, Plain GET).
2. **Session Expiry Detection** (lines 949-957): `isSessionExpiredHtml` checks for `id="login-form"` or login redirection.
3. **Table Parsing & Validation** (lines 982-989): Calls `parseGenericTable(html)` and validates output using `isLikelyTimetableData(parsed)`.
4. **Fallback Mechanism** (lines 1074-1075): Uses `fallbackData` if `isLikelyTimetableData` fails to score candidate tables above threshold.

### 3.2 Key Flaws in `parseGenericTable` & `isLikelyTimetableData`

| Flaw ID | Location | Observation | Root Cause & Impact |
| flex | `scraper.ts:677-703` | Header normalization and `headerCountMap` collision | Spanning columns (`colspan`) or empty header cells in HTML cause `parseGenericTable` to generate duplicate header names (`1`, `1_1`, `1_2` or `Column_0`). |
| flex | `scraper.ts:627-647` | Over-aggressive `isTitleBannerRow` filtering | Rows containing spanned break text (`"LUNCH BREAK"`, `"TEA BREAK"`) have identical non-empty cell values across columns without course codes (`/[a-z0-9]{5,10}/i`). `isTitleBannerRow` flags them as title banners and discards the entire row. |
| flex | `scraper.ts:769-827` | Restrictive `isLikelyTimetableData` criteria | `hasPeriodHeaders` checks `/\^\d{1,2}\$/` on first row keys. If headers are clock times (`"09:00-09:50"`) or mangled keys (`"1_1"`), `hasPeriodHeaders` is `false`. If keyword match count < 4, `isLikelyTimetableData` rejects valid timetable tables. |

---

## 4. Timetable Parser & Cell Processing Deep-Dive (`src/lib/timetable-parser.ts`)

### 4.1 Day Normalization & Alias Mapping (`normalizeDay` & `DAY_MAP`)
- **Current Logic** (`lines 65-163`): `normalizeDay` strips non-alphanumeric characters, replaces them with spaces, and performs token matching against `DAY_MAP`.
- **Root Cause Bugs**:
  1. **Hyphenated & Multi-space Day Orders**: `normalizeDay("DAY ORDER - 1")` replaces `-` with space resulting in `"day order  1"` (with double space). Token splitting produces `["day", "order", "1"]`. `DAY_MAP` only contains `"day order 1"` (single space), causing `normalizeDay` to return `null`.
  2. **Missing ERP Day Variations**: Common KL ERP variations such as `"DO 1"`, `"DO-1"`, `"DAYORDER1"`, `"DAY ORDER 01"`, `"DAY 01"`, `"MON (DAY 1)"`, `"MON/DAY1"` are not mapped in `DAY_MAP`.
  3. **Impact on UI**: When `normalizeDay` returns `null`, the day index becomes `-1`. In `page.tsx` Grid View, days are filtered strictly against `['Monday', ..., 'Sunday']`. Any session with an unmapped day string is completely hidden from the user.

### 4.2 Cell Content Extraction (`parseCellContent`)
- **Current Logic** (`lines 182-238`): Uses `klRegex` first, followed by fallback regexes.
  ```ts
  const klRegex = /([A-Z0-9]{5,10})[-_]([LTPSS])\b.*?\b(S-\d+|\w+)\b.*?\b(?:RoomNo|Room|Hall|Lab|Venue)?[-:\s]*([A-Z0-9-]+)/i;
  ```
- **Root Cause Bugs**:
  1. **Rigid 4-Group Requirement**: `klRegex` strictly requires a room match as the 4th capture group. For cells with course code and section but no room (e.g. `"25CS1302E-L - S-10"`), `klRegex` fails to match.
  2. **Section/Room Capture Misalignment**: In `(S-\d+|\w+)`, `\w+` can match `"S"`, leaving `-10` for group 4 `([A-Z0-9-]+)`. This incorrectly parses `section: "S"` and `room: "10"`.
  3. **Room Prefix Stripping**: `match[4].replace(/^RoomNo-/i, '')` only removes literal `RoomNo-`. If room is formatted as `"RoomNo: H-005"` or `"Room H-005"`, the prefix remains attached to the room string (`"RoomNo:H-005"`).
  4. **Hardcoded Empty Faculty**: `parseCellContent` sets `faculty: ''` in both main and fallback branches, completely ignoring faculty names present in cell text.
  5. **Fallback Section & Room Regex Weakness**: `secMatch` (`/\b(S-\d+)\b/i`) fails for section formats like `SEC-10`, `L-10`, `P-10`, `S10`. `roomMatch` (`/(?:RoomNo|Room|Venue|Hall|Lab)...`) fails when no explicit prefix keyword exists (e.g. `"H-005"` or `"C101"`).

### 4.3 Time Slot Expansion (`expandTimeSlots`)
- **Current Logic** (`lines 28-63`): Parses range expressions (e.g., `1 - 2` -> `["1", "2"]`) or extracts numbers.
- **Root Cause Bugs**:
  - If a fallback column header generated by `parseGenericTable` is `"COLUMN_1"`, `expandTimeSlots("COLUMN_1")` extracts `"1"`, erroneously treating generic column names as Period 1.

---

## 5. UI Rendering & Resolution Bugs (`src/app/dashboard/timetable/page.tsx`)

### 5.1 Section-to-Course & Profile Title Resolution Failure
- **Discrepancy with `dashboard/page.tsx`**:
  - Main Dashboard (`src/app/dashboard/page.tsx:381-384, 396-397`) strips component suffixes (`[-_][LTPSS]$`) from course codes:
    ```ts
    const strippedCode = rawCode.replace(/[-_][LTPSS]$/i, '').trim();
    const info = courseLookup[rawCode] || courseLookup[strippedCode];
    ```
  - Timetable Page (`src/app/dashboard/timetable/page.tsx:180-181`) ONLY checks direct equality:
    ```ts
    const info = courseLookup[s.courseCode.toUpperCase()];
    ```
- **Impact**: Timetable cell codes with component suffixes (e.g., `25CS1302E-L`) fail to resolve against profile lookup entries stored as `25CS1302E`. Course titles remain fallback codes (`25CS1302E-L`) instead of full titles.

### 5.2 Chronological Time Slot Sorting Bug
- **Current Code** (`page.tsx:465-474`):
  ```ts
  const sortedTimeSlots = [...parsedTT.timeSlotsPresent].sort((a, b) => {
    const keyA = normalizeSlotKey(a);
    const keyB = normalizeSlotKey(b);
    const numA = Number(keyA);
    const numB = Number(keyB);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  ```
- **Root Cause**: When time slots are 12-hour clock strings (e.g. `"09:00 AM - 09:50 AM"`, `"01:10 PM - 02:00 PM"`), `numA` and `numB` are `NaN`. Sorting falls back to `a.localeCompare(b)`. Alphabetically, `"01:10 PM..."` < `"09:00 AM..."`.
- **Impact**: Afternoon periods (1:10 PM) render at the top of the grid view before 9:00 AM morning classes.

### 5.3 Empty Period Row Hiding Bug
- **Current Code** (`page.tsx:489`):
  ```ts
  if (!hasAnyClass && sortedTimeSlots.length > 0) return null;
  ```
- **Root Cause**: When a period (e.g. Period 2) has no classes scheduled across all days in `parsedTT.sessions`, `hasAnyClass` is `false`. Line 489 returns `null`, hiding the row entirely.
- **Impact**: Creates a discontinuous period grid (e.g. rendering P1, P3, P4 while skipping P2) rather than displaying an empty row with `-` cells.

---

## 6. Synthesis & Recommended Fix Action Plan for Worker

1. **Course Resolution (`page.tsx`)**:
   - Update `page.tsx` line 180 to normalize course codes by stripping `[-_][LTPSS]$` suffixes when building and querying `courseLookup`.
2. **Day Normalization (`src/lib/timetable-parser.ts`)**:
   - In `normalizeDay`, collapse multiple whitespace characters (`clean.replace(/\s+/g, ' ')`).
   - Add aliases for `do 1..7`, `do-1..7`, `dayorder1..7`, `day order 01..07`, `day 01..07`, `d01..07`, `mon (day 1)`, `tue (day 2)`, etc., into `DAY_MAP`.
3. **Cell Content Parser (`src/lib/timetable-parser.ts`)**:
   - Refactor `parseCellContent` into structured regex passes:
     - Match course code (`/([0-9]{2}[A-Z]{2-[5]}[0-9]{3,4}[A-Z]?|[A-Z]{2,5}[0-9]{3,4}[A-Z]?)(?:[-_]([LTPSS]))?/i`).
     - Match section (`/\b(S-\d+|SEC-\d+|SECTION\s*\d+|[LPS]-\d+)\b/i`).
     - Match room (`/(?:RoomNo|Room|Venue|Hall|Lab)[-:\s]*([A-Z0-9-]+)|\b([A-Z]-\d{3,4}|[A-Z]\d{3,4}|FED-\d+|LAB-\d+)\b/i`).
     - Match faculty name if present in raw text lines.
4. **Time Slot Sorting (`page.tsx`)**:
   - Implement a time parser helper (`parseTimeSlotToMinutes`) that converts clock strings (`01:10 PM`) to 24-hour minutes from midnight for robust chronological sorting.
5. **Period Row Hiding (`page.tsx`)**:
   - Keep period rows visible in Grid View when period numbers are sequential (e.g., 1..10) so free periods render as empty matrix cells rather than collapsing the table.
6. **Scraper Hygiene (`src/lib/scraper.ts`)**:
   - Exclude break rows (`"LUNCH BREAK"`, `"TEA BREAK"`) gracefully without dropping valid day rows.
   - Support period header keys containing clock times or period numbers in `isLikelyTimetableData`.
