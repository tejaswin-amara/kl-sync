# Project: KL Sync - Stateless ERP Proxy & Web Client

## Architecture
Next.js 16 Web Application & Edge Proxy built with React 19 and Tailwind CSS v4.
Primary components:
- `src/lib/session.ts`: AES-256-GCM stateless session encryption & token management.
- `src/lib/scraper.ts`: Legacy ERP HTML table parsing, fallback endpoints, scraper resilience.
- `src/app/api/`: Route handlers proxying auth, captchas, attendance, marks, timetables, fee receipts, circulars.
- `src/app/dashboard/`: UI/UX Pro Max dark cyber minimalist dashboard interface with WCAG AA compliance.
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

## Code Layout
- Next.js App Router: `src/app/`
- API Route Handlers: `src/app/api/`
- Libraries & Helpers: `src/lib/`
- Components: `src/components/`
- Documentation: `ARCHITECTURE.md`, `DESIGN.md`
