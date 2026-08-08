# Handoff Report — Milestone M2 (Native AI Tool Calling - R2) Verification

Verdict: REQUEST_CHANGES

## 1. Observation

### Observation 1.1: TypeScript Type Checking Failure (`npx tsc --noEmit`)
Executing `npx tsc --noEmit` failed with **11 compilation errors** in `src/lib/ai/executor.ts`:

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
src/lib/ai/executor.ts(692,5): error TS2322: Type '() => Promise<...>' is not assignable to type '...'. Property 'warnings' is missing in type '{ rawCall: ... }' but required in type 'LanguageModelV4GenerateResult'.
src/lib/ai/executor.ts(752,5): error TS2353: Object literal may only specify known properties, and 'maxSteps' does not exist in type 'LanguageModelCallOptions & RequestOptions<...>'.
src/lib/ai/executor.ts(766,14): error TS2339: Property 'result' does not exist on type 'TypedToolResult<...>'.
```

### Observation 1.2: Division by Zero (`Infinity`) in `executeCalculateAttendanceTarget`
In `src/lib/ai/executor.ts`, lines 394–407:
```typescript
if (currentPercentage < targetPercent) {
  // Needs x classes: (target * T - 100 * A) / (100 - target)
  const numerator = targetPercent * currentTotal - 100 * currentAttended;
  const denominator = 100 - targetPercent;
  const classesNeeded = Math.max(0, Math.ceil(numerator / denominator));

  return {
    success: true,
    currentAttended,
    currentTotal,
    currentPercentage,
    targetPercent,
    classesNeeded,
    maxBunkable: 0,
    status: 'below_target',
    message: `Your current attendance is ${currentPercentage}%. You need to attend the next ${classesNeeded} consecutive class(es) to reach your target of ${targetPercent}%.`,
  };
}
```
When `targetPercent` is `100` (valid according to `calculateAttendanceTargetArgsSchema` `z.number().min(1).max(100)`) and `currentAttended < currentTotal` (e.g., 35/40):
`denominator` evaluates to `100 - 100 = 0`. `numerator / denominator` evaluates to `500 / 0 = Infinity`.
The function returns `classesNeeded: Infinity` and formats message: `"Your current attendance is 87.5%. You need to attend the next Infinity consecutive class(es) to reach your target of 100%."`

### Observation 1.3: Unmapped Grade Fallback in `executePredictCGPA`
In `src/lib/ai/tools.ts`, line 172:
`export const newCourseItemSchema = z.object({ credits: z.number().positive(), expectedGrade: z.string() });`
In `src/lib/ai/executor.ts`, lines 442–443:
```typescript
const pts = mapGradeToPoints(course.expectedGrade);
const gradePts = pts !== null ? pts : 8; // Fallback to A (8.0) if unmapped
```
When an arbitrary or invalid string (e.g. `"INVALID"`, `"UNKNOWN"`) is passed for `expectedGrade`, `mapGradeToPoints` returns `null`. `executePredictCGPA` silently maps unmapped/invalid grades to `8.0` (Grade A) instead of rejecting invalid grades or returning a validation error.

---

## 2. Logic Chain

1. Requirement R2 and static analysis acceptance criteria specify:
   - `npx tsc --noEmit` must pass with zero errors.
   - Native AI tool calling with strict Zod tool schemas and valid result structures.
2. In Observation 1.1, running `npx tsc --noEmit` directly produced 11 compiler errors across `createErpTools`, `MockLanguageModelV4`, `generateText`, and `sdkResult.toolResults`.
   - In `createErpTools` (lines 536–578), passing untyped/loosely-typed `(args)` callbacks to Vercel AI SDK `tool()` fails TypeScript overload resolution (`TS2769`, `TS7006`).
   - In `getMockLanguageModel` (line 692), `MockLanguageModelV4` response object is missing mandatory `warnings: []` property (`TS2322`).
   - In `processAIChat` (line 752), `generateText` parameter options object includes `maxSteps: 2` which is not a valid property on this SDK version (`TS2353`).
   - In `processAIChat` (line 766), `tr.result` property access on `TypedToolResult` causes `TS2339` because the output is stored in `tr.output` (or `tr.args`).
3. In Observation 1.2, empirical testing of `executeCalculateAttendanceTarget` with `targetPercent: 100` and `currentAttended < currentTotal` caused a division by zero (`100 - 100 = 0`), resulting in `classesNeeded = Infinity`. This violates expected result structure guarantees (number field returning `Infinity`).
4. In Observation 1.3, empirical testing of `executePredictCGPA` with unmapped `expectedGrade` strings revealed that `executePredictCGPA` falls back to `8.0` points for any unmapped string, distorting grade prediction without validating letter grades via Zod enum or schema constraints.

---

## 3. Caveats

- `npm test` passes 199 baseline tests because existing test suites do not invoke `tsc --noEmit` and do not test edge case parameters like `targetPercent = 100` or `expectedGrade = "INVALID"`.
- Mock AI language model routing in unit tests functions, but type signatures must be aligned with the project's installed `@ai-sdk/openai` and `ai` version.

---

## 4. Conclusion

The native AI tool implementation in `src/lib/ai/executor.ts` fails static analysis acceptance criteria (`npx tsc --noEmit` fails with 11 errors) and contains edge-case mathematical calculation bugs (`Infinity` output in `calculateAttendanceTarget`).

**Verdict**: **REQUEST_CHANGES**

### Required Fixes:
1. Fix all 11 TypeScript compilation errors in `src/lib/ai/executor.ts`:
   - Type the `args` parameter in `createErpTools` execute handlers to match Zod schema inferences.
   - Add `warnings: []` to `MockLanguageModelV4` `doGenerate` return payload.
   - Remove invalid `maxSteps` parameter from `generateText` or replace with valid call option.
   - Use `tr.output` instead of `tr.result` when reading tool results in `processAIChat`.
2. Guard against division by zero in `executeCalculateAttendanceTarget` when `targetPercent` is 100 or when `denominator === 0`.
3. Restrict `expectedGrade` schema in `src/lib/ai/tools.ts` or handle unmapped grades cleanly in `executePredictCGPA`.

---

## 5. Verification Method

To independently verify the fixes:
1. Run static type check:
   `npx tsc --noEmit`
   *Must exit code 0 with zero errors.*
2. Run full test suite:
   `npm test`
   *Must exit code 0 with all tests passing.*
3. Execute empirical tool tests for `calculateAttendanceTarget` with `targetPercent: 100` and `predictCGPA` with invalid grades.
