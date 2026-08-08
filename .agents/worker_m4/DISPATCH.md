## 2026-08-08T08:50:33Z
You are a Worker subagent assigned to Milestone M4: Mock Data Consolidation (R4) for KL Sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4

Requirement document path: C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md
Explorer findings reference: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
1. Create a consolidated fixtures module at `src/lib/fixtures/index.ts` (or `src/lib/fixtures.ts` exported via `src/lib/fixtures`).
2. Consolidate and export all fallback datasets: `DEMO_SESSION`, `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_CGPA`, `DEMO_CAPTCHA_SVG`, and `DEMO_LOGIN_RESULT`.
3. Refactor consumers to import from `@/lib/fixtures` rather than repeating inline duplicate mock data:
   - `src/lib/session.ts`
   - `src/lib/ai/executor.ts`
   - `src/app/api/captcha/route.ts`
   - `src/app/api/login/route.ts`
   - `src/app/api/erp-proxy/[module]/route.ts`
   - `src/app/api/ai/chat/route.ts`
4. Run build/test verification:
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run lint`
5. Record your changes, commands executed, and results in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m4\handoff.md`.
6. Send a completion message to parent orchestrator (d001f6ce-ed2c-4291-9348-4a740f85a8b7).
