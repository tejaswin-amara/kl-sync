# M1 Data Hooks & Zod Schema Investigation & Implementation Plan

## Executive Summary
This document presents the detailed architectural investigation and concrete implementation plan for Milestone 1 (M1: Architecture & Data Fetching Foundation) of the KL Sync ERP Overhaul project. It covers existing data fetching patterns, dependency requirements, and design specifications for SWR client hooks (`src/hooks/`) and Zod runtime validation schemas (`src/lib/schemas/`).

---

## 1. Existing Data Fetching Patterns Analysis

### 1.1 Architecture & Current Components
Currently, data fetching across `src/app/dashboard/*` and `src/components/ERPTablePage.tsx` relies on a mix of custom state hooks and ad-hoc `fetch` invocations inside React components:

1. **`src/hooks/useERPData.ts`**:
   - A custom Hook providing `{ data, loading, error, refresh }`.
   - Uses `useState`, `useEffect`, `useCallback`, and a `queueMicrotask` block for hydrating state from `localStorage` based on a `cacheKey`.
   - Executed on component mount when `autoFetch` is `true`.

2. **`src/hooks/useAcademicSession.ts`**:
   - Manages state for academic years (`years`, `selectedYear`) and semesters (`semesters`, `selectedSem`).
   - Reads session parameters from `localStorage` (`kl_erp_year`, `kl_erp_sem`, `kl_academic_years`) and `sessionStorage`.

3. **Dashboard Page Implementations**:
   - **Attendance Page (`src/app/dashboard/attendance/page.tsx`)**: Sends POST requests to `/api/erp-proxy/attendance` with JSON body `{ academicYear, semesterId, csrfToken }`. Computes overall attendance stats (conducted vs. attended hours).
   - **Timetable Page (`src/app/dashboard/timetable/page.tsx`)**: Issues parallel requests via `Promise.allSettled` to `/api/erp-proxy/timetable`, `/api/erp-proxy/profile`, and `/api/erp-proxy/marks`. Uses `parseTimetable()` to parse matrix grid/session rows into `ParsedTimetable`. Caches data in `sessionStorage` under `kl_timetable_${year}_${sem}`.
   - **Marks Page (`src/app/dashboard/marks/page.tsx`)**: Sends POST requests to `/api/erp-proxy/marks`.
   - **Fee Page (`src/app/dashboard/fee/page.tsx`)**: Sends GET requests to `/api/erp-proxy/fee`.
   - **Profile Page (`src/app/dashboard/profile/page.tsx`)**: Sends GET requests to `/api/erp-proxy/profile?t=...` (`cache: 'no-store'`). Hydrates from `localStorage.getItem('kl_student_profile')`.
   - **ERPTablePage Component (`src/components/ERPTablePage.tsx`)**: Generic fallback table viewer used for simple modules (`circulars`, `hostels`, `library`, `exam-seating`, `tools`). Executes GET requests to `/api/erp-proxy/${module}`.

### 1.2 Identified Deficiencies & Architectural Gaps
- **Lack of Global Cache Deduplication**: Concurrent navigation between dashboard pages or header widgets results in multiple redundant network requests.
- **Inconsistent Cache Strategies**: Timetable uses `sessionStorage`, Profile and ERPData use `localStorage`, and Attendance/Marks do not cache responses on the client.
- **React 19 Linting Warnings**: Microtask state hydration patterns inside `useEffect` trigger `react-hooks/set-state-in-effect` warnings.
- **No Background Revalidation**: Components cannot automatically revalidate data on window refocus or network reconnect.
- **Unvalidated API Payloads**: Proxy responses are cast directly using `res.json()` or `Record<string, unknown>[]` without runtime Zod validation.

---

## 2. Package Dependency Audit

An audit of `package.json` reveals the following:
- **`swr`**: **Not installed** (missing from `dependencies` and `devDependencies`).
- **`zod`**: **Not installed** (missing from `dependencies` and `devDependencies`).

### Recommendation for Implementation
To satisfy M1 and PROJECT.md requirements:
1. **Package Installation**: Implementers should add `swr` (`^2.3.3`) and `zod` (`^3.24.2`) to `dependencies` in `package.json` (`npm install swr zod`).
2. **Fallback Design**: In case npm installations are restricted during a build step, a lightweight zero-dependency SWR hook wrapper and custom object validator pattern can be provided as a secondary fallback.

---

## 3. Concrete Implementation Plan: SWR Client Data Hooks (`src/hooks/`)

The SWR data fetching layer will standardize all module data hooks to conform to the contract defined in `PROJECT.md` Section 45.

### Common Fetcher & SWR Configuration
Create `src/lib/swr-fetcher.ts` or helper within `src/hooks/` to handle JSON requests, CSRF token attachment, and unified error handling (including session expiration detection).

