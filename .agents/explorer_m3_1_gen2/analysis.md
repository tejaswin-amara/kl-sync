# Milestone 3 (M3): Agent Toolkit Registry & Executor Analysis Report

## Executive Summary

This report provides a comprehensive technical investigation and concrete implementation blueprint for Milestone 3 (M3: Agentic AI Capabilities & Tooling) of the KL Sync ERP application.

Specifically, it details the design and specification for:
1. **`src/lib/ai/tools.ts`**: The typed Agent Toolkit Registry defining standard JSON Schema function signatures, OpenAI/LLM tool calling definitions, and Zod parameter schemas for 7 core ERP tools.
2. **`src/lib/ai/executor.ts`**: The tool execution engine resolving tool invocations against live ERP scraper pipelines or pure calculator utilities with resilient demo fallbacks and error recovery.

---

## 1. Inspection of Existing Scrapers & Utilities

A thorough codebase audit was conducted across `src/lib/scrapers/`, `src/lib/schemas/`, and `src/lib/` utilities.

| Module | Files Inspected | Key Functions / Entities | Output Data Types & Behavior |
|---|---|---|---|
| **Attendance** | `src/lib/scrapers/attendance.ts`<br>`src/lib/schemas/attendance.ts` | `fetchAttendanceData`, `getCaptcha`, `loginAndFetchSemesters` | Returns `{ success: true, data: Record<string, unknown>[] }`. Validated by `attendanceSubjectSchema`: fields include `Course Code`, `Course Title`, `Conducted Hours`, `Attended Hours`, `Attendance Percentage`, `Academic Year`, `Semester`. |
| **Timetable** | `src/lib/scrapers/timetable.ts`<br>`src/lib/timetable-parser.ts`<br>`src/lib/schemas/timetable.ts` | `fetchTimetableData`, `parseTimetable`, `normalizeDay`, `isSameDay`, `parseCellContent` | Scrapes raw table rows, parsed by `parseTimetable()` into layout (`matrix_days_rows`, `matrix_days_columns`, `list_rows`) and `NormalizedClassSession[]` with `day`, `dayShort`, `dayIndex`, `timeSlot`, `courseCode`, `courseTitle`, `component`, `section`, `room`, `faculty`. |
| **Marks** | `src/lib/scrapers/marks.ts`<br>`src/lib/schemas/marks.ts` | `fetchMarksData`, `fetchEndExamResults`, `fetchCGPAData` | Returns `{ success: true, data: Record<string, unknown>[] }`. Validated by `marksSubjectSchema`: fields include `Course Code`, `Course Name`, `Faculty Name`, `Internal 1`, `Internal 2`, `Assignment`, `Total Marks`. |
| **Fee** | `src/lib/scrapers/fee.ts`<br>`src/lib/fee-utils.ts`<br>`src/lib/schemas/fee.ts` | `fetchFeeData`, `calculatePendingFee`, `parseCurrency`, `isRowUnpaid` | Returns `{ success: true, data: Record<string, unknown>[] }`. `fee-utils.ts` cleans currency symbols (`parseCurrency`), identifies summary rows (`isSummaryRow`), determines unpaid status (`isRowUnpaid`), and calculates pending balance. |
| **Profile** | `src/lib/scrapers/profile.ts`<br>`src/lib/schemas/profile.ts` | `fetchProfileData`, `parseProfileData` | Fetches main profile + 3-subtab concurrency pool. Returns `{ name, universityId, photoUrl, extendedProfile: JSONString, success: true }`. |
| **CGPA / Calculator** | `src/lib/cgpa.ts` | `processERPDataForCGPA`, `mapGradeToPoints` | Grade point mapping (O/S=10, A+=9, A=8, B+=7, B=6, C=5, D=4, F=0). Calculates weighted GPA across credits: $\text{CGPA} = \frac{\sum (\text{GradePoints} \times \text{Credits})}{\sum \text{Credits}}$. |
| **Session & Proxy** | `src/lib/session.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `encodeSession`, `decodeSession`, AES-256-GCM encryption | Session tokens store encrypted cookies + CSRF token. The proxy handler contains rich demo mock data fallbacks used when session cookies are invalid or demo tokens are provided. |

---

## 2. Architecture Plan for Agent Toolkit Registry & Executor

```
  +-----------------------------------------------------------------------+
  |                        LLM / AI Copilot API                           |
  |                       (POST /api/ai/chat)                             |
  +-----------------------------------------------------------------------+
                                     |
             Calls tool with name & JSON args (e.g. getAttendance)
                                     v
  +-----------------------------------------------------------------------+
  |                        src/lib/ai/executor.ts                         |
  |  - Decodes session context (cookies, academicYear, semesterId, demo)  |
  |  - Validates tool arguments using Zod schemas from tools.ts           |
  |  - Catches scraper errors & returns clean error objects (0 crashes)   |
  +-----------------------------------------------------------------------+
                    /                                    \
  ERP Data Tools   /                                      \ Pure Calculators
                  v                                        v
  +--------------------------------+      +--------------------------------+
  |  Live ERP Scraper & Utilities  |      |   Pure Academic Calculators    |
  |  - fetchAttendanceData         |      |   - calculateAttendanceTarget  |
  |  - fetchTimetableData + parser |      |   - predictCGPA                |
  |  - fetchMarksData              |      |   - fee-utils math             |
  |  - fetchFeeData + fee-utils    |      +--------------------------------+
  |  - fetchProfileData            |
  +--------------------------------+
