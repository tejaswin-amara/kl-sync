# Specification Mining & Technical Handoff Report — KL Sync Frontend Redesign

## 1. Executive Summary & Architectural Overview

KL Sync is a dark-themed, ultra-fast, stateless Next.js 16 web client for KL University's legacy ERP system (`newerp.kluniversity.in`). It acts as an edge proxy layer that intercepts legacy ASP.NET Web Forms / PHP responses, converts HTML table markup into structured JSON via Cheerio, encrypts session cookies server-side using **AES-256-GCM**, and provides a responsive UI built with TailwindCSS v4 and Lucide React icons.

---

## 2. 5-Component Handoff Report

### 1. Observation
- **Codebase Entrypoint & Layout**: Binary entrypoint / Next.js app in `src/app`. `src/app/page.tsx` is the Login / Landing page. `src/app/dashboard` contains sub-routes: `attendance`, `timetable`, `marks`, `fee`, `profile`, `circulars`, `hostels`, `library`, `tools`, `exam-seating`.
- **API & Proxy Routes**:
  - `/api/captcha` (`src/app/api/captcha/route.ts`): Fetches ERP image captcha & session token. Solves automatically via OCR.space API (Engine 2, fallback Engine 1).
  - `/api/captcha/challenge` & `/api/captcha/redeem` (`src/app/api/captcha/challenge/route.ts`, `src/app/api/captcha/redeem/route.ts`): Gated by `capjs-core` proof-of-work challenge (scope: `login`, 10 min expiry).
  - `/api/login` (`src/app/api/login/route.ts`): Authenticates credentials + captcha + deviceId against ERP. Handles first-time device registration (`needsCaptchaRetry: true`).
  - `/api/erp-proxy/[module]` (`src/app/api/erp-proxy/[module]/route.ts`): Generic proxy delegating to sub-scrapers in `src/lib/scrapers/`.
  - `/api/fetch-photo` (`src/app/api/fetch-photo/route.ts`): Binary photo proxy for student profile pictures using `sharp`.
- **Scraper Infrastructure** (`src/lib/scrapers/`):
  - `http-jar.ts`: Manages cookie jars, `fetchWithJar` with 25s timeout (`AbortSignal.timeout(25000)`), and `parseGenericTable`.
  - `attendance.ts`: Handles ERP authentication, semester/year options, attendance table parsing, and device ID harvesting.
  - `timetable.ts`: Multi-strategy timetable fetching (POST, GET query, GET plain) with `isLikelyTimetableData` heuristic validation.
  - `marks.ts`: Scrapes internal marks, end-exam results, and CGPA data.
  - `fee.ts`: Scrapes fee order history and generic HTML module endpoints.
  - `profile.ts`: Multi-tab profile scraper retrieving demographics, tab links, script regex AJAX URLs, and photo URLs.
- **Utility Modules**:
  - `cgpa.ts`: `processERPDataForCGPA` extracts official CGPA/SGPA/credits or computes weighted GPA using grade point mapping (S/O=10, A+=9, A=8, B+=7, B=6, C=5, D=4, F/FAIL/AB/DT=0, P/PASS=null).
  - `fee-utils.ts`: `parseCurrency` handles currency symbols, text (INR, Rs), commas, and accounting parens `(1,500.00)` to `-1500`. `isRowUnpaid` and `calculatePendingFee` classify paid vs. pending fee items.
  - `timetable-parser.ts`: `parseTimetable` normalizes days (Mon-Sun & Day Order 1-7), splits cell sessions (`\n`, `<br/>`, `||`, `---`), parses course code, component (Lecture, Practical, Skill, Tutorial), section (S-10), room (MapPin), and faculty.
- **Test Suite Results**:
  - `npm run test` executes `npx tsx --test src/**/*.test.ts` — 30 unit tests pass in ~770ms.
  - `npm run lint` executes `eslint` — 0 warnings/errors.
  - `npx tsc --noEmit` — 0 TypeScript compilation errors.

