# Analysis Report: R2 — Native AI Tool Calling

## Summary
Requirement R2 requires removing manual regex/keyword-based intent routing (`parseNaturalLanguageIntent`) from `src/lib/ai/executor.ts` and refactoring the AI execution engine to use Vercel AI SDK (`generateText`) with strict Zod tool schemas. This document presents a comprehensive code exploration of current intent routing, supported tool schemas, tool execution workflows, and a step-by-step refactoring architecture.

---

## 1. Current Implementation Analysis

### 1.1 Intent Routing (`parseNaturalLanguageIntent`)
- **File**: `src/lib/ai/executor.ts` (Lines 676–768)
- **Mechanism**:
  - Uses an array of hardcoded rules (`INTENT_RULES`) containing string keyword lists (`['target', 'bunk', ...]`, `['attendance', 'present', ...]`, etc.).
  - Converts query to lowercase and performs string inclusion checks (`rule.keywords.some(k => q.includes(k))`).
  - Matches return a static `IntentMatch` object with hardcoded default arguments (e.g., fixed attendance values `{ currentAttended: 33, currentTotal: 40, targetPercent: 75 }` for `calculateAttendanceTarget`).
- **Flaws & Over-Engineering**:
  - Fragile string substring matching fails on phrasing variations.
  - Forces artificial static default arguments instead of extracting parameters dynamically from user context.
  - Imposes maintenance overhead when expanding tools or natural language vocabulary.

### 1.2 Supported Tools & Zod Parameter Schemas
All 7 ERP tools are defined in `src/lib/ai/tools.ts` with explicit Zod schemas:

| Tool Name | Zod Schema | Parameter Shape | Description |
|---|---|---|---|
| `getAttendance` | `getAttendanceArgsSchema` | `{ subject?: string }` | Fetch attendance records with optional subject filter |
| `getTimetable` | `getTimetableArgsSchema` | `{ day?: string }` | Fetch class schedule with optional day filter |
| `getMarks` | `getMarksArgsSchema` | `{ semester?: string }` | Fetch internal marks with optional semester filter |
| `getFeeDetails` | `getFeeDetailsArgsSchema` | `{}` | Fetch fee breakdown, paid, and pending balance |
| `getStudentProfile` | `getStudentProfileArgsSchema` | `{}` | Fetch student name, ID, program, and department |
| `calculateAttendanceTarget` | `calculateAttendanceTargetArgsSchema` | `{ currentAttended: number, currentTotal: number, targetPercent?: number }` | Calculate classes needed to reach target or max bunkable |
| `predictCGPA` | `predictCGPAArgsSchema` | `{ currentCGPA: number, completedCredits: number, newCourses: Array<{ credits: number, expectedGrade: string }> }` | Predict cumulative GPA based on anticipated grades |

### 1.3 Tool Execution Flow
- **File**: `src/lib/ai/executor.ts` (Lines 617–674)
- **Function**: `executeTool(toolName, args, context)`:
  - Dispatches `toolName` to dedicated executor functions (`executeGetAttendance`, `executeGetTimetable`, etc.).
  - Validates `args` using `schema.parse(args)` before processing.
  - Supports demo fallbacks when session cookies are absent or in demo mode (`isDemo: true`).
- **API Handler Integration**:
  - **File**: `src/app/api/ai/chat/route.ts` (Lines 93–230)
  - Accepts user chat message -> calls `parseNaturalLanguageIntent(userQuery)` -> calls `executeTool(intent.toolName, intent.args, context)` -> synthesizes markdown response -> returns `{ success: true, message: { role: 'assistant', content }, toolCalls }`.

---

## 2. Refactoring Architecture & Strategy

### 2.1 Vercel AI SDK Integration
1. **Package Dependency**:
   - Add `ai` (Vercel AI SDK) to `package.json`.
2. **Native Tool Definitions**:
   - Wrap each tool execution function in Vercel AI SDK's `tool()` helper using existing Zod schemas:
   ```ts
   import { generateText, tool } from 'ai';
   import {
     getAttendanceArgsSchema,
     getTimetableArgsSchema,
     getMarksArgsSchema,
     getFeeDetailsArgsSchema,
     getStudentProfileArgsSchema,
     calculateAttendanceTargetArgsSchema,
     predictCGPAArgsSchema,
   } from './tools';

   export const erpTools = {
     getAttendance: tool({
       description: 'Fetch attendance records for the student. Optionally filter by course code or subject title.',
       parameters: getAttendanceArgsSchema,
       execute: async (args, { context }) => executeGetAttendance(args, context),
     }),
     getTimetable: tool({
       description: 'Fetch class timetable and schedule. Optionally filter by day of the week.',
       parameters: getTimetableArgsSchema,
       execute: async (args, { context }) => executeGetTimetable(args, context),
     }),
     getMarks: tool({
       description: 'Fetch internal examination and assignment marks for student courses.',
       parameters: getMarksArgsSchema,
       execute: async (args, { context }) => executeGetMarks(args, context),
     }),
     getFeeDetails: tool({
       description: 'Fetch fee payment details, fee heads, total fee, paid amount, and pending balance.',
       parameters: getFeeDetailsArgsSchema,
       execute: async (args, { context }) => executeGetFeeDetails(args, context),
     }),
     getStudentProfile: tool({
       description: 'Fetch student profile details including name, university ID, program, and department.',
       parameters: getStudentProfileArgsSchema,
       execute: async (args, { context }) => executeGetStudentProfile(args, context),
     }),
     calculateAttendanceTarget: tool({
       description: 'Calculate number of additional classes needed to reach target attendance percentage or bunkable classes.',
       parameters: calculateAttendanceTargetArgsSchema,
       execute: async (args) => executeCalculateAttendanceTarget(args),
     }),
     predictCGPA: tool({
       description: 'Predict future cumulative GPA (CGPA) based on current CGPA, credits, and expected grades.',
       parameters: predictCGPAArgsSchema,
       execute: async (args) => executePredictCGPA(args),
     }),
   };
   ```

### 2.2 Offline / Testing / Fallback Mode
- To ensure unit tests (`ai-chat.test.ts`, `ai-chat-challenger.test.ts`, `copilot.test.ts`) and offline demo modes pass deterministically without requiring live OpenAI API keys:
  - Implement a mock language model wrapper / fallback handler for `generateText` when `process.env.OPENAI_API_KEY` is not present.
  - Ensure `generateText` gracefully handles offline tool calls while maintaining standard schema validation.

### 2.3 Required Test Updates
Removing `parseNaturalLanguageIntent` will require updating imports and test assertions in:
1. `src/lib/ai/tools.test.ts`
2. `src/app/api/ai-chat.test.ts`
3. `src/app/api/ai-chat-challenger.test.ts`
4. `src/components/ai/copilot.test.ts`

---

## 3. Impact Analysis & Recommendations
- **No breaking change to API Contract**: `/api/ai/chat` payload structure remains identical (`{ success, message, toolCalls }`).
- **Improved Tool Calling Precision**: Zod schemas combined with LLM tool calling eliminate hardcoded fallback arguments and handle query intent accurately.
- **Code Cleanliness**: Deletes ~100 lines of regex keyword rules from `executor.ts`.
