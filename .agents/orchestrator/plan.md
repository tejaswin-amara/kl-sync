# Execution Plan — KL Sync Application Optimization

## Objectives
1. Perform Ponytail optimization across `src/`: remove unused code, imports, redundant abstractions, maximize execution speed while preserving functionality.
2. Achieve 100% pass rates on `npx tsc --noEmit` (0 errors) and `npm test` (19/19 tests).
3. Verify comprehensive Playwright E2E browser testing for all 7 routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`) with seamless Cap & OCR CAPTCHA auto-solving and live ERP rendering.

## Phase Breakdown

### Phase 1: Investigation & Audit (M1)
- Dispatch 3 Explorers (`explorer_m1_1`, `explorer_m1_2`, `explorer_m1_3`).
  - Explorer 1: Inspect `src/lib/`, check dead code, unused functions, imports, captcha logic, unit test suite (`npm test`).
  - Explorer 2: Inspect `src/app/`, check route pages, components, unused UI imports, state calls, layout truncation risks across the 7 routes.
  - Explorer 3: Audit E2E browser testing infrastructure (Playwright/scripts), verify CAPTCHA auto-solver endpoints and route testing capabilities.

### Phase 2: Ponytail Optimization & Unit Test Fixes (M2)
- Dispatch Worker (`worker_m2`).
  - Implement dead code elimination, import pruning, state optimization.
  - Fix any failing unit tests or type errors, run `npx tsc --noEmit` and `npm test`.
  - Confirm 19/19 unit tests pass and 0 type errors.

### Phase 3: E2E Browser Testing & Route Verification (M3)
- Dispatch Worker (`worker_m3`).
  - Set up / execute Playwright browser tests across all 7 routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`).
  - Test form submissions, Cap CAPTCHA auto-solving, visual ERP OCR CAPTCHA auto-solving, and ERP data rendering without layout truncation.

### Phase 4: Review, Challenger & Forensic Integrity Audit (M4)
- Dispatch 2 Reviewers (`reviewer_1`, `reviewer_2`) to check code quality and test coverage.
- Dispatch 2 Challengers (`challenger_1`, `challenger_2`) to stress-test browser automation and routes.
- Dispatch Forensic Auditor (`auditor_1`) to perform integrity verification.
- Gate sign-off.