```typescript
export async function erpFetcher<T>(url: string, body?: object): Promise<T> {
  const method = body ? 'POST' : 'GET';
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Session expired or invalid response format.');
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch ERP data');
  }
  return json;
}
```

### Hook Specifications

#### 1. `src/hooks/useAttendance.ts`
- **Parameters**: `(academicYear?: string, semesterId?: string)`
- **Key**: `academicYear && semesterId ? ['/api/erp-proxy/attendance', academicYear, semesterId] : null`
- **Fetcher**: Calls POST `/api/erp-proxy/attendance` with `{ academicYear, semesterId, csrfToken }`.
- **Return Type**:
  ```typescript
  export interface UseAttendanceResult {
    data: AttendanceSubject[] | null;
    raw: Record<string, unknown>[] | null;
    overallPercentage: number;
    totalAttended: number;
    totalConducted: number;
    isLoading: boolean;
    error: Error | null;
    mutate: KeyedMutator<any>;
  }
  ```
- **Validation**: Validates response using `attendanceResponseSchema` from `@/lib/schemas/attendance`.

#### 2. `src/hooks/useTimetable.ts`
- **Parameters**: `(academicYear?: string, semesterId?: string)`
- **Key**: `academicYear && semesterId ? ['/api/erp-proxy/timetable', academicYear, semesterId] : null`
- **Fetcher**: Fetches timetable, profile, and marks in parallel, parses via `parseTimetable()`, and maps course details.
- **Return Type**:
  ```typescript
  export interface UseTimetableResult {
    data: ParsedTimetable | null;
    isLoading: boolean;
    error: Error | null;
    mutate: KeyedMutator<any>;
  }
  ```
- **Validation**: Validates raw response using `timetableResponseSchema` from `@/lib/schemas/timetable`.

#### 3. `src/hooks/useMarks.ts`
- **Parameters**: `(academicYear?: string, semesterId?: string)`
- **Key**: `academicYear && semesterId ? ['/api/erp-proxy/marks', academicYear, semesterId] : null`
- **Fetcher**: Calls POST `/api/erp-proxy/marks` with `{ academicYear, semesterId, csrfToken }`.
- **Return Type**:
  ```typescript
  export interface UseMarksResult {
    data: MarksSubject[] | null;
    isLoading: boolean;
    error: Error | null;
    mutate: KeyedMutator<any>;
  }
  ```
- **Validation**: Validates response using `marksResponseSchema` from `@/lib/schemas/marks`.

#### 4. `src/hooks/useFee.ts`
- **Parameters**: None
- **Key**: `'/api/erp-proxy/fee'`
- **Fetcher**: Calls GET `/api/erp-proxy/fee`.
- **Return Type**:
  ```typescript
  export interface UseFeeResult {
    data: FeeItem[] | null;
    totalPending: number;
    totalPaid: number;
    isLoading: boolean;
    error: Error | null;
    mutate: KeyedMutator<any>;
  }
  ```
- **Validation**: Validates response using `feeResponseSchema` from `@/lib/schemas/fee`.

#### 5. `src/hooks/useProfile.ts`
- **Parameters**: None
- **Key**: `'/api/erp-proxy/profile'`
- **Fetcher**: Calls GET `/api/erp-proxy/profile`.
- **Return Type**:
  ```typescript
  export interface UseProfileResult {
    data: ProfileData | null;
    isLoading: boolean;
    error: Error | null;
    mutate: KeyedMutator<any>;
  }
  ```
- **Validation**: Validates response using `profileResponseSchema` from `@/lib/schemas/profile`. Handles automated logout on 401 / session expiration.

---

## 4. Concrete Implementation Plan: Zod Runtime Validation Schemas (`src/lib/schemas/`)

Zod validation schemas ensure type safety and runtime verification for both incoming API request bodies and outgoing proxy/scraper responses.

### Schema File Index

#### 1. `src/lib/schemas/login.ts`
```typescript
import { z } from 'zod';

export const semesterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const loginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  captcha: z.string().min(1, 'Captcha is required'),
  session: z.object({
    cookies: z.array(z.object({ name: z.string(), value: z.string() })),
    csrfToken: z.string(),
    userAgent: z.string().optional(),
  }),
  deviceId: z.string().optional(),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  session: z.object({
    cookies: z.array(z.object({ name: z.string(), value: z.string() })),
    csrfToken: z.string(),
    userAgent: z.string().optional(),
  }).optional(),
  csrfToken: z.string().optional(),
  academicYears: z.array(semesterOptionSchema).optional(),
  semesters: z.array(semesterOptionSchema).optional(),
  deviceId: z.string().optional(),
  needsCaptchaRetry: z.boolean().optional(),
  error: z.string().optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

#### 2. `src/lib/schemas/attendance.ts`
```typescript
import { z } from 'zod';

