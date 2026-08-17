# Project: KL-Sync Ponytail System Execution & Browser Verification

## Architecture
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5.8
- **Architecture**: Stateless Edge Proxy with AES-256-GCM encrypted session cookies (`kl_erp_session`).
- **Styling**: Tailwind CSS v4 + Vanilla CSS design tokens (`globals.css`).
- **Testing**: Node.js Native Test Runner (`node:test`) + Playwright E2E.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Ponytail Debt Cleanup (R1) | Verify 0 `ponytail:` comments remain, parameter bindings are genuine and robust in `marks.ts`/`timetable.ts`. | M1 | Survey / Explorer 1 |
| 2 | Unused Dependencies Removal (R2.1) | Clean up unreferenced `eslint-config-prettier`, `eslint-plugin-prettier`, and `prettier` in `package.json`. | M2 | Survey / Explorer 2 |
| 3 | Dead UI Primitives & Over-engineering Removal (R2.2) | Simplify or remove dead `command.tsx`, `tooltip.tsx`, over-abstracted `card.tsx` subcomponents, redundant `badge.tsx` variants, and dead barrel `src/hooks/index.ts`. | M2 | Survey / Explorer 2 |
| 4 | ESLint Cleanliness (R2.3) | Clean up test file unused imports to achieve 0 lint errors and 0 lint warnings. | M2 | Survey / Explorer 2 |
| 5 | Browser & Route Verification (R3) | Verify http://localhost:3000/dashboard authentication, routing across all 12 routes, and 0 console errors in browser. | M3 | Survey / Explorer 3 |
| 6 | Comprehensive Quality Gates | Pass `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npx playwright test`. | M3 | Survey / All |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Ponytail Debt Verification & Hardening | Formal verification of 0 `ponytail:` debt comments, dual-parameter binding in scrapers, AST scans | Survey | DONE |
| 2 | M2: Ponytail Audit & Over-engineering Cleanup | Remove unused dependencies, dead UI primitives, simplify card/badge/barrel files, eliminate lint warnings | M1 | IN_PROGRESS |
| 3 | M3: Browser Verification & End-to-End Acceptance | Run dev server, verify `/dashboard` routes, login, session guard, rendering, 0 console errors, full test suite | M2 | PLANNED |

## Interface Contracts
### Scrapers ↔ ERP Proxy API
- `fetchMarksData(session, semesterId)` sends `DynamicModel[semester]` and `DynamicModel[semesterid]`.
- `fetchEndExamResults(session, semesterId)` sends both semester parameters.
- `fetchCGPAData(session)` fetches CGPA records.

### UI Components ↔ Application Pages
- `Card`: native wrapper with standard semantic HTML (`<h3>`, `<p>`, `<div>`).
- `Badge`: semantic variants (`default`, `secondary`, `destructive`, `outline`, `success`, `warning`).
- `Navigation`: native `title` attribute for tooltips on collapsed sidebar.

## Code Layout
- `src/app/`: Next.js App Router pages and API routes (`api/login`, `api/erp-proxy/[module]`).
- `src/components/ui/`: UI primitives (`card.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, etc.).
- `src/hooks/`: React hooks for data fetching and session management.
- `src/lib/`: Core scrapers, session crypto (`session.ts`), fixtures (`fixtures/index.ts`).
- `e2e/`: Playwright browser test specifications.
- `tests/` and `src/**/*.test.ts`: Node native unit and integration tests.