### 2. Logic Chain
1. **R1 (Responsive & Adaptive UI/UX Redesign)**: The landing page (`src/app/page.tsx`) uses a 45/55 asymmetric split (`hidden lg:flex w-[45%]`) for branding and login form. Dashboard routes share `src/components/Navigation.tsx`, featuring a desktop sidebar and a mobile drawer (`translate-x-0` / `-translate-x-full`) triggered by a hamburger button.
2. **R2 (High-Performance Captcha & Form Integration)**:
   - Cap CAPTCHA uses `<cap-widget>` (`src/components/Captcha.tsx`) linked to `/api/captcha/`. Auto-solves via PoW in web worker, triggering `onVerify(token)`. Validated by `/api/captcha/redeem` and `verifyCaptchaToken` in `src/lib/captcha.ts`. Single-use token is burned upon verification.
   - ERP Image Captcha is retrieved from `/api/captcha`. Automatically pre-solved using OCR.space API (Engine 2 -> Engine 1 fallback) and placed into `captcha` state. Users can manually refresh via `RefreshCw` button.
   - First-time device registration: ERP requires device ID cookie (`kl_erp_device_id` / `kl_device`). If missing on first login, ERP returns `needsCaptchaRetry: true`. App stores harvested `deviceId`, displays status alert, and automatically re-fetches captcha for a single seamless retry.
   - Error Alert Banners: Styled with `bg-red-500/10 border border-red-500/20 text-red-400 text-sm` and `AlertCircle` icon. Status banners use `bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm`.
   - Form State Validation: Required fields `username`, `password`, `captcha`, `captchaToken`. Submit button is disabled when `loading || !captchaToken`.
3. **R3 (Visual Excellence & Accessibility)**: Standardized dark theme (`bg-zinc-950`, `bg-zinc-900`, `border-white/10`, `text-zinc-100`). High contrast ratios (>4.5:1), explicit WCAG 2.2 focus rings (`focus:ring-4 focus:ring-indigo-400`), 24px+ touch targets for inputs and checkboxes.

### 3. Caveats
- Upstream ERP server downtime during exam result declarations is mitigated via client-side cached state in `localStorage` / `sessionStorage` and fallback demo data in `/api/erp-proxy/[module]`.
- No database persistence is used by design to ensure zero-knowledge privacy and compliance.

### 4. Conclusion
All 11 dashboard modules, login modal/form, landing page, and R2 captcha/form validation specifications have been thoroughly mined, categorized, and documented with exact data schemas, prop interfaces, and business logic rules.