```

### 2.1 File Responsibilities

1. **`src/lib/ai/tools.ts`**:
   - Defines JSON Schema function definitions compatible with OpenAI tool calling and Vercel AI SDK standards.
   - Defines Zod validation schemas (`getAttendanceArgsSchema`, `getTimetableArgsSchema`, etc.).
   - Exports TypeScript interfaces for inputs and tool responses.
   - Exports array `TOOLS_REGISTRY` of all 7 tool definitions for prompt injection and LLM schema passing.

2. **`src/lib/ai/executor.ts`**:
   - Defines `ToolExecutionContext` interface:
     ```ts
     export interface ToolExecutionContext {
       session?: ScraperSession;
       academicYear?: string;
       semesterId?: string;
       isDemo?: boolean;
     }
     ```
   - Exports main dispatcher `executeTool(toolName: string, args: unknown, context?: ToolExecutionContext): Promise<ToolResult>`
   - Provides resilient fallback to demo data if `isDemo` is true or if live ERP fetch fails due to network/session errors, ensuring zero runtime crashes.

---

## 3. Specifications & JSON Schemas for 7 Core ERP Tools

### Tool 1: `getAttendance`

- **Purpose**: Retrieve student attendance records, optionally filtered by subject/course name or code.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "getAttendance",
    "description": "Fetch attendance records for the student. Optionally filter by course code or subject title.",
    "parameters": {
      "type": "object",
      "properties": {
        "subject": {
          "type": "string",
          "description": "Optional course code or subject title to filter attendance (e.g. '23CS2101R' or 'Data Structures')."
        }
      },
      "required": []
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const getAttendanceArgsSchema = z.object({
    subject: z.string().optional(),
  });
  export type GetAttendanceArgs = z.infer<typeof getAttendanceArgsSchema>;

  export interface GetAttendanceResult {
    success: boolean;
    attendance: AttendanceSubject[];
    summary?: {
      totalSubjects: number;
      overallPercentage: number;
      atRiskCount: number; // percentage < 75%
    };
    error?: string;
  }
  ```
- **Execution Wrapper Logic**:
  1. If demo session or no session, use demo attendance dataset from `/api/erp-proxy/attendance`.
  2. Else call `fetchAttendanceData(context.session, context.session.csrfToken, context.academicYear || '2025-2026', context.semesterId || '1')`.
  3. Map raw array rows to structured `AttendanceSubject[]`.
  4. If `args.subject` is provided, filter records matching `Course Code` or `Course Title` (case-insensitive substring match).
  5. Compute summary statistics (`overallPercentage`, `atRiskCount`).

---

### Tool 2: `getTimetable`

