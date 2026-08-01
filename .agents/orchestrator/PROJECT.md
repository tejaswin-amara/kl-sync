# Project: KL Sync - Timetable Grid & Data Parsing Fix

## Architecture
Next.js 16 Web Application & Edge Proxy built with React 19 and Tailwind CSS v4.
Primary components:
- `src/lib/session.ts`: AES-256-GCM stateless session encryption & token management.
- `src/lib/scraper.ts`: Legacy ERP HTML table parsing, fallback endpoints, scraper resilience, timetable extraction.
- `src/lib/timetable-parser.ts`: Timetable HTML grid & list parsing, day order normalization, section/room parsing, multi-session stacking, matrix format transposition (`matrix_days_rows`, `matrix_days_columns`).
- `src/app/api/`: Route handlers proxying auth, captchas, attendance, marks, timetables, fee receipts, circulars.
- `src/app/dashboard/`: UI/UX Pro Max dark cyber minimalist dashboard interface with WCAG AA compliance.
- `src/app/dashboard/timetable/page.tsx`: Reoriented timetable grid (Y-axis Days, X-axis Periods), sticky left headers, multi-session slot rendering, smooth scrolling.
- `src/lib/scraper.test.ts`: Unit test suite verifying matrix grid generation for `matrix_days_rows` and `matrix_days_columns` formats.
- `ARCHITECTURE.md`: High-level system design (ByteByteGo principles, stateless edge proxy, security model).
- `DESIGN.md`: WCAG AA design system, color tokens, contrast ratios, accessibility guidelines.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Codebase Audit & Gap Analysis | Verify current implementation status against R1-R3 and all acceptance criteria | none | DONE |
| 2 | M2: Refinement, Accessibility & Lint Remediation | Add `aria-label` to icon buttons in Navigation.tsx; resolve ESLint errors | M1 | DONE |
| 3 | M3: Code Review & Build Verification | Independent review of code quality, WCAG AA compliance, zero TS/ESLint errors, and production build | M2 | DONE |
| 4 | M4: Forensic Integrity Audit | Independent integrity verification pass | M3 | DONE |
| 5 | M5: Vercel Secret Configuration & Deployment | Configure `SESSION_SECRET` in Vercel production and re-deploy (`vercel --prod`) | M4 | DONE |
| 6 | M6: Production Endpoint & Integrity Verification | Verify `vercel env ls production` and live `https://klhb.vercel.app/api/captcha` HTTP 200 response | M5 | DONE |
| 7 | M7: Timetable Data & UI Investigation | Investigate parsing logic (`src/lib/scraper.ts`), timetable UI (`src/app/dashboard/timetable/page.tsx`), and data fetching/types | M6 | DONE |
| 8 | M8: Timetable Fix & Unit Test Implementation | Fix parsing and UI rendering, create `src/lib/scraper.test.ts` mocking ERP HTML, run `npm test` & `npm run build` | M7 | DONE |
| 9 | M9: Independent Review & Verification | Code quality, UI styling, unit test coverage, and build verification | M8 | DONE |
| 10 | M10: Forensic Integrity Audit | Verify fix authenticity, test validity, and non-cheating compliance | M9 | DONE |
| 11 | M11: Timetable Grid & Parsing Investigation | Investigate Y-axis Days/X-axis Periods re-orientation, multi-session stacking, and matrix format support | M10 | IN_PROGRESS |
| 12 | M12: Grid Re-orientation, Multi-Session Parsing & Test Suite Implementation | Re-structure grid UI, update timetable parser/scraper for multi-session and matrix formats, expand unit tests, verify build | M11 | PLANNED |
| 13 | M13: Independent Code Quality & UI Review | Review grid layout, sticky headers, multi-session rendering, test coverage, and build outcome | M12 | PLANNED |
| 14 | M14: Forensic Integrity Audit | Independent integrity verification pass for non-cheating compliance | M13 | PLANNED |

## Code Layout
- Next.js App Router: `src/app/`
- API Route Handlers: `src/app/api/`
- Libraries & Helpers: `src/lib/`
- Components: `src/components/`
- Unit Tests: `src/lib/scraper.test.ts`
- Documentation: `ARCHITECTURE.md`, `DESIGN.md`
