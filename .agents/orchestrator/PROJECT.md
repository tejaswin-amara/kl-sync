# Project: KL Sync Architectural Simplification

## Architecture
Next.js (React 19) web application providing timetable and profile sync features with AI assistance.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R4 Fixtures Extract | Create `src/lib/fixtures/index.ts` and consolidate fallback datasets (`DEMO_SESSION`, `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_CGPA`, `DEMO_CAPTCHA_SVG`, `DEMO_LOGIN_RESULT`) | M4 | ORIGINAL_REQUEST |
| 2 | R1 Auth Session | Refactor `src/lib/session.ts` using Web Crypto API (`crypto.subtle`), removing `crypto.createCipheriv` | M1 | ORIGINAL_REQUEST |
| 3 | R2 AI Tool Calling | Add `ai` package, refactor `src/lib/ai/executor.ts` to Vercel AI SDK `generateText` with Zod tool schemas, remove `parseNaturalLanguageIntent` | M2 | ORIGINAL_REQUEST |
| 4 | R3 Dependency Purge | Purge `swr`, `clsx`, `tailwind-merge` from `package.json`, refactor `cn()` in `src/lib/utils.ts` and SWR hooks in `src/hooks/` & `ERPTablePage.tsx` | M3 | ORIGINAL_REQUEST |
| 5 | E2E & Static Analysis | Pass `build`, `lint`, `tsc`, `npm test`, and Playwright E2E suite | M5 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M4 | Mock Data Consolidation | Extract fallback datasets into `src/lib/fixtures` and update consumers | none | DONE |
| M1 | Session Simplification | Refactor `src/lib/session.ts` to Web Crypto API | M4 | DONE |
| M2 | AI Tool Calling | Add `ai` package, refactor `executor.ts` and AI route to native tool calling | M4 | DONE |
| M3 | Dependency Purge | Remove `swr`, `clsx`, `tailwind-merge`, refactor hooks and `cn()` helper | none | DONE |
| M5 | E2E & Static Verification | Run static analysis, test suite, Playwright E2E, and forensic audit | M1, M2, M3, M4 | PLANNED |

## Code Layout
- `src/lib/fixtures/index.ts` - Centralized mock fixtures single source of truth
- `src/lib/session.ts` - Web Crypto API session encoding/decoding
- `src/lib/ai/executor.ts` - Vercel AI SDK native tool execution
- `src/lib/utils.ts` - Zero-dependency template literal `cn()` class helper
- `src/hooks/` - Native `fetch` data fetching hooks
- `package.json` - Clean dependency manifest without `swr`, `clsx`, `tailwind-merge`
