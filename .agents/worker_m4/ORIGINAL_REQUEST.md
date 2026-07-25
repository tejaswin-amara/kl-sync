## 2026-07-24T09:54:02Z

You are Worker M4 (teamwork_preview_worker).
Your task is to implement Milestone M4 (R4. Timetable Page & Dashboard Widget Robustness) in kl-sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4

Key input files:
- Read analysis report in:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m4\handoff.md
- Code target files:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\lib\timetable-parser.ts
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\timetable\page.tsx
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\page.tsx

Requirements for Timetable Parser & Components:
1. Update `src/lib/timetable-parser.ts` to implement `parseTimetable`, `normalizeDay`, `isSameDay`, `parseCellContent`.
2. Auto-detect timetable layout format:
   - Matrix Days-as-Columns (`headers` have day names)
   - Matrix Days-as-Rows (Row 0 has day names in col 0)
   - List Timetables (Rows have Day, Time, Course, Room, Faculty)
3. Support Day Name Variants: `Monday`, `Mon`, `1`, `Day 1`, `TUE`, `Tue`, `Wednesday`, etc. Prevent false-positive substring matches (e.g. "Common Electronics" on Monday).
4. Smart Cell Parsing: Robustly parse course code, course title, room/venue, and faculty from cell strings. Handle multi-hyphen strings ("22-CS-1101", "C-101 - Lab").
5. Refactor `TodayScheduleWidget` in `src/app/dashboard/page.tsx` to parse timetable data via `parseTimetable`, match current day cleanly, use client-side caching (`sessionStorage`), and render clear loading, empty, and error UI states without spinner freezes.
6. Refactor `src/app/dashboard/timetable/page.tsx` to support interactive Grid and List views, client-side caching, day filters, and clean fallback UI.

Run `npm run build` after making changes to verify TypeScript and Next.js build compilation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4\handoff.md detailing your changes, build results, and send a message back to parent.
