## 2026-07-24T04:24:01Z
You are Worker M2 (teamwork_preview_worker).
Your task is to implement Milestone M2 (R2. Accurate & Flexible CGPA Calculation) in kl-sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2

Key input files:
- Read analysis report in:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2\handoff.md
- Code target files:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\lib\cgpa.ts
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\page.tsx
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\tools\page.tsx

Requirements for CGPA calculation:
1. Update `src/lib/cgpa.ts` to implement `processERPDataForCGPA(rows, profileData)`, `mapGradeToPoints(gradeStr)`, and `parseNumericValue(val)`.
2. Phase 1 (Official Summary Detection): Check ERP searchgetmycgpa and summary tables for official CGPA/SGPA keys (`cgpa`, `sgpa`, `cumulative gpa`, `overall gpa`, `gpa`). If found, return official values immediately.
3. Phase 2 (Dynamic Fallback Calculation): Use case-insensitive, flexible column matching (`grade`, `credit`, `point`/`gp`). If grade points column is missing, map letter grades to 10-point scale (O/S: 10, A+: 9, A: 8, B+: 7, B: 6, C: 5, D: 4, F: 0). Keep failed course credits in total credits denominator. Exclude 0-credit non-academic courses (Pass/Fail, Audit).
4. Refactor `src/app/dashboard/page.tsx` and `src/app/dashboard/tools/page.tsx` to consume `processERPDataForCGPA` from `src/lib/cgpa.ts`.

Run `npm run build` after making changes to verify TypeScript and Next.js build compilation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2\handoff.md detailing your changes, build results, and send a message back to parent.
