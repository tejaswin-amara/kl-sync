# Project: KL Sync Repository Audit & Quality Hardening

## Architecture & Principles

- **Framework**: Next.js 16 (App Router, Turbopack, React 19.2.8)
- **Language**: TypeScript 5.8
- **Architecture**: Stateless Edge Proxy with Web Crypto AES-256-GCM session encryption
- **Design Philosophy**: Ponytail (Zero-Bloat, Standard Library first, Minimalist Diffs)
  - Zero external icon libraries (pure 57+ primitive SVG engine in `src/components/ui/icons.tsx`)
  - Zero third-party state/query/styling packages (`clsx`, `tailwind-merge`, `swr`, `framer-motion`, `lucide-react` eliminated)
  - Native Web Crypto API (`AES-256-GCM`, 12-byte IV) with fail-closed production mode
  - Origin-constrained edge proxy boundaries against `https://newerp.kluniversity.in`

## Feature Inventory

| #   | Feature                                  | Description                                                                                      | Milestone | Source |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | TypeScript Zero Errors                   | `npx tsc --noEmit` exits 0 with 0 errors                                                         | M1        | Survey |
| 2   | ESLint Zero Warnings                     | `npm run lint` exits 0 with 0 errors/warnings                                                    | M1        | Survey |
| 3   | Unit & Integration Test Suite            | `npm test` runs 328 tests across 54 suites with 100% pass rate                                   | M1        | Survey |
| 4   | API & Boundary Tests                     | `npm run test:api` runs 38 tests across 4 tiers with 100% pass rate                              | M1        | Survey |
| 5   | Agent-as-Judge AI Suite                  | `scripts/agent-as-judge.ts` verifies AI tools (9/9 pass)                                         | M1        | Survey |
| 6   | Turbopack Production Build               | `npm run build` compiles clean without hydration/chunk errors                                    | M1        | Survey |
| 7   | Zero-Bloat Dependencies                  | Zero banned packages in `package.json` or imported in `src/`                                     | M2        | Survey |
| 8   | Native SVG Icon Engine                   | Pure SVG 57+ icon component library with `forwardRef` in `src/components/ui/icons.tsx`           | M2        | Survey |
| 9   | Native Web Crypto & State Hooks          | Pure Web Crypto AES-256-GCM and `useNativeQuery` / native React hooks                            | M2        | Survey |
| 10  | CI Workflow SHA Pinning & Permissions    | 100% of action steps pinned to 40-char commit SHAs with least-privilege token permissions        | M3        | Survey |
| 11  | Edge Proxy & SSRF Boundaries             | Strict origin checking (`https://newerp.kluniversity.in`), traversal protection, type validation | M3        | Survey |
| 12  | Playwright E2E Suite Fixes               | Fix cookie prefix (`enc.demo_session_data`), configure `webServer.env` in `playwright.config.ts` | M4        | Survey |
| 13  | Credential Sanitization & CI Integration | Remove hardcoded secrets in `scripts/diagnose-attendance.ts`, add `test:api` step to `ci.yml`    | M4        | Survey |
| 14  | Final Verification & Forensic Audit      | Run all suites, stress tests, challenger suites, and Forensic Auditor verification               | M5        | Survey |

## Milestones

| #   | Name                                | Scope                                                                                       | Dependencies | Status      |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 1   | Quality Gates & Core Health         | Verify tsc, eslint, unit tests, API tests, agent-as-judge, build                            | none         | DONE        |
| 2   | Ponytail Zero-Bloat & Icon Engine   | Verify dependencies, 57+ SVG icons, Web Crypto, native hooks                                | M1           | DONE        |
| 3   | Security & CI Hardening             | Verify 40-char SHA workflow pinning, token permissions, SSRF proxy boundaries               | M1           | DONE        |
| 4   | E2E & Infrastructure Remediation    | Apply fixes to Playwright E2E cookie/config, scripts credential sanitization, ci.yml        | M1, M2, M3   | IN_PROGRESS |
| 5   | Final Verification & Forensic Audit | Full verification across all quality gates, challenger stress harnesses, and forensic audit | M4           | PLANNED     |

## Interface Contracts

### `src/lib/session.ts`

- `encodeSession(data: SessionPayload): Promise<string>` -> returns `enc.<base64url>` token
- `decodeSession(token: string): Promise<SessionPayload | null>` -> validates `enc.` prefix, decrypts via `AES-256-GCM` using SHA-256 derived key
- Throws fatal error in production if `SESSION_SECRET` is missing

### `src/components/ui/icons.tsx`

- `createIcon(displayName: string, children: React.ReactNode)` -> `React.forwardRef<SVGSVGElement, IconProps>`
- Standard props: `size?: number | string`, `className?: string`, SVG attributes forwarded

### `src/app/api/fetch-photo/route.ts` & `src/lib/scrapers/http-jar.ts`

- Allowed base origin: `https://newerp.kluniversity.in`
- Path sanitization: `/^\/uploads\/[a-zA-Z0-9._\-/]+$/i`
- Traversal blocking: reject `..`, `%2e`, `//`, `://`

## Code Layout

- `src/app/`: Next.js App Router (Dashboard pages, API routes, layout)
- `src/components/ui/`: UI primitives including `icons.tsx`
- `src/lib/`: Scrapers, session crypto, i18n, utilities
- `src/hooks/`: React hooks (`useNativeQuery`, `useAcademicSession`, `use-toast`)
- `scripts/`: Verification scripts (`agent-as-judge.ts`, `challenger-icon-stress.ts`, `challenger-browser-stress.ts`, etc.)
- `e2e/`: Playwright E2E test specifications
- `.github/workflows/`: CI/CD workflows (`ci.yml`, `codeql.yml`, `jules.yml`, `labeler.yml`, `release.yml`, `scorecards.yml`)
