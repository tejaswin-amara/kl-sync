# 🔍 Technical Analysis Report: E2E Browser Testing Infrastructure & CAPTCHA Auto-Solving Mechanics

**Repository**: `kl-sync` (`optimistic-pascal`)  
**Investigator**: `teamwork_preview_explorer_m1_3`  
**Date**: 2026-08-02  
**Scope**: E2E testing setup, Cap CAPTCHA & Visual ERP OCR auto-solving flow, Page/Form analysis across 7 routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`).

---

## 1. Executive Summary & Key Findings

1. **Current E2E Infrastructure**:
   - Playwright is **not currently installed** in the repository (`package.json` lacks `@playwright/test`).
   - Existing unit test suite runs via Node.js native test runner (`npx tsx --test src/**/*.test.ts`) covering 18 unit test cases in `src/lib/scraper.test.ts` and token verification in `src/lib/captcha.test.ts`.
   - No `playwright.config.ts` or `e2e/` test directory exists.

2. **Dual CAPTCHA Auto-Solving Architecture**:
   - **Cap CAPTCHA (Application PoW Widget)**: Implemented in `src/components/Captcha.tsx` using `cap-widget` and `capjs-core`. On page load, `widgetRef.current.solve()` fires automatically via client `useEffect` to solve the PoW challenge in the background via `/api/captcha/challenge` and `/api/captcha/redeem`. Submit button remains disabled until `captchaToken` is resolved.
   - **Visual ERP OCR CAPTCHA (Legacy ERP Image Code)**: Implemented in `src/app/api/captcha/route.ts`. Retrieves raw CAPTCHA image + initial ASP.NET session token from ERP, then automatically executes server-side OCR via `api.ocr.space` (Engine 2 with Engine 1 fallback). `GET /api/captcha` returns `{ captchaImage, solvedCaptcha }` and sets response header `x-session-id`. On page mount, `fetchCaptcha()` automatically pre-fills the `#captcha-field` input value with `solvedCaptcha`.

3. **7 Dashboard & Login Routes Analysis**:
   - All 7 routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`) feature rich interactive controls (year/semester selectors, search bars, day pills, view toggles, CSV exports, tab switchers) and rely on `/api/erp-proxy/[module]` endpoints.
   - Authentication relies on `sessionStorage.getItem('kl_erp_session_id')` and the `kl_erp_session` HttpOnly cookie.

---

## 2. E2E Repository Setup Audit

### Current Test Architecture
- `package.json` scripts:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "npx tsx --test src/**/*.test.ts"
  }
  ```
- No Playwright configuration (`playwright.config.ts`) or browser automation binaries exist.

### Required Playwright Setup Steps
To implement end-to-end browser testing:
1. **Dependencies**:
   ```bash
   npm install -D @playwright/test
   npx playwright install --with-deps chromium
   ```
2. **`playwright.config.ts` Specification**:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },
     projects: [
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
       { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
     ],
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120 * 1000,
     },
   });
   ```

---

## 3. CAPTCHA Auto-Solving Mechanics Deep Dive

### A. Cap CAPTCHA (Client-Side & Server Validation)
- **Component File**: `src/components/Captcha.tsx`
- **Endpoints**:
  - `POST /api/captcha/challenge` (`src/app/api/captcha/challenge/route.ts`): Uses `generateChallenge(process.env.CAP_SECRET!, { scope: "login", expiresMs: 600000 })`.
  - `POST /api/captcha/redeem` (`src/app/api/captcha/redeem/route.ts`): Uses `validateChallenge(...)` to consume nonce in Redis/memory and store token via `storeRedeemedToken`.
- **Client Load Auto-Solving**:
  ```typescript
  useEffect(() => {
    if (mounted && widgetRef.current) {
      const widget = widgetRef.current;
      widget.solve().then((res) => {
        if (res && res.token) {
          onVerify(res.token);
        }
      }).catch((err) => {
        console.error("Auto CAPTCHA solve error:", err);
      });
    }
  }, [mounted, onVerify]);
  ```
- **Login Verification**: In `src/app/api/login/route.ts`:
  ```typescript
  if (!(await verifyCaptchaToken(captchaToken))) {
    return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
  }
  ```
- **E2E Testing Note**: In Playwright tests, `widget.solve()` requires a small computation window (~100–300ms) on page load before `captchaToken` is emitted and `button[type="submit"]` becomes enabled.

### B. Visual ERP OCR CAPTCHA (Server-Side Auto-Solve & Client Auto-Fill)
- **Endpoint**: `GET /api/captcha` (`src/app/api/captcha/route.ts`)
- **Server OCR Engine Flow**:
  1. Calls `getCaptcha()` from `src/lib/scrapers/attendance.ts` to fetch base64 image and initial ASP.NET session.
  2. Sends clean base64 image to `https://api.ocr.space/parse/image` using `OCREngine: 2` (Attempt 1).
  3. If result length < 3 or empty, falls back to `OCREngine: 1` (Attempt 2).
  4. Returns JSON `{ captchaImage, solvedCaptcha }` and sets header `x-session-id`.
