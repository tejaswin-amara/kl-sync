# Project: KL Sync Next.js Application Optimization

## Architecture
KL Sync is a stateless Next.js 16, React 19, Tailwind CSS v4 ERP proxy client for student ERP portals.
- **Frontend / Routes**: `src/app/` (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`)
- **API Proxy Routes**: `src/app/api/` (`/api/captcha`, `/api/login`, `/api/student/*`, `/api/solve-captcha`)
- **Core Libraries**: `src/lib/` (`scraper.ts`, `session.ts`, `captcha.ts`, `cgpa.ts`, `fee-utils.ts`, `timetable-parser.ts`, `ocr.ts`)
- **Testing**: Vitest/Node unit tests (`npm test`), Playwright E2E browser tests (`npx playwright test` / test scripts)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Codebase Investigation & Audit | Scan `src/` for bloat, unused imports, dead code, check current `npm test` & `npx tsc --noEmit` status | none | DONE |
| M2 | Ponytail Optimization & Unit Tests | Clean up `src/` bloat, remove dead code/unused imports, optimize state calls, verify `npx tsc --noEmit` 0 errors and `npm test` 19/19 passing | M1 | DONE |
| M3 | E2E Browser Testing & CAPTCHA Verification | Playwright testing across all 7 dashboard routes (`/`, `/dashboard`, `/dashboard/timetable`, `/dashboard/attendance`, `/dashboard/marks`, `/dashboard/profile`, `/dashboard/fee`), auto-solving Cap CAPTCHA and visual ERP OCR CAPTCHA verification | M2 | IN_PROGRESS |
| M4 | Comprehensive Review & Forensic Audit | Code quality review, challenger validation, and forensic integrity audit verification | M3 | PLANNED |

## Interface Contracts & Constraints
- `npx tsc --noEmit`: 0 type errors required.
- `npm test`: 19/19 tests passing required across all test suites.
- Cap CAPTCHA and visual ERP OCR CAPTCHA auto-solve seamlessly on load.
- All 7 dashboard routes load, parse, and render live ERP data without errors or layout truncation.
- Zero build warnings, zero unhandled promise rejections, zero unused code artifacts.
