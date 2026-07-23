# Project: kl-sync ERP Data Sync Fixes

## Architecture
Next.js Web Application for ERP data synchronization and dashboard visualization.
Primary files involved:
- `src/lib/scraper.ts`: Table parsing logic (`parseGenericTable`), timetable data fetching (`fetchTimetableData`), candidate ERP endpoints.
- `src/app/dashboard/page.tsx`: Main dashboard overview featuring CGPA summary, Fee Due balance, and Today's Schedule widget.
- `src/app/dashboard/tools/page.tsx`: Academic tools page with detailed CGPA calculation.
- `src/app/dashboard/fee/page.tsx`: Fee details page with dynamic fee due calculation.
- `src/app/dashboard/timetable/page.tsx`: Full timetable page supporting matrix and list layouts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Scraper Table Parsing & Endpoint Resilience | R1: `src/lib/scraper.ts` robust table parsing, nested elements, candidate endpoints fallback | none | PLANNED |
| 2 | M2: Accurate & Flexible CGPA Calculation | R2: `src/app/dashboard/page.tsx` & `src/app/dashboard/tools/page.tsx` dynamic CGPA extraction & fallback weighted GPA | M1 | PLANNED |
| 3 | M3: Accurate & Flexible Fee Due Calculation | R3: `src/app/dashboard/page.tsx` & `src/app/dashboard/fee/page.tsx` flexible status & balance column parsing | M1 | PLANNED |
| 4 | M4: Timetable Robustness & Dashboard Widget | R4: `src/app/dashboard/timetable/page.tsx` & `src/app/dashboard/page.tsx` matrix/list layouts, day variants, empty/error handling | M1 | PLANNED |
| 5 | M5: E2E Build & Quality Verification | Full build (`npm run build`), zero TS/Next errors, verification across all features | M1, M2, M3, M4 | PLANNED |

## Code Layout
- App Router: `src/app/`
- Libraries & Helpers: `src/lib/`
- Types: `src/types/`