- **Client Auto-Fill Flow**:
  In `src/app/page.tsx` (`fetchCaptcha()`):
  ```typescript
  const data = await response.json();
  setCaptchaImage(data.captchaImage);
  if (data.solvedCaptcha) {
    setCaptcha(data.solvedCaptcha); // Input #captcha-field is auto-populated!
  }
  ```
- **E2E Testing Note**: If `api.ocr.space` is down or rate-limited in test environments (using default `'helloworld'` key), `solvedCaptcha` can be empty. E2E tests should be able to explicitly type into `#captcha-field` if OCR fails or when running against mock backend.

---

## 4. Route-by-Route Analysis & E2E Testing Specifications

### Route 1: Login Page (`/`)
- **File**: `src/app/page.tsx`
- **Initial Load Behavior**:
  - Checks `sessionStorage.getItem('kl_erp_session_id')`. If present, auto-redirects to `/dashboard`.
  - Otherwise, triggers `fetchCaptcha()` (`GET /api/captcha`) and mounts `<Captcha />` widget.
- **Key Form Inputs & Selectors**:
  - Student ID: `input#student-id-field`
  - Password: `input#password-field`
  - Remember Me: `input#remember`
  - Visual CAPTCHA: `input#captcha-field`
  - Refresh CAPTCHA button: `button[aria-label="Refresh security verification code"]`
  - Submit button: `button[type="submit"]` (disabled until `captchaToken` is set)
- **Authentication API**: `POST /api/login` with body `{ username, password, captcha, captchaToken, deviceId }` and header `x-session-id`.
- **Device Registration Flow**: If `data.needsCaptchaRetry` is true, status message displays asking user to enter captcha once more.

### Route 2: Dashboard Overview (`/dashboard`)
- **File**: `src/app/dashboard/page.tsx` & `src/components/Navigation.tsx`
- **Data Hydration**:
  - Instant hydration from `localStorage` (`kl_dashboard_cgpa`, `kl_dashboard_credits`, `kl_dashboard_attendance`, `kl_dashboard_fee`).
  - Async requests on mount: `GET /api/erp-proxy/cgpa`, `POST /api/erp-proxy/attendance`, `GET /api/erp-proxy/fee`, `POST /api/erp-proxy/timetable`.
- **Interactive Components**:
  - Welcome Banner with active sync indicator.
  - CGPA & Credits summary cards.
  - Quick stat cards linking to `/dashboard/attendance`, `/dashboard/fee`, `/dashboard/marks`.
  - `TodayScheduleWidget`: Day selector buttons ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"). Clicking day updates schedule list.
  - Link "View Full Timetable" navigating to `/dashboard/timetable`.

### Route 3: Student Timetable (`/dashboard/timetable`)
- **File**: `src/app/dashboard/timetable/page.tsx`
- **API Requests**: `POST /api/erp-proxy/timetable` with `{ academicYear, semesterId, csrfToken }` plus parallel requests to profile/marks for title & faculty enrichment.
- **Interactive Controls**:
  - View mode toggle: `Grid` vs `List`.
  - Year selector: `select` dropdown (e.g. `2024-2025`).
  - Semester selector: `select` dropdown (e.g. `Odd Semester`).
  - Day filter buttons: `All`, `Monday`..`Sunday`.
  - Search box: `input[placeholder="Search course, room, faculty..."]`.
  - Export CSV: `button` calling `exportTableToCSV(...)`.
- **E2E Test Checks**:
  - Toggle between Grid and List view modes.
  - Filter by day pill (e.g. "Monday").
  - Type query into search box and assert filtered table rows.
  - Test CSV export trigger.

### Route 4: Live Attendance (`/dashboard/attendance`)
- **File**: `src/app/dashboard/attendance/page.tsx`
- **API Request**: `POST /api/erp-proxy/attendance` with `{ academicYear, semesterId, csrfToken }`.
- **Interactive Controls & Rendering**:
  - Year & Semester dropdown `<select>` controls.
  - Attendance metrics table with percent badges:
    - `>= 85%`: Green badge + projection text ("Safe to skip X" / "On track").
    - `75% - 84%`: Yellow warning badge.
    - `< 75%`: Red alert badge.

