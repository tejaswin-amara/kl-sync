## 2026-07-24T00:50:08Z
<USER_REQUEST>
You are Implementation Worker M2 for Milestone M2 (R2. Accurate & Flexible CGPA Calculation).
Your working directory is C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2.
Project root is C:\Users\speed\Documents\antigravity\optimistic-pascal.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task Scope (Requirement R2):
Update CGPA extraction across `src/app/dashboard/page.tsx` and `src/app/dashboard/tools/page.tsx` to first detect official ERP-provided CGPA/SGPA summary values directly. If absent, compute weighted grade point average using case-insensitive, flexible column matching (grade, credit/creds, point/gp).

Specific Instructions:
1. Read the design and specifications in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2\handoff.md`.
2. Create `src/lib/cgpa.ts`:
   - `mapGradeToPoints(gradeStr)`: maps letter grades (S/O: 10, A+: 9, A: 8, B+: 7, B: 6, C: 5, D: 4, F/FAIL/AB/DT: 0, P/SATISFACTORY/NC: null).
   - `parseNumericValue(val)`: safely parses numbers from strings like " 3.0 Cr ".
   - `processERPDataForCGPA(rawRows, profileData)`: Phase 1 checks official summary keys ('cgpa', 'sgpa', 'cumulative gpa', 'overall gpa', 'total credit', 'earned credit'); Phase 2 dynamic fallback calculates weighted average with letter grade mapping and preserves failed course credits in the total credits denominator.
3. Refactor `src/app/dashboard/page.tsx` and `src/app/dashboard/tools/page.tsx` to use `processERPDataForCGPA` from `@/lib/cgpa`, replacing the inline calculation loops.
4. Run `npm run build` and ensure 0 TypeScript and Next.js build errors.
5. Document all changes and build output in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2\handoff.md`.
6. Send a completion message back to parent orchestrator.
</USER_REQUEST>
