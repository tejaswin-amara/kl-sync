# Handoff Report: R2 Native AI Tool Calling Analysis

## 1. Observation
- **File**: `src/lib/ai/executor.ts` (Lines 676–768) contains `parseNaturalLanguageIntent` and `INTENT_RULES`, which implement string/regex keyword matching over queries.
- **File**: `src/lib/ai/tools.ts` contains 7 tool definitions with Zod schemas (`getAttendanceArgsSchema`, `getTimetableArgsSchema`, `getMarksArgsSchema`, `getFeeDetailsArgsSchema`, `getStudentProfileArgsSchema`, `calculateAttendanceTargetArgsSchema`, `predictCGPAArgsSchema`).
- **File**: `src/app/api/ai/chat/route.ts` imports and invokes `parseNaturalLanguageIntent` to route user messages to `executeTool`.
- **File**: `package.json` currently lacks `ai` (Vercel AI SDK).
- **Tests**: `src/lib/ai/tools.test.ts`, `src/app/api/ai-chat.test.ts`, `src/app/api/ai-chat-challenger.test.ts`, `src/components/ai/copilot.test.ts` directly reference or assert against `parseNaturalLanguageIntent`.

## 2. Logic Chain
1. `parseNaturalLanguageIntent` relies on static string keyword matching (`q.includes(k)`) and returns hardcoded argument defaults for complex calculation tools.
2. Replacing this mechanism with Vercel AI SDK `generateText` and strict Zod schemas allows native model-driven tool selection and dynamic parameter extraction.
3. The 7 tool parameter schemas in `src/lib/ai/tools.ts` are already implemented using Zod, making them directly compatible with Vercel AI SDK's `tool()` wrapper.
4. To maintain offline test suite reliability when `OPENAI_API_KEY` is absent, `generateText` implementation must include a deterministic fallback mechanism.
5. Deleting `parseNaturalLanguageIntent` requires updating 4 test files that import it.

## 3. Caveats
- No source code modifications were performed during this read-only investigation.
- `ai` package must be added to `package.json` during the implementation phase.
- Ensure the JSON output schema of `/api/ai/chat` remains unchanged so frontend copilot components do not experience breaking interface changes.

## 4. Conclusion
R2 refactoring can be cleanly achieved by:
1. Adding `ai` dependency to `package.json`.
2. Deleting `parseNaturalLanguageIntent` and `INTENT_RULES` from `src/lib/ai/executor.ts`.
3. Exporting native `tool()` definitions using existing Zod schemas in `executor.ts` / `tools.ts`.
4. Refactoring `src/app/api/ai/chat/route.ts` to execute `generateText` with native tool schemas and fallback handling for offline/test environments.
5. Updating test suites to remove `parseNaturalLanguageIntent` assertions while verifying native tool execution.

## 5. Verification Method
1. Verify static analysis:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
2. Verify AI tool test suites:
   ```bash
   npx tsx --test src/lib/ai/tools.test.ts src/app/api/ai-chat.test.ts src/app/api/ai-chat-challenger.test.ts src/components/ai/copilot.test.ts
   ```
3. Verify full test suite:
   ```bash
   npm test
   ```