### 5. Verification Method
1. `npm run test` — Runs all 30 unit tests across captcha, CGPA, fee-utils, and timetable-parser modules.
2. `npm run lint` — Runs ESLint across all TypeScript files.
3. `npx tsc --noEmit` — Verifies TypeScript type correctness.
4. `npm run build` — Validates Next.js production build output.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth / Landing | Landing Page & Sign-In Form | Asymmetric desktop split branding + sign-in form with remember credentials option | `username`, `password`, `captcha`, `rememberMe`, `deviceId` | Auth session token in `kl_erp_session` cookie + `sessionStorage` | Displays red error banner (`AlertCircle`); re-fetches captcha | `src/app/page.tsx` |
| 2 | Auth / R2 | Cap CAPTCHA Integration | Client-side PoW bot protection widget using `cap-widget` | PoW Challenge from `/api/captcha/challenge` | Verifiable token (`id:verToken`) | Fallback token `demo_token` on local dev / error | `src/components/Captcha.tsx` |
| 3 | Auth / R2 | ERP Image Captcha & Auto-OCR | ERP visual security code fetch with automated OCR.space solving | ERP Login HTML & Captcha img | Base64 Image + auto-solved text in input | Defaults to `'8888'` fallback image if ERP unreachable | `src/app/api/captcha/route.ts` |
| 4 | Auth / R2 | ERP First-Time Device Registration | Handles device ID cookie registration for single-signon safety | `deviceId` string | `needsCaptchaRetry: true` + harvested `deviceId` | Shows blue status banner; auto-refreshes captcha once | `src/lib/scrapers/attendance.ts` |
| 5 | Navigation | Responsive Layout & Drawer | Desktop fixed sidebar + mobile backdrop drawer with active route highlights | Route path (`usePathname()`) | Rendered Navigation Shell | Hides gracefully on mobile, toggleable via hamburger menu | `src/components/Navigation.tsx` |
| 6 | Navigation | Academic Session Hook | Custom hook managing academic year & semester selections across modules | `localStorage` / `sessionStorage` session keys | `years`, `semesters`, `selectedYear`, `selectedSem`, change handlers | `sessionError` string if sessions missing | `src/hooks/useAcademicSession.ts` |
| 7 | Dashboard | Overview Hero & Quick Stats | Live summary of CGPA, attendance %, pending fee total, and completed credits | Local storage cache + background ERP proxy calls | Metric cards with gradient styling | Graceful fallback to cached or zero metrics | `src/app/dashboard/page.tsx` |
| 8 | Dashboard | Today's Schedule Widget | Real-time daily timetable widget pre-enriched with course titles & faculty | `activeYearId`, `activeSemId` | Day selector pills + period cards | Shows empty state or retry button on network error | `src/app/dashboard/page.tsx` |
| 9 | Attendance | Attendance Data Grid | Real-time course attendance table with threshold-based color coding | `academicYear`, `semesterId`, `csrfToken` | Attendance % badge (Emerald >=85%, Amber 75-84%, Crimson <75%) | Empty state or error alert banner | `src/app/dashboard/attendance/page.tsx` |
| 10 | Attendance | Class Projection Indicator | Calculates exact classes needed or safe to skip to hit 85%/75% policy | `conductedHours`, `attendedHours` | "Need X classes" / "Safe to skip Y" helper text | Returns null if total conducted hours is 0 | `src/app/dashboard/attendance/page.tsx` |
| 11 | Timetable | Universal Timetable Parser | Auto-detects matrix (days-as-columns/rows) or list timetable HTML formats | Raw ERP HTML / table array | `ParsedTimetable` object with normalized `sessions` & `matrixGrid` | Fallback layout detection on unknown HTML | `src/lib/timetable-parser.ts` |
| 12 | Timetable | Timetable View Modes | Toggleable Matrix Grid View (sticky day column) & List View with CSV export | `viewMode` ('grid' \| 'list'), `selectedDayFilter`, `searchQuery` | Rendered timetable table grid / list | "No matching sessions" empty state | `src/app/dashboard/timetable/page.tsx` |
| 13 | Marks | Marks & Grades Viewer | Displays internal assessment marks and semester grade cards with search & CSV | `academicYear`, `semesterId`, `csrfToken` | Dynamic table with filtered search results | Error message on network or session expiry | `src/app/dashboard/marks/page.tsx` |
| 14 | Marks | CGPA & Weighted GPA Processor | Extracts official summary CGPA or computes weighted GPA from grade letters | Raw marks rows / profile data | `CGPAResult` ({ cgpa, credits, isOfficial, sgpa }) | Returns 0 CGPA/credits on invalid inputs | `src/lib/cgpa.ts` |
| 15 | Fee | Fee Orders & Payment Status | Parses fee orders, normalizes currency, and classifies paid vs. pending balance | Raw fee rows | Table with formatted `₹` currency & status badges (Paid / Pending) | Error alert on expired session | `src/app/dashboard/fee/page.tsx` |
| 16 | Fee | Accounting Currency Parser | Handles currency symbols (₹,$), text (INR, Rs), commas, and accounting parens | String / Number input | Signed float value (e.g. `(1,500)` -> `-1500`) | Returns 0 for invalid / non-numeric text | `src/lib/fee-utils.ts` |
| 17 | Profile | Demographics & Multi-Tab Parser | Parses student photo, university ID, and extracts sub-tab data tables | Scraped profile HTML | Profile header + scalar info cards + dynamic tab tables | Redirects to login if session expired | `src/app/dashboard/profile/page.tsx` |
| 18 | Profile | Profile Photo Edge Proxy | Serves student profile images via `sharp` with edge cache control | `photoUrl` or `id` query params | Binary Image Stream (`Cache-Control: max-age=86400`) | Returns placeholder / 404 on missing photo | `src/app/api/fetch-photo/route.ts` |
| 19 | Circulars | Official Circulars List | Fetches registrar office announcements and visibility lists | Session token | Tabular circular list | Displays empty icon if no circulars | `src/app/dashboard/circulars/page.tsx` |
| 20 | Hostels | Hostel Room Occupancy | Displays room allocation, block details, and occupancy status | Session token | Tabular hostel occupancy info | Displays empty icon if unassigned | `src/app/dashboard/hostels/page.tsx` |
| 21 | Library | Library Circulation History | Displays book borrowing history, due dates, and return status | Session token | Tabular library records | Displays empty icon if no history | `src/app/dashboard/library/page.tsx` |
| 22 | Tools | Attendance Target Calculator | Pre-populated calculator evaluating classes to attend/miss for 75%/85% | `totalClasses`, `presents` | Interactive analysis cards & eligibility alert badges | Bounds division by zero | `src/components/attendance-calculator.tsx` |
| 23 | Tools | CGPA Goal Predictor | Calculates required GPA in upcoming credits to achieve target CGPA goal | `targetCgpa`, `newCredits`, `currentCgpa`, `completedCredits` | Required GPA value (e.g. `9.25`) | Displays "Unreachable Goal" if required GPA > 10 | `src/app/dashboard/tools/page.tsx` |
| 24 | Exam Seating | Exam Room & Seat Locator | Displays exam room allotments and seat numbers with highlight badges | Session token | Seating plan table with seat badges | Displays empty state if no exam active | `src/app/dashboard/exam-seating/page.tsx` |