### Route 5: Marks & Grades (`/dashboard/marks`)
- **File**: `src/app/dashboard/marks/page.tsx`
- **API Request**: `POST /api/erp-proxy/marks` with `{ academicYear, semesterId, csrfToken }`.
- **Interactive Controls**:
  - Academic Year & Semester `<select>` controls.
  - Search bar (`input[placeholder="Search marks..."]`).
  - Export CSV button.

### Route 6: Student Profile (`/dashboard/profile`)
- **File**: `src/app/dashboard/profile/page.tsx`
- **API Request**: `GET /api/erp-proxy/profile?t=...`.
- **Interactive Controls & Tab Rendering**:
  - Profile header with photo (`/api/fetch-photo?...`) and student ID.
  - Scalar info cards grid (University ID, Name, Email, Phone, Branch, etc.).
  - Multi-tab pill buttons for array entries (e.g. "Personal Details", "Parent Details", "Address", "Semester History").
  - Clicking pill updates `activeTab` state and renders matching sub-table.

### Route 7: Fee Details (`/dashboard/fee`)
- **File**: `src/app/dashboard/fee/page.tsx`
- **API Request**: `GET /api/erp-proxy/fee`.
- **Rendering Features**:
  - Fee receipts & payment status table.
  - Currency amounts auto-formatted with `₹` symbol via `src/lib/fee-utils.ts`.
  - Status badges: Paid (`CheckCircle`, green) vs Unpaid (`Clock`, red).
  - Summary row formatting (bold font).

---

## 5. E2E Test Strategy & Execution Plan

### Proposed Directory Layout
```text
e2e/
├── fixtures/
│   ├── auth.ts              # Custom test fixture providing authenticated page context
│   └── mock-erp-data.ts     # Mock JSON responses for ERP endpoints
├── login.spec.ts            # E2E tests for login, captcha auto-solving & device registration
├── dashboard.spec.ts        # E2E tests for /dashboard overview & widgets
├── timetable.spec.ts        # E2E tests for /dashboard/timetable (grid/list toggle, search, export)
├── attendance.spec.ts       # E2E tests for /dashboard/attendance (year/sem dropdowns, percentage badges)
├── marks.spec.ts            # E2E tests for /dashboard/marks (search, CSV export)
├── profile.spec.ts          # E2E tests for /dashboard/profile (tabs, photo proxy)
└── fee.spec.ts              # E2E tests for /dashboard/fee (currency formatting, status badges)
```

### Mock Mode vs Live Mode
- **CI / Hermetic Testing (Mock Mode)**: Route network requests in Playwright using `page.route('/api/**', ...)` to intercept API endpoints and respond with static fixtures. Eliminates dependency on external OCR.space API and live university ERP uptime.
- **Live Smoke Testing**: Opt-in test suite executing against real ERP backend when environment variables `E2E_STUDENT_ID` and `E2E_PASSWORD` are provided.

---

## 6. Summary Matrix of All 7 Routes

| Route | Main Component File | Primary API Endpoint | Key Interactive Controls | Key E2E Verification Points |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `/api/captcha`, `/api/login` | Username/Password inputs, Visual Captcha input, Cap Widget, Submit button | Captcha auto-fill, Cap PoW solve, Login submit, Session storage set, Redirection |
| `/dashboard` | `src/app/dashboard/page.tsx` | `/api/erp-proxy/cgpa`, `attendance`, `fee`, `timetable` | Today Schedule day pills, Stat card navigation links | Welcome banner, CGPA display, Quick stats, Today schedule day filter |
| `/dashboard/timetable` | `src/app/dashboard/timetable/page.tsx` | `POST /api/erp-proxy/timetable` | Grid/List view toggle, Year/Sem `<select>`, Day filter pills, Search input, Export CSV | View mode switch, Day filtering, Search filtering, CSV download trigger |
| `/dashboard/attendance` | `src/app/dashboard/attendance/page.tsx` | `POST /api/erp-proxy/attendance` | Year/Sem `<select>` dropdowns | Attendance table rendering, Percentage color-coded badges, Attendance projections |
| `/dashboard/marks` | `src/app/dashboard/marks/page.tsx` | `POST /api/erp-proxy/marks` | Year/Sem `<select>`, Search input, Export CSV | Marks table rendering, Search filtering, CSV export trigger |
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | `GET /api/erp-proxy/profile` | Demographic detail tab pills | Student photo display, Scalar card grid, Demographic tab switching |
| `/dashboard/fee` | `src/app/dashboard/fee/page.tsx` | `GET /api/erp-proxy/fee` | Table scroll, View status | Fee table rendering, `₹` currency formatting, Paid vs Unpaid status badges |
