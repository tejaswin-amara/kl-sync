# Handoff Report — M2 Review (Native AI Tool Calling - R2)

## 1. Observation

### Codebase & Specification Inspection
- **Files Inspected**:
  - `src/lib/ai/executor.ts` (938 lines)
  - `src/lib/ai/tools.ts` (322 lines)
  - `src/app/api/ai/chat/route.ts` (110 lines)
  - `src/lib/ai/tools.test.ts` (168 lines)
  - `src/app/api/ai-chat.test.ts` (98 lines)
  - `src/app/api/ai-chat-challenger.test.ts` (301 lines)
- **Requirement Audit (R2)**:
  - `parseNaturalLanguageIntent` (manual regex routing) has been removed completely from `src/lib/ai/executor.ts`.
  - Vercel AI SDK `generateText` and `tool()` with Zod schemas (`getAttendanceArgsSchema`, `getTimetableArgsSchema`, etc. from `src/lib/ai/tools.ts`) are used in `processAIChat` and `createErpTools`.
  - Fallback handling when `OPENAI_API_KEY` is not present is implemented via `getMockLanguageModel(userQuery)`, which returns a `MockLanguageModelV4` instance from `ai/test`.

### Verification Command Execution Results
1. `npm test`
   - Command: `npm test`
   - Result: **PASS** (199/199 tests passed across 32 suites in 7.4s)
2. `npm run lint`
   - Command: `npm run lint`
   - Result: **PASS** (0 errors, 1 warning in `src/lib/fixtures.immutability.test.ts`)
3. `npx tsc --noEmit`
   - Command: `npx tsc --noEmit`
   - Result: **FAIL** (Exit code 1, 16 TypeScript compilation errors in `src/lib/ai/executor.ts`)

Verbatim `npx tsc --noEmit` output snippet:
```
src/lib/ai/executor.ts(540,7): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Type '(args: any) => Promise<GetAttendanceResult>' is not assignable to type 'undefined'.
src/lib/ai/executor.ts(540,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(546,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(546,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(552,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(552,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(558,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(558,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(564,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(564,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(570,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(570,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(576,7): error TS2769: No overload matches this call.
src/lib/ai/executor.ts(576,23): error TS7006: Parameter 'args' implicitly has an 'any' type.
src/lib/ai/executor.ts(692,5): error TS2322: Type '() => Promise<...>' is not assignable to type ... Property 'warnings' is missing in type '{ rawCall: ... }' but required in type 'LanguageModelV4GenerateResult'.
src/lib/ai/executor.ts(752,5): error TS2353: Object literal may only specify known properties, and 'maxSteps' does not exist in type 'LanguageModelCallOptions & RequestOptions...'
src/lib/ai/executor.ts(766,14): error TS2339: Property 'result' does not exist on type 'TypedToolResult<...>'
```

---

## 2. Logic Chain

1. **Static Analysis Requirement**: `ORIGINAL_REQUEST.md` specifies under Acceptance Criteria: "`npm run build`, `npm run lint`, and `npx tsc --noEmit` must pass perfectly with zero errors."
2. **Observed Failure**: Running `npx tsc --noEmit` fails with 16 TypeScript errors in `src/lib/ai/executor.ts`.
3. **Specific Type Mismatches**:
   - Lines 540-576: `createErpTools` passes unannotated `args` parameters in tool `execute` callbacks, triggering `TS7006: Parameter 'args' implicitly has an 'any' type` and `TS2769` overload mismatch.
   - Line 692: `getMockLanguageModel` `doGenerate` return objects are missing the required `warnings: []` property expected by `LanguageModelV4GenerateResult`, triggering `TS2322`.
   - Line 752: `maxSteps` is passed to `generateText` in AI SDK v7 where `maxSteps` is not a property on `generateText` options, triggering `TS2353`.
   - Line 766: `tr.result` property access on `TypedToolResult` triggers `TS2339`.
4. **Integrity Check**: No integrity violations or cheating were detected (no hardcoded test outputs or facade implementations).
5. **Verdict Derivation**: Because static type checking (`npx tsc --noEmit`) fails with 16 errors, the implementation does not meet the acceptance criteria and changes must be requested.

---

## 3. Caveats

- Live network requests with real OpenAI API keys were not tested because `OPENAI_API_KEY` is not present in the environment; however, mock model fallback testing via `getMockLanguageModel` and `MockLanguageModelV4` was verified and passed all 199 unit/integration tests.
- Playwright E2E tests were not run as part of this subagent invocation; verification relied on unit/integration tests and static analysis.

---

## 4. Conclusion

The implementation of Milestone M2 (Native AI Tool Calling) successfully refactors AI routing to use Vercel AI SDK `generateText` and strict Zod tool schemas, removing legacy regex routing, and provides functional offline/fallback handling via `MockLanguageModelV4`. All 199 tests pass and linting passes without errors.

However, **`npx tsc --noEmit` fails with 16 TypeScript errors in `src/lib/ai/executor.ts`**. Therefore, the verdict is **REQUEST_CHANGES**.

Verdict: REQUEST_CHANGES

### Required Fixes:
1. **Fix `createErpTools` Type Annotations (`src/lib/ai/executor.ts:540-576`)**:
   Add explicit type annotations to `execute` parameters, e.g.:
   `execute: async (args: z.infer<typeof getAttendanceArgsSchema>) => executeGetAttendance(args, context)`
2. **Fix `MockLanguageModelV4` `doGenerate` Returns (`src/lib/ai/executor.ts:692`)**:
   Include `warnings: []` in the return object of `doGenerate`.
3. **Fix `generateText` Call Options (`src/lib/ai/executor.ts:752`)**:
   Remove `maxSteps: 2` or use valid options supported by the installed `@ai-sdk` version.
4. **Fix `ToolResult` Property Access (`src/lib/ai/executor.ts:766`)**:
   Cast or safely access `tr.output` / `(tr as any).result`.

---

## 5. Verification Method

To verify after applying fixes:
1. `npm test` — verify all unit/integration tests pass.
2. `npx tsc --noEmit` — verify zero TypeScript errors.
3. `npm run lint` — verify zero lint errors.