---

## 4. Edge Cases Mined

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Auth / Device ID | First sign-in on new browser device | ERP returns token crash page; backend harvests `kl_erp_device_id`, returns `needsCaptchaRetry: true`; frontend shows blue status alert and auto-refreshes captcha once. |
| 2 | Cap CAPTCHA | Local dev environment / missing Redis | `verifyCaptchaToken` falls back to stateless challenge verification (accepts valid `id:verToken` format and burns token in memory). |
| 3 | Timetable Parsing | Multi-session cells with `<br/>`, `\n`, or `||` | `splitCellSessions` splits cell into discrete sessions; `parseCellContentMultiple` parses course code, component, section, room, and faculty for each. |
| 4 | Timetable Normalization | Day Order strings (`Day Order 1`, `DO 2`, `D3`) | `normalizeDay` maps Day Orders 1-7 to Monday through Sunday. Pure numeric strings (e.g. `'1'`, `'2'`) are rejected to prevent period numbers from being misidentified as days. |
| 5 | Fee Calculations | Accounting parenthesis formatted values e.g. `(₹1,500.00)` | `parseCurrency` strips currency symbols/text and converts accounting parens to negative float `-1500`. |
| 6 | Fee Classification | Historical paid fee receipts without balance column | `isRowUnpaid` detects `statusKey` or paid vs. total amount match and correctly classifies item as Paid (preventing paid receipts from inflating pending fees). |
| 7 | CGPA Calculation | Letter grades `'O'`, `'S'`, `'A+'`, `'B'`, `'F'`, `'AB'`, `'P'` | `mapGradeToPoints` maps S/O->10, A+->9, A->8, B+->7, B->6, C->5, D->4, F/FAIL/AB/DT->0, and excludes P/PASS/NC (non-credit) from GPA calculation. |
| 8 | Timetable Auto-Fallback | Selected academic year returns 0 timetable rows | `TimetablePage` automatically scans sibling academic years, picks the first valid year with rows, and updates session selection seamlessly. |
| 9 | Profile Scraper | Dynamic sub-tabs loaded via AJAX scripts | `fetchProfileData` extracts tab URLs via DOM anchors and script regex `/'url'\s*:\s*'(\/index\.php\?r=[^']+)'/gi`, fetching all tab HTMLs in parallel. |
| 10 | CGPA Goal Predictor | Target CGPA requirement exceeds 10.00 | `calculateRequiredGpa` computes required GPA and displays an "Unreachable Goal" warning banner if required GPA > 10.00. |

