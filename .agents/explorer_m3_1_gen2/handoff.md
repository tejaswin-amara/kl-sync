# Handoff Report — M3 Agent Toolkit Registry Explorer

## 1. Observation
- **Inspected Files**:
  - `src/lib/scrapers/attendance.ts` (lines 275-336): `fetchAttendanceData` takes `session`, `csrfToken`, `academicYear`, `semesterId` and returns `{ success: true, data: attendanceData }`.
  - `src/lib/schemas/attendance.ts` (lines 3-18): `attendanceSubjectSchema` defines `Course Code`, `Course Title`, `Conducted Hours`, `Attended Hours`, `Attendance Percentage`, `Academic Year`, `Semester`.
  - `src/lib/scrapers/timetable.ts` (lines 109-273): `fetchTimetableData` fetches raw timetable table.
  - `src/lib/timetable-parser.ts` (lines 1-678): `parseTimetable` parses raw rows into `NormalizedClassSession[]` with `id`, `day`, `dayShort`, `dayIndex`, `timeSlot`, `courseCode`, `courseTitle`, `component`, `section`, `room`, `faculty`. Also provides `normalizeDay`, `isSameDay`.
  - `src/lib/schemas/timetable.ts` (lines 5-14): `timetableSlotSchema` defines `day`, `timeSlot`, `courseCode`, `courseTitle`, `room`, `faculty`, `component`, `section`.
  - `src/lib/scrapers/marks.ts` (lines 10-44): `fetchMarksData` returns `{ success: true, data: parseGenericTable(html) }`.
  - `src/lib/schemas/marks.ts` (lines 3-11): `marksSubjectSchema` defines `Course Code`, `Course Name`, `Faculty Name`, `Internal 1`, `Internal 2`, `Assignment`, `Total Marks`.
  - `src/lib/scrapers/fee.ts` (lines 10-22): `fetchFeeData` returns `{ success: true, data: parseGenericTable(html) }`.
  - `src/lib/fee-utils.ts` (lines 10-506): Provides `parseCurrency`, `findStatusKey`, `isRowUnpaid`, and `calculatePendingFee` calculating total pending fee balance.
  - `src/lib/schemas/fee.ts` (lines 3-9): `feeItemSchema` defines `Fee Type`, `Amount`, `Paid Amount`, `Balance Amount`, `Status`.
  - `src/lib/scrapers/profile.ts` (lines 11-331): `fetchProfileData` extracts `name`, `universityId`, `photoUrl`, `extendedProfile` JSON string.
  - `src/lib/schemas/profile.ts` (lines 3-9): `profileDataSchema` defines `name`, `universityId`, `photoUrl`, `extendedProfile`.
  - `src/lib/cgpa.ts` (lines 20-313): `processERPDataForCGPA` and `mapGradeToPoints` map letter grades (O/S=10, A+=9, A=8, B+=7, B=6, C=5, D=4, F=0) and calculate weighted GPAs.
  - `src/lib/session.ts` (lines 24-75): `encodeSession` and `decodeSession` handle AES-256-GCM encrypted session tokens.
  - `src/app/api/erp-proxy/[module]/route.ts` (lines 130-308): Contains complete mock demo datasets for attendance, timetable, marks, profile, cgpa, and fee when demo sessions are passed.
- **Identified Gaps**:
  - `src/lib/ai/` directory and files `src/lib/ai/tools.ts` and `src/lib/ai/executor.ts` do not exist yet.
  - The 7 required ERP tools (`getAttendance`, `getTimetable`, `getMarks`, `getFeeDetails`, `getStudentProfile`, `calculateAttendanceTarget`, `predictCGPA`) need to be registered and implemented.

---

## 2. Logic Chain
1. **From Scraper & Schema Analysis to Tool Wrappers**:
   - Each ERP data module (`attendance`, `timetable`, `marks`, `fee`, `profile`) already has underlying fetchers and data schemas.
   - Wrapping them into AI tools requires extracting parameters (e.g. `subject` for attendance, `day` for timetable, `semester` for marks) and applying post-fetch filtering or parsing.
2. **From Utility Analysis to Pure Calculators**:
   - `calculateAttendanceTarget` uses formula $x = \lceil (pT - A)/(1 - p) \rceil$ for attendance targets ($p = 0.75$ or user target) and computes bunkable classes $b = \lfloor (A - pT)/p \rfloor$.
   - `predictCGPA` uses `mapGradeToPoints` from `src/lib/cgpa.ts` to compute new grade points and update total weighted CGPA.
3. **From Proxy Demo Fallbacks to Resilient Executor**:
   - The executor must accept `ToolExecutionContext` (`session`, `academicYear`, `semesterId`, `isDemo`).
   - If `isDemo` is true or if live ERP fetch throws an error, the executor falls back to mock demo data to guarantee zero runtime crashes during AI chat or agent-as-judge runs.
4. **JSON Schema Compatibility**:
   - Standard JSON Schema objects with `type`, `properties`, and `required` arrays allow direct integration with OpenAI API / Vercel AI SDK function calling.

---

## 3. Caveats
- **ERP Server Timings**: Live ERP fetch calls depend on session cookie validity and network availability. Demo fallbacks guarantee reliability during offline testing.
- **Date/Day Parsing**: Relative day keywords like "today" or "tomorrow" rely on client/server system clock. `isSameDay` in `timetable-parser.ts` handles standard day names ("Monday", "Tue") and day orders ("Day 1").

---

## 4. Conclusion
The implementation blueprint in `analysis.md` provides full specifications, JSON Schema function definitions, TypeScript interfaces, and execution wrapper logic for creating `src/lib/ai/tools.ts` and `src/lib/ai/executor.ts`. The 7 core ERP tools wrap existing scrapers and utilities cleanly without requiring scraper structural changes.

---

## 5. Verification Method

To verify the implementation once created:
1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Unit Tests**:
   ```bash
   npx tsx --test src/lib/scraper.test.ts
   ```
   (and new unit tests for `src/lib/ai/tools.test.ts` when created).
3. **Inspection of Artifacts**:
   - `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3_1_gen2\analysis.md`
   - `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3_1_gen2\handoff.md`
