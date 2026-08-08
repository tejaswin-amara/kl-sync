## 2026-08-08T08:56:07Z
You are a Worker subagent assigned to Milestone M1: Authentication & Session Simplification (R1) for KL Sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m1

Requirement document path: C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md
Explorer findings reference: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
1. Refactor `src/lib/session.ts` to replace the custom Node.js `crypto.createCipheriv` / `crypto.createDecipheriv` logic with a minimal standard Web Crypto API implementation (`crypto.subtle` or standard Web Crypto API).
2. Ensure that `src/lib/session.ts` contains ZERO references to `crypto.createCipheriv` or `crypto.createDecipheriv`.
3. Use `DEMO_SESSION` imported from `@/lib/fixtures` on error or fallback.
4. If session helper signatures change (e.g. async), update all callers across API routes and test files accordingly (`captcha/route.ts`, `login/route.ts`, `erp-proxy/[module]/route.ts`, `fetch-photo/route.ts`, `ai/chat/route.ts`, and test suites).
5. Run build/test verification:
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run lint`
6. Write your changes and handoff report to `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m1\handoff.md`.
7. Send a completion message to parent orchestrator (d001f6ce-ed2c-4291-9348-4a740f85a8b7).