---

## 5. Detailed Data Schemas, Props, States, and Business Logic by Module

### 1. Landing Page & Sign-In Form (`src/app/page.tsx`)
- **State Schema**:
  - `username`: string
  - `password`: string
  - `captcha`: string (ERP image captcha text)
  - `captchaToken`: string | null (Cap CAPTCHA PoW token)
  - `captchaImage`: string | null (Base64 data URL)
  - `rememberMe`: boolean
  - `deviceId`: string
  - `loading`: boolean
  - `captchaLoading`: boolean
  - `error`: string | null
  - `status`: string | null
  - `sessionId`: string (AES-256-GCM session token)
- **Business Logic**:
  - Validates `!username || !password || !captcha`.
  - Submit button disabled when `loading || !captchaToken`.
  - Persists credentials to `localStorage` when `rememberMe` is checked.
  - Stores `kl_erp_session_id`, `kl_erp_csrf_token`, `kl_erp_academic_years`, `kl_erp_semesters` upon successful login and redirects to `/dashboard`.

### 2. Login Modal / Form & Captcha Integration (`src/components/Captcha.tsx`, `src/app/api/captcha/route.ts`)
- **Cap CAPTCHA Props**: `{ onVerify: (token: string) => void }`
- **Cap CAPTCHA Architecture**: Uses `<cap-widget>` custom element linking to `/api/captcha/`. Solves PoW challenge via web worker. Single-use token key stored in Redis / memory fallback, burned on first check (`verifyCaptchaToken`).
- **ERP Captcha OCR**: `/api/captcha` fetches image from ERP, calls OCR.space REST API (Engine 2, fallback Engine 1) with key `process.env.OCR_SPACE_API_KEY || 'helloworld'`.

### 3. Attendance Module (`src/app/dashboard/attendance/page.tsx`)
- **State Schema**:
  - `data`: Array of raw attendance row objects.
  - `loading`: boolean, `error`: string | null
  - `selectedYear`: string, `selectedSem`: string
- **Business Logic & Thresholds**:
  - Attendance % >= 85%: Emerald badge (`bg-green-500/10 text-green-400`).
  - Attendance % 75% - 84%: Amber badge (`bg-yellow-500/10 text-yellow-400`).
  - Attendance % < 75%: Crimson badge (`bg-red-500/10 text-red-400`).
  - **Class Projection Formula**:
    - If < 85%: `needed = Math.ceil((0.85 * total - attended) / 0.15)`
    - If >= 85%: `skip = Math.floor((attended - 0.85 * total) / 0.85)`

### 4. Timetable Module (`src/app/dashboard/timetable/page.tsx`, `src/lib/timetable-parser.ts`)
- **Normalized Session Schema (`NormalizedClassSession`)**:
  - `id`: string
  - `day`: string ('Monday', 'Tuesday', ...)
  - `dayShort`: string ('Mon', 'Tue', ...)
  - `dayIndex`: number (1=Mon, ..., 7=Sun)
  - `timeSlot`: string ('Period 1', '09:00 AM - 10:00 AM')
  - `courseCode`: string (e.g. '23CS2101R')
  - `courseTitle`: string
  - `component`?: 'Lecture' | 'Practical' | 'Skill' | 'Tutorial'
  - `section`?: string ('S-10')
  - `room`: string ('RoomNo-101')
  - `faculty`: string
  - `rawText`: string
- **Business Logic**:
  - Parses matrix_days_columns, matrix_days_rows, or list layout.
  - Enrich course title and faculty from profile and marks scraper endpoints.
  - Grid view provides sticky day column, day filter tabs, search bar, and CSV export via `exportTableToCSV`.

