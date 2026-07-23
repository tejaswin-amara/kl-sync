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
