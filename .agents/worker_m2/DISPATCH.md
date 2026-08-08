## 2026-08-08T09:02:38Z
You are a Worker subagent assigned to Milestone M2: Native AI Tool Calling (R2) for KL Sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2

Requirement document path: C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md
Explorer findings reference: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_2\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
1. Add `ai` (Vercel AI SDK) to `package.json` (or install via npm).
2. Delete `parseNaturalLanguageIntent` and `INTENT_RULES` from `src/lib/ai/executor.ts`.
3. Refactor `src/lib/ai/executor.ts` and `src/app/api/ai/chat/route.ts` to use Vercel AI SDK `generateText` with strict Zod tool schemas from `src/lib/ai/tools.ts`.
4. Ensure robust fallback/mock language model handling when `OPENAI_API_KEY` is absent so that test suites and offline demo execution work deterministically.
5. Update tests that previously referenced `parseNaturalLanguageIntent` (`src/lib/ai/tools.test.ts`, `src/app/api/ai-chat.test.ts`, `src/app/api/ai-chat-challenger.test.ts`, `src/components/ai/copilot.test.ts`).
6. Run build/test verification:
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run lint`
7. Write changes and handoff report to `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2\handoff.md`.
8. Send a completion message to parent orchestrator (d001f6ce-ed2c-4291-9348-4a740f85a8b7).
