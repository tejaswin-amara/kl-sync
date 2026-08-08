# KL Sync Simplification: R3 Dependency Purge & Build/Test Analysis

**Author:** Explorer Subagent (`explorer_3`)  
**Date:** 2026-08-08  
**Status:** Completed (Read-Only Investigation)  

---

## Executive Summary

This report provides a comprehensive, read-only architectural analysis for **R3 Dependency Purge** (`swr`, `clsx`, `tailwind-merge`) and the **Build, Lint, and E2E Test Setup** of the KL Sync application.

### Key Discoveries & Recommendations:
1. **Dependency Purge (`package.json`)**:
   - `package.json` contains 3 dependencies to be purged: `swr` (`^2.5.0`), `clsx` (`^2.1.1`), and `tailwind-merge` (`^3.6.0`).
   - `swr` is imported across 5 custom data hooks (`useAttendance`, `useFee`, `useMarks`, `useProfile`, `useTimetable`), 1 reusable table component (`ERPTablePage.tsx`), and 1 test file (`src/hooks/challenger-swr.test.ts`).
   - `clsx` and `tailwind-merge` are exclusively imported in `src/lib/utils.ts` to power the `cn()` helper function.
2. **SWR Refactoring to Native Fetch / React 19 `use()`**:
   - The 5 data hooks (`useAttendance`, `useFee`, `useMarks`, `useProfile`, `useTimetable`) and `ERPTablePage.tsx` can be refactored using native `fetch` and React 19 patterns while maintaining exact return interface signatures (`{ data, isLoading, error, mutate }`).
   - This ensures zero breaking changes across all 5 dashboard page components (`/dashboard`, `/dashboard/attendance`, `/dashboard/fee`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/timetable`).
3. **Native `cn()` Helper Refactoring**:
   - `cn()` in `src/lib/utils.ts` can be replaced with a zero-dependency recursive string/array/object flattener using standard template literals and array filtering.
   - All 16 UI components in `src/components/ui/` use `cn()` for conditional class concatenation without relying on `tailwind-merge` conflict resolution.
4. **Build, Lint, and E2E Verification**:
   - `npx tsc --noEmit` passes cleanly with **0 errors**.
   - `npm run lint` (`eslint`) passes cleanly with **0 errors/warnings**.
   - `npm test` (`npx tsx --test src/**/*.test.ts`) passes all **186 tests across 32 suites**.
   - `playwright.config.ts` configures Chromium single-worker execution against local `webServer` at `http://localhost:3000` for 2 Playwright E2E suites (`auth-captcha.spec.ts` and `dashboard-routes.spec.ts`).

---

## 1. R3 Dependency Purge Investigation

### 1.1 Dependency Audit (`package.json`)

`package.json` lines 16, 21, and 22 contain the target dependencies:
```json
"clsx": "^2.1.1",
"swr": "^2.5.0",
"tailwind-merge": "^3.6.0",
```
Deleting these three dependencies reduces production package count by 3 and eliminates black-box runtime caching and class merging overhead.

---

### 1.2 `swr` Codebase Usages & Refactoring Plan

#### File-by-File Inventory of `swr` Usages:
| File Path | Description / Usage | Refactoring Action |
| --- | --- | --- |
| `src/hooks/useAttendance.ts` | Imports `useSWR`, `KeyedMutator`. Uses SWR tuple key `['/api/erp-proxy/attendance', academicYear, semesterId]` | Replace with native `fetch` stateful hook / React 19 `use()`, preserve `UseAttendanceResult` signature and `mutate` refetch trigger. |
| `src/hooks/useFee.ts` | Imports `useSWR`, `KeyedMutator`. Uses SWR key `'/api/erp-proxy/fee'` | Replace with native `fetch`, preserve `UseFeeResult` signature. |
| `src/hooks/useMarks.ts` | Imports `useSWR`, `KeyedMutator`. Uses SWR tuple key `['/api/erp-proxy/marks', academicYear, semesterId]` | Replace with native `fetch`, preserve `UseMarksResult` signature. |
| `src/hooks/useProfile.ts` | Imports `useSWR`, `KeyedMutator`. Uses SWR key `'/api/erp-proxy/profile'` | Replace with native `fetch`, preserve `UseProfileResult` signature. |
| `src/hooks/useTimetable.ts` | Imports `useSWR`, `KeyedMutator`. Uses SWR tuple key `['/api/erp-proxy/timetable', academicYear, semesterId]` | Replace with native `fetch`, preserve `UseTimetableResult` signature. |
| `src/components/ERPTablePage.tsx` | Imports `useSWR`. Uses SWR key `/api/erp-proxy/${module}` | Replace with native `fetch` in state/effect or `use()`, maintaining `mutate` trigger for error state retries. |
| `src/app/dashboard/attendance/page.tsx` | Destructures `error: swrError` from `useAttendance` | Rename variable `swrError` -> `fetchError` or `error` for clarity (no structural logic change). |
| `src/app/dashboard/fee/page.tsx` | Destructures `error: swrError` from `useFee` | Rename variable `swrError` -> `fetchError` or `error`. |
| `src/app/dashboard/marks/page.tsx` | Destructures `error: swrError` from `useMarks` | Rename variable `swrError` -> `fetchError` or `error`. |
| `src/app/dashboard/profile/page.tsx` | Destructures `error: swrError` from `useProfile` | Rename variable `swrError` -> `fetchError` or `error`. |
| `src/app/dashboard/timetable/page.tsx` | Destructures `error: swrError` from `useTimetable` | Rename variable `swrError` -> `fetchError` or `error`. |
| `src/hooks/challenger-swr.test.ts` | Tests SWR fetcher validation, calculation edge cases, and conditional keys | Remove `swr` imports, update test labels to reflect native fetchers. |

#### Native Fetch & React 19 Refactoring Architecture:
To maintain 100% backward compatibility with client pages without modifying page-level data structures:

1. **Stateful Native Hook Implementation Pattern**:
```ts
import { useState, useEffect, useCallback } from 'react';

export function useDataHook(param1?: string, param2?: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!param1 || !param2) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await nativeFetcher(param1, param2);
      setData(result);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [param1, param2]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, mutate: fetchData };
}
```
2. **Keyed Mutator Replacement**:
   Replace `KeyedMutator<T>` type references with `() => Promise<void> | void`.

---

### 1.3 `clsx` and `tailwind-merge` Audit & `cn()` Refactoring Plan

#### Current `src/lib/utils.ts` (Lines 1-6):
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Proposed Native `cn()` Implementation:
```ts
export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
```

#### UI Component `cn()` Usage Audit:
All 16 components in `src/components/ui/` use `cn(...)` to concatenate base utility classes and conditional string flags (`size === 'sm' && 'text-[10px]'`) with optional consumer `className` strings:
- `aria-live.tsx`
- `badge.tsx`
- `button.tsx`
- `card.tsx`
- `command.tsx`
- `dialog.tsx`
- `empty-state.tsx`
- `input.tsx`
- `page-header.tsx`
- `progress.tsx`
- `select.tsx`
- `sheet.tsx`
- `skeleton.tsx`
- `stat-card.tsx`
- `toast.tsx`
- `tooltip.tsx`

None of these components require complex Tailwind class deduplication (such as conflicting padding or color classes). The native `cn()` flattener handles all string, boolean guard, object mapping, and array concatenation cases natively with zero external dependencies.

---

## 2. Build, Lint, and E2E Test Setup Investigation

### 2.1 `package.json` Scripts Execution Audit

| Script Command | Underlying Tool | Observed Result | Status |
| --- | --- | --- | --- |
| `npx tsc --noEmit` | TypeScript Compiler v5 | Exited with code `0`. Zero type errors. | **PASS** |
| `npm run lint` | ESLint v9 (`eslint-config-next`) | Exited with code `0`. Zero lint errors/warnings. | **PASS** |
| `npm test` | Node Native Runner (`npx tsx --test src/**/*.test.ts`) | Passed 186 unit/integration tests across 32 test suites. | **PASS** |

---

### 2.2 Playwright Configuration (`playwright.config.ts`)

`playwright.config.ts` configuration details:
- **Test Directory**: `./e2e`
- **Workers**: `1` (sequential deterministic execution)
- **Base URL**: `http://localhost:3000`
- **Web Server Config**:
  - Command: `npm run start`
  - URL: `http://localhost:3000`
  - Timeout: 120,000 ms
  - Environment: `SESSION_SECRET` (defaults to 32-char test secret key), `CAP_SECRET` (defaults to test cap secret key).

---

### 2.3 Existing E2E Test Suites (`e2e/*.spec.ts`)

#### 1. `e2e/auth-captcha.spec.ts` (Form Submissions & Auto-Solving CAPTCHAs):
- **Flow Tested**:
  1. Navigates to `/`.
  2. Asserts `#student-id-field`, `#password-field`, `#captcha-field`, and Continue button are visible.
  3. Verifies Visual ERP OCR CAPTCHA auto-solves and populates `#captcha-field`.
  4. Verifies Cap CAPTCHA widget auto-solves and enables submit button.
  5. Fills credentials (`2100030000` / `TestPassword123`) and submits form.
  6. Confirms URL redirects to `/dashboard`.

#### 2. `e2e/dashboard-routes.spec.ts` (Comprehensive 7-Route E2E Browser Verification):
- **Pre-test setup (`beforeEach`)**: Sets `kl_erp_session` cookie and populates `localStorage` / `sessionStorage` with mock academic year (`2025-2026`), semester (`1`), CSRF token, and mock timetable matrix.
- **Routes Verified**:
  - **Route 1**: `/` (Login Route heading and inputs visible)
  - **Route 2**: `/dashboard` (Overview cards: Cumulative GPA, Attendance, Pending Fees, Completed Credits, Daily Schedule)
  - **Route 3**: `/dashboard/timetable` (Student Timetable heading, Grid/List view toggle buttons, Export CSV button, table rendering)
  - **Route 4**: `/dashboard/attendance` (Live Attendance heading, subject cards/table)
  - **Route 5**: `/dashboard/marks` (Internal Marks heading, assessment score items)
  - **Route 6**: `/dashboard/profile` (Student Profile heading, ID `2100030000`, course list)
  - **Route 7**: `/dashboard/fee` (Fee Details heading, tuition balance)

---

## 3. Proposed Source Code Modifications for Implementer

When the implementer executes R3, the precise file edits required are:

1. **`package.json`**:
   - Remove lines for `"clsx"`, `"swr"`, `"tailwind-merge"`.
2. **`src/lib/utils.ts`**:
   - Remove imports of `clsx` and `tailwind-merge`.
   - Insert native `cn()` function.
3. **`src/hooks/useAttendance.ts`, `useFee.ts`, `useMarks.ts`, `useProfile.ts`, `useTimetable.ts`**:
   - Replace `useSWR` with native `fetch` + `useState`/`useEffect`.
4. **`src/components/ERPTablePage.tsx`**:
   - Replace `useSWR` with native `fetch` + `useState`/`useEffect`.
5. **`src/hooks/challenger-swr.test.ts`**:
   - Remove `swr` imports and update test descriptions.
6. **`src/app/dashboard/*/page.tsx`**:
   - Clean up remaining `swrError` variable naming references if desired.

---

## 4. Verification Checklist for Implementer

- [ ] Run `npm install` after removing packages from `package.json` (or `npm prune`).
- [ ] Run `npx tsc --noEmit` to verify zero type errors.
- [ ] Run `npm run lint` to verify zero ESLint errors/warnings.
- [ ] Run `npm test` to verify all 186 unit/integration tests pass.
- [ ] Run `npx playwright test` to verify both E2E test suites pass against the refactored app.
