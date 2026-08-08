# Architectural Simplification Plan - KL Sync

## Objectives
1. **R1: Authentication & Session Simplification** (`src/lib/session.ts`)
   Replace custom AES-256-GCM cipher logic (`crypto.createCipheriv`) with standard Web Crypto API / Next.js cookie handling or `iron-session`.
2. **R2: Native AI Tool Calling** (`src/lib/ai/executor.ts`)
   Replace regex-based string parser (`parseNaturalLanguageIntent`) with Vercel AI SDK `generateText` using strict Zod tool schemas.
3. **R3: Dependency Purge** (`package.json`)
   Remove `swr`, `clsx`, `tailwind-merge`.
   - Refactor client components using SWR to native `fetch` / React 19 `use()`.
   - Refactor `cn()` helper in `src/lib/utils.ts` and UI components to template literals.
4. **R4: Mock Data Consolidation** (`src/lib/fixtures`)
   Extract all hardcoded fallback data (`DEMO_TIMETABLE`, `DEMO_PROFILE`, etc.) into `src/lib/fixtures`.

## Execution Topology
- **Survey Phase**: Dispatch 3 parallel Explorers to analyze R1, R2, R3, R4 and test setup.
- **Implementation Phase**: Sequential / parallel milestone execution with Explorer -> Worker -> Reviewer -> Challenger -> Auditor cycles.
- **Verification Phase**: Full static analysis (`npm run build`, `npm run lint`, `npx tsc --noEmit`) + Playwright E2E test suite validation.