- **Purpose**: Retrieve class schedule and timetable slots, optionally filtered by day of the week.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "getTimetable",
    "description": "Fetch class timetable and schedule. Optionally filter by day of the week (e.g., 'Monday', 'Mon', 'Today').",
    "parameters": {
      "type": "object",
      "properties": {
        "day": {
          "type": "string",
          "description": "Optional day name or day order (e.g. 'Monday', 'Tue', 'Today', 'Tomorrow', 'Day 1')."
        }
      },
      "required": []
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const getTimetableArgsSchema = z.object({
    day: z.string().optional(),
  });
  export type GetTimetableArgs = z.infer<typeof getTimetableArgsSchema>;

  export interface GetTimetableResult {
    success: boolean;
    schedule: NormalizedClassSession[];
    daysPresent?: string[];
    error?: string;
  }
  ```
- **Execution Wrapper Logic**:
  1. Fetch raw timetable rows via `fetchTimetableData` (or demo mock if demo mode).
  2. Process rows with `parseTimetable(rawRows)` from `src/lib/timetable-parser.ts`.
  3. If `args.day` is provided:
     - Handle relative terms (`'today'` -> current day of week, `'tomorrow'` -> next day of week).
     - Filter `parsed.sessions` using `isSameDay(session.day, targetDay)`.
  4. Return parsed `schedule`.

---

### Tool 3: `getMarks`

- **Purpose**: Retrieve internal evaluation marks, assignments, and test scores for enrolled courses.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "getMarks",
    "description": "Fetch internal examination and assignment marks for student courses, optionally filtered by semester.",
    "parameters": {
      "type": "object",
      "properties": {
        "semester": {
          "type": "string",
          "description": "Optional semester ID or name to filter marks (e.g. '1', '2')."
        }
      },
      "required": []
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const getMarksArgsSchema = z.object({
    semester: z.string().optional(),
  });
  export type GetMarksArgs = z.infer<typeof getMarksArgsSchema>;

  export interface GetMarksResult {
    success: boolean;
    marks: MarksSubject[];
    error?: string;
  }
  ```
- **Execution Wrapper Logic**:
  1. Fetch marks via `fetchMarksData` (or demo mock if demo mode).
  2. Map raw table rows to `MarksSubject[]` array (`Course Code`, `Course Name`, `Faculty Name`, `Internal 1`, `Internal 2`, `Assignment`, `Total Marks`).
  3. Return `{ success: true, marks }`.

---

### Tool 4: `getFeeDetails`

- **Purpose**: Fetch fee payment history, total fee amount, paid amount, and outstanding pending balance.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "getFeeDetails",
    "description": "Fetch fee payment details, fee heads, total fee, paid amount, and pending balance.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const getFeeDetailsArgsSchema = z.object({});
  export type GetFeeDetailsArgs = z.infer<typeof getFeeDetailsArgsSchema>;

  export interface FeeDetailsBreakdown {
    items: FeeItem[];
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    hasPendingDue: boolean;
  }

  export interface GetFeeDetailsResult {
    success: boolean;
    breakdown: FeeDetailsBreakdown;
    error?: string;
  }
  ```
- **Execution Wrapper Logic**:
  1. Fetch raw fee table via `fetchFeeData` (or demo mock if demo mode).
  2. Parse individual rows into `FeeItem[]` using `src/lib/fee-utils.ts` helpers.
  3. Compute `totalPending` using `calculatePendingFee(data)`.
  4. Sum total gross fees (`totalAmount`) and paid fees (`totalPaid`).
  5. Return `{ success: true, breakdown }`.

---

### Tool 5: `getStudentProfile`

- **Purpose**: Retrieve student personal info, program, department, roll number, and extended profile metadata.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "getStudentProfile",
    "description": "Fetch student profile details including name, university ID, program, department, and photo URL.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const getStudentProfileArgsSchema = z.object({});
  export type GetStudentProfileArgs = z.infer<typeof getStudentProfileArgsSchema>;

  export interface StudentProfileInfo {
    name: string;
    universityId: string;
    photoUrl?: string;
    program?: string;
    department?: string;
    academicYear?: string;
    semester?: string;
    extendedProfile?: Record<string, unknown>;
  }

  export interface GetStudentProfileResult {
    success: boolean;
    profile: StudentProfileInfo;
    error?: string;
  }
  ```
- **Execution Wrapper Logic**:
  1. Fetch profile data using `fetchProfileData(session)` (or demo mock if demo mode).
  2. Safely parse `extendedProfile` JSON string if present.
  3. Extract core fields (`name`, `universityId`, `photoUrl`, `program`, `department`).
  4. Return `{ success: true, profile }`.

---

### Tool 6: `calculateAttendanceTarget`

- **Purpose**: Pure calculator tool to determine how many additional consecutive classes a student must attend to reach a target attendance percentage (or how many classes can be safely skipped).
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "calculateAttendanceTarget",
    "description": "Calculate number of additional classes needed to reach a target attendance percentage (e.g. 75% or 85%) or how many classes can be safely skipped.",
    "parameters": {
      "type": "object",
      "properties": {
        "currentAttended": {
          "type": "number",
          "description": "Number of classes currently attended by the student."
        },
        "currentTotal": {
          "type": "number",
          "description": "Total number of classes conducted so far."
        },
        "targetPercent": {
          "type": "number",
          "description": "Desired target attendance percentage (defaults to 75)."
        }
      },
      "required": ["currentAttended", "currentTotal"]
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const calculateAttendanceTargetArgsSchema = z.object({
    currentAttended: z.number().min(0),
    currentTotal: z.number().min(1),
    targetPercent: z.number().min(1).max(100).optional().default(75),
  });
  export type CalculateAttendanceTargetArgs = z.infer<typeof calculateAttendanceTargetArgsSchema>;

  export interface CalculateAttendanceTargetResult {
    success: boolean;
    currentAttended: number;
    currentTotal: number;
    currentPercentage: number;
    targetPercent: number;
    classesNeeded: number;
    maxBunkable: number;
    status: 'below_target' | 'target_met';
    message: string;
    error?: string;
  }
  ```
- **Execution Calculation Logic**:
  Let $A = \text{currentAttended}$, $T = \text{currentTotal}$, $P = \text{targetPercent}$ (default 75).
  - Current percentage $p_{\text{curr}} = \frac{A}{T} \times 100$.
  - Target fraction $p = \frac{P}{100}$.
  - If $p_{\text{curr}} < P$:
    To reach $P\%$, additional attended classes $x$ must satisfy:
    $$\frac{A + x}{T + x} \ge p \implies A + x \ge pT + px \implies x(1 - p) \ge pT - A \implies x = \left\lceil \frac{pT - A}{1 - p} \right\rceil$$
    Classes needed = $x$, max bunkable = 0, status = `'below_target'`.
  - If $p_{\text{curr}} \ge P$:
    Classes needed = 0, status = `'target_met'`.
    Max bunkable classes $b$ before falling below $P\%$:
    $$\frac{A}{T + b} \ge p \implies A \ge pT + pb \implies pb \le A - pT \implies b = \left\lfloor \frac{A - pT}{p} \right\rfloor$$

---

### Tool 7: `predictCGPA`

- **Purpose**: Pure calculator tool to predict future CGPA based on current CGPA, completed credits, and expected grades in new courses.
- **JSON Schema Function Definition**:
  ```json
  {
    "name": "predictCGPA",
    "description": "Predict future cumulative GPA (CGPA) based on current CGPA, total completed credits, and expected grades in upcoming or new courses.",
    "parameters": {
      "type": "object",
      "properties": {
        "currentCGPA": {
          "type": "number",
          "description": "Student's current cumulative GPA (0.0 to 10.0)."
        },
        "completedCredits": {
          "type": "number",
          "description": "Total credits completed so far."
        },
        "newCourses": {
          "type": "array",
          "description": "Array of new courses with credit weight and anticipated letter grade (e.g. 'O', 'A+', 'A', 'B+').",
          "items": {
            "type": "object",
            "properties": {
              "credits": {
                "type": "number",
                "description": "Credits for this course (e.g. 3 or 4)."
              },
              "expectedGrade": {
                "type": "string",
                "description": "Expected letter grade (e.g. 'O', 'S', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F')."
              }
            },
            "required": ["credits", "expectedGrade"]
          }
        }
      },
      "required": ["currentCGPA", "completedCredits", "newCourses"]
    }
  }
  ```
- **Zod Schema & TS Interfaces**:
  ```ts
  export const newCourseItemSchema = z.object({
    credits: z.number().positive(),
    expectedGrade: z.string(),
  });

  export const predictCGPAArgsSchema = z.object({
    currentCGPA: z.number().min(0).max(10),
    completedCredits: z.number().min(0),
    newCourses: z.array(newCourseItemSchema).min(1),
  });
  export type PredictCGPAArgs = z.infer<typeof predictCGPAArgsSchema>;

  export interface PredictCGPAResult {
    success: boolean;
    currentCGPA: number;
    completedCredits: number;
    newCredits: number;
    totalCredits: number;
    predictedCGPA: number;
    gpaDelta: number;
    error?: string;
  }
  ```
- **Execution Calculation Logic**:
  1. Map expected grades using `mapGradeToPoints(grade)` from `src/lib/cgpa.ts`.
  2. Compute existing grade points: $\text{CurrentPoints} = \text{currentCGPA} \times \text{completedCredits}$.
  3. Compute new points and new credits:
     $$\text{NewPoints} = \sum (\text{GradePoints}_i \times \text{Credits}_i)$$
     $$\text{NewCredits} = \sum \text{Credits}_i$$
  4. Compute predicted CGPA:
     $$\text{PredictedCGPA} = \frac{\text{CurrentPoints} + \text{NewPoints}}{\text{completedCredits} + \text{NewCredits}}$$
  5. Round `predictedCGPA` to 2 decimal places.
  6. Compute `gpaDelta = Number((predictedCGPA - currentCGPA).toFixed(2))`.

---

## 4. Implementation Steps for Implementer Agent

To complete M3 implementation seamlessly:
1. **Create `src/lib/ai/tools.ts`**:
   - Export all 7 tool schemas, Zod definitions, TS interfaces, and `TOOLS_REGISTRY` array.
2. **Create `src/lib/ai/executor.ts`**:
   - Implement `executeTool(name, args, context)` dispatcher.
   - Implement execution wrappers for each tool incorporating live scraper calls and pure calculators.
   - Implement resilient error handling and demo fallback.
3. **Verify Compliance**:
   - Run `npx tsc --noEmit` and `npm run test` to verify build and test clean status.

---

## 5. Verification Method

- **TypeScript Type Check**: `npx tsc --noEmit` (must yield 0 errors).
- **Unit Testing**: Add unit test suite in `src/lib/ai/tools.test.ts` exercising all 7 tools with valid and invalid inputs.
- **Node Test Runner**: `npx tsx --test src/lib/ai/tools.test.ts` and `npm run test`.