### 5. Marks Module (`src/app/dashboard/marks/page.tsx`, `src/lib/cgpa.ts`)
- **Data Schema**: Array of objects containing `'Course Code'`, `'Course Name'`, `'Faculty Name'`, `'Internal 1'`, `'Internal 2'`, `'Assignment'`, `'Total Marks'`.
- **Grade Point Mapping (`mapGradeToPoints`)**:
  - `'S'`, `'O'`, `'10'` -> 10
  - `'A+'`, `'9'` -> 9
  - `'A'`, `'8'` -> 8
  - `'B+'`, `'7'` -> 7
  - `'B'`, `'6'` -> 6
  - `'C'`, `'5'` -> 5
  - `'D'`, `'4'` -> 4
  - `'F'`, `'FAIL'`, `'AB'`, `'ABSENT'`, `'DT'`, `'0'` -> 0
  - `'P'`, `'PASS'`, `'NC'` -> null (excluded)

### 6. Fee Module (`src/app/dashboard/fee/page.tsx`, `src/lib/fee-utils.ts`)
- **Data Schema**: Array of objects with `'Fee Type'`, `'Amount'`, `'Paid Amount'`, `'Balance Amount'`, `'Status'`.
- **Business Logic (`parseCurrency`, `isRowUnpaid`)**:
  - Handles symbols, text, and accounting parens `(1,500.00)` -> `-1500`.
  - Distinguishes summary total rows (`isSummaryRow`) from detail rows.
  - Displays green `CheckCircle` badge for Paid and red `Clock` badge for Pending items.

### 7. Profile Module (`src/app/dashboard/profile/page.tsx`, `src/lib/scrapers/profile.ts`)
- **Data Schema**: `{ name, universityId, photoUrl, extendedProfile }`
- **Business Logic**:
  - Photo URL resolved via `/api/fetch-photo` proxy handler.
  - Displays scalar info cards (Department, Program, Admission Date, Regulation) and multi-tab dynamic tables.

### 8. Circulars Module (`src/app/dashboard/circulars/page.tsx`)
- **Data Schema**: Array of registrar circular row objects.
- **Business Logic**: Renders responsive table with glassmorphic cards and empty icon if no circulars present.

### 9. Hostels Module (`src/app/dashboard/hostels/page.tsx`)
- **Data Schema**: Array of hostel room occupancy objects.
- **Business Logic**: Renders room, block, bed allocation details or empty bed icon if unassigned.

### 10. Library Module (`src/app/dashboard/library/page.tsx`)
- **Data Schema**: Array of library circulation records.
- **Business Logic**: Renders book title, accession number, issue date, due date, and return status.

### 11. Tools Module (`src/app/dashboard/tools/page.tsx`, `src/components/attendance-calculator.tsx`)
- **Calculators**:
  1. **Attendance Target Calculator**: Pre-populated with live ERP total conducted & attended hours. Calculates classes to miss/attend for 75% & 85% eligibility thresholds.
  2. **CGPA Goal Predictor**: Pre-populated with live CGPA and earned credits.
     - **Formula**: `requiredGpa = (targetCgpa * (completedCredits + newCredits) - (currentCgpa * completedCredits)) / newCredits`
     - Displays "Unreachable Goal" if `requiredGpa > 10.00`.

### 12. Exam Seating Module (`src/app/dashboard/exam-seating/page.tsx`)
- **Data Schema**: Array of exam room seating allotment objects.
- **Business Logic**: Formats seat numbers with dedicated `Armchair` icon badges.

---

## 6. Project Verification & Quality Gates

All automated pre-delivery quality checks pass cleanly:
```bash
# 1. ESLint Code Quality Check
npm run lint          # PASS: 0 warnings/errors

# 2. TypeScript Compilation Check
npx tsc --noEmit      # PASS: 0 compilation errors

# 3. Unit Test Suite Execution
npm run test          # PASS: 30 / 30 tests pass cleanly (~770ms)
```