export const attendanceSubjectSchema = z.object({
  'Course Code': z.string().optional(),
  'Course Title': z.string().optional(),
  'Conducted Hours': z.string().or(z.number()).optional(),
  'Attended Hours': z.string().or(z.number()).optional(),
  'Attendance Percentage': z.string().optional(),
  'Academic Year': z.string().optional(),
  Semester: z.string().optional(),
}).passthrough(); // Allows additional dynamic columns from ERP

export const attendanceResponseSchema = z.object({
  success: z.boolean(),
  attendanceData: z.array(attendanceSubjectSchema).optional(),
  data: z.array(attendanceSubjectSchema).optional(),
  error: z.string().optional(),
});

export type AttendanceSubject = z.infer<typeof attendanceSubjectSchema>;
export type AttendanceResponse = z.infer<typeof attendanceResponseSchema>;
```

#### 3. `src/lib/schemas/timetable.ts`
```typescript
import { z } from 'zod';

export const rawTimetableRowSchema = z.record(z.string(), z.unknown());

export const timetableSlotSchema = z.object({
  day: z.string(),
  timeSlot: z.string(),
  courseCode: z.string(),
  courseTitle: z.string().optional(),
  room: z.string().optional(),
  faculty: z.string().optional(),
  component: z.string().optional(),
  section: z.string().optional(),
});

export const timetableResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(rawTimetableRowSchema).optional(),
  error: z.string().optional(),
});

export type TimetableSlot = z.infer<typeof timetableSlotSchema>;
export type TimetableResponse = z.infer<typeof timetableResponseSchema>;
```

#### 4. `src/lib/schemas/marks.ts`
```typescript
import { z } from 'zod';

export const marksSubjectSchema = z.object({
  'Course Code': z.string().optional(),
  'Course Name': z.string().optional(),
  'Faculty Name': z.string().optional(),
  'Internal 1': z.string().optional(),
  'Internal 2': z.string().optional(),
  Assignment: z.string().optional(),
  'Total Marks': z.string().optional(),
}).passthrough();

export const marksResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(marksSubjectSchema).optional(),
  error: z.string().optional(),
});

export type MarksSubject = z.infer<typeof marksSubjectSchema>;
export type MarksResponse = z.infer<typeof marksResponseSchema>;
```

#### 5. `src/lib/schemas/fee.ts`
```typescript
import { z } from 'zod';

export const feeItemSchema = z.object({
  'Fee Type': z.string().optional(),
  Amount: z.string().or(z.number()).optional(),
  'Paid Amount': z.string().or(z.number()).optional(),
  'Balance Amount': z.string().or(z.number()).optional(),
  Status: z.string().optional(),
}).passthrough();

export const feeResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(feeItemSchema).optional(),
  error: z.string().optional(),
});

export type FeeItem = z.infer<typeof feeItemSchema>;
export type FeeResponse = z.infer<typeof feeResponseSchema>;
```

#### 6. `src/lib/schemas/profile.ts`
```typescript
import { z } from 'zod';

export const profileDataSchema = z.object({
  name: z.string().optional(),
  universityId: z.string().optional(),
  photoUrl: z.string().optional(),
  extendedProfile: z.string().optional(),
  success: z.boolean().optional(),
}).passthrough();

export const profileResponseSchema = z.object({
  success: z.boolean(),
  data: profileDataSchema.optional(),
  error: z.string().optional(),
});

export type ProfileData = z.infer<typeof profileDataSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
```

---

## 5. Integration Roadmap for M1 Implementers

1. **Step 1: Install Dependencies**
   Run `npm install swr zod` to update `package.json`.
2. **Step 2: Create Schema Files**
   Create directory `src/lib/schemas/` and populate `attendance.ts`, `timetable.ts`, `marks.ts`, `fee.ts`, `profile.ts`, `login.ts`, and `index.ts`.
3. **Step 3: Create SWR Hooks**
   Create `src/hooks/useAttendance.ts`, `src/hooks/useTimetable.ts`, `src/hooks/useMarks.ts`, `src/hooks/useFee.ts`, `src/hooks/useProfile.ts`.
4. **Step 4: Refactor Dashboard Pages**
   Update `src/app/dashboard/attendance/page.tsx`, `timetable/page.tsx`, `marks/page.tsx`, `fee/page.tsx`, `profile/page.tsx` to use the new SWR hooks instead of raw `useEffect` + `fetch` calls.
5. **Step 5: Validate Proxy & Scraper Endpoints**
   Integrate Zod schema `.safeParse()` calls into `/api/login/route.ts` and `/api/erp-proxy/[module]/route.ts`.
