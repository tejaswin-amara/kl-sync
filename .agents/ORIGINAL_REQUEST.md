# Original User Request

## 2026-07-23T19:15:55Z

Fix all ERP data synchronization issues in kl-sync (Timetable, CGPA calculation, Fee Due calculation, Attendance, and generic table scraping) following the Ponytail doctrine.

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal
Integrity mode: development

## Requirements

### R1. Robust Scraper Table Parsing & Candidate Endpoint Resilience
Improve parseGenericTable and fetchTimetableData in src/lib/scraper.ts to handle arbitrary table structures, nested HTML elements, missing table headers, and varied ERP response endpoints gracefully without throwing unhandled exceptions or returning empty data structures.

### R2. Accurate & Flexible CGPA Calculation
Update CGPA extraction across src/app/dashboard/page.tsx and src/app/dashboard/tools/page.tsx to first detect official ERP-provided CGPA/SGPA summary values directly. If absent, compute weighted grade point average using case-insensitive, flexible column matching (grade, credit/creds, point/gp).

### R3. Accurate & Flexible Fee Due Calculation
Update Fee Due calculation in src/app/dashboard/page.tsx and src/app/dashboard/fee/page.tsx to dynamically detect status columns (status, pay status, payment status) and due/balance amount columns (balance, due, pending, amount) instead of hardcoding exact string keys.

### R4. Timetable Page & Dashboard Widget Robustness
Ensure src/app/dashboard/timetable/page.tsx and src/app/dashboard/page.tsx ("Today's Schedule") handle matrix timetables, list timetables, day name variants (e.g. Mon vs Monday), and empty/error states without loading freezes.

## Acceptance Criteria

### Verification & Quality
- [ ] npm run build passes with 0 TypeScript and Next.js build errors.
- [ ] CGPA correctly extracts official values or calculates weighted GPA dynamically from any valid ERP table structure.
- [ ] Fee Due correctly sums pending/unpaid fee amounts using flexible column key matching.
- [ ] Timetable loads properly without hanging spinners or blank states across matrix and list layouts.

## Follow-up — 2026-07-24T04:23:05Z

Fix all ERP data synchronization issues in kl-sync (Timetable, CGPA calculation, Fee Due calculation, Attendance, and generic table scraping) following the Ponytail doctrine.

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal
Integrity mode: development

## Requirements

### R1. Robust Scraper Table Parsing & Candidate Endpoint Resilience
Improve parseGenericTable and fetchTimetableData in src/lib/scraper.ts to handle arbitrary table structures, nested HTML elements, missing table headers, and varied ERP response endpoints gracefully without throwing unhandled exceptions or returning empty data structures.

### R2. Accurate & Flexible CGPA Calculation
Update CGPA extraction across src/app/dashboard/page.tsx and src/app/dashboard/tools/page.tsx and src/lib/cgpa.ts to first detect official ERP-provided CGPA/SGPA summary values directly from searchgetmycgpa. If absent, compute weighted grade point average using case-insensitive, flexible column matching (grade, credit/creds, point/gp).

### R3. Accurate & Flexible Fee Due Calculation
Update Fee Due calculation in src/app/dashboard/page.tsx and src/app/dashboard/fee/page.tsx and src/lib/fee-utils.ts to dynamically detect status columns (status, pay status, payment status) and due/balance amount columns (balance, due, pending, amount) instead of hardcoding exact string keys, ensuring paid rows are not counted as pending.

### R4. Timetable Page & Dashboard Widget Robustness
Ensure src/app/dashboard/timetable/page.tsx and src/app/dashboard/page.tsx ("Today's Schedule") handle matrix timetables, list timetables, day name variants (e.g. Mon vs Monday), fallback data preservation, and section-to-course-title resolution without loading freezes.

## Acceptance Criteria

### Verification & Quality
- [ ] npm run build passes with 0 TypeScript and Next.js build errors.
- [ ] CGPA correctly extracts official values from searchgetmycgpa or calculates weighted GPA dynamically.
- [ ] Fee Due correctly sums pending/unpaid fee amounts without including paid fee orders.
- [ ] Timetable loads properly without hanging spinners or blank states across matrix and list layouts.

## Follow-up — 2026-07-30T14:56:48Z

Build and refine KL Sync, a modern, high-performance, dark-themed ERP web client and edge proxy for university students built with Next.js 16, React 19, and Tailwind CSS v4 following the ByteByteGo system design, UI/UX Pro Max accessibility, Open-Design prototyping, and Ponytail anti-bloat philosophies.

Working directory: C:/Users/speed/Documents/antigravity/optimistic-pascal
Integrity mode: development

## Requirements

### R1. High-Performance Stateless ERP Proxy
The application must proxy authentication, captchas, and student records (attendance, marks, timetables, fee receipts, circulars) from legacy university servers via Next.js Route Handlers. All user sessions must be securely encrypted server-side using AES-256-GCM without persisting user credentials in a database.

### R2. Dark Cyber Minimalist UI & Accessibility
The web dashboard must adhere to the UI/UX Pro Max Design System (DESIGN.md), featuring high-density cards, responsive navigation, smooth state transitions, and strict WCAG AA contrast compliance (minimum 4.5:1 ratio) with explicit focus rings and screen-reader accessibility labels.

### R3. Ponytail Anti-Bloat Code Quality & Build Passing
The codebase must avoid unnecessary third-party dependencies, leveraging native Node.js standard libraries (crypto, path) and standard Next.js APIs. The full production build (npm run build) must compile cleanly without TypeScript or linting errors.

## Acceptance Criteria

### Verification & Quality Gates
- [x] All 18 Next.js application routes compile successfully via npm run build.
- [x] Session tokens are encrypted using AES-256-GCM in src/lib/session.ts.
- [x] High-level system architecture documented in ARCHITECTURE.md.
- [x] WCAG AA design system and tokens documented in DESIGN.md.

## Follow-up — 2026-08-01T06:10:00Z

The production deployment of KL Sync is failing to load the CAPTCHA because it is throwing a 500 Internal Error. This is caused by the security hardening in `src/lib/session.ts` which throws an error if `SESSION_SECRET` is not set in the production environment. We need to securely resolve this issue by generating and configuring a `SESSION_SECRET` in Vercel, and verify that the CAPTCHA loads properly on the live site.

Working directory: C:/Users/speed/Documents/antigravity/optimistic-pascal
Integrity mode: demo

## Requirements

### R1. Configure Vercel Environment
Generate a secure, random 32-byte (or longer) secret and inject it into the Vercel production environment as `SESSION_SECRET` using the Vercel CLI. Do not hardcode the secret into the codebase.

### R2. Re-deploy the Application
Trigger a new Vercel production build and deployment (`vercel --prod`) so that the newly added environment variable is picked up by the Edge network.

## Acceptance Criteria

### Configuration Verification
- [ ] Running `vercel env ls production` shows `SESSION_SECRET` as a configured environment variable.

### Production Endpoint Verification
- [ ] The live Vercel endpoint (e.g. `https://klhb.vercel.app/api/captcha`) returns a 200 HTTP status code and successfully provides the base64-encoded `captchaImage` in the JSON response, confirming that the 500 Internal Error is resolved.



