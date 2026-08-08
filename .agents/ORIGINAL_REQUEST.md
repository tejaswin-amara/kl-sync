# Original User Request

## Initial Request — 2026-08-08T14:16:03Z

<USER_REQUEST>
Execute the architectural simplifications identified in the Detailed Ponytail Audit to completely remove over-engineering, unused flexibility, and bloat from the KL Sync application.

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal
Integrity mode: development

## Requirements

### R1. Authentication & Session Simplification
Remove the hand-rolled AES-256-GCM crypto logic in `src/lib/session.ts`. Replace it with a minimal, standard implementation using Next.js native Web Crypto API or `iron-session`. 

### R2. Native AI Tool Calling
Remove the manual regex-based intent routing (`parseNaturalLanguageIntent`) in `src/lib/ai/executor.ts`. Refactor the executor to use the Vercel AI SDK's native `generateText` with strict Zod tool schemas for reliable agentic routing.

### R3. Dependency Purge
Delete `swr`, `clsx`, and `tailwind-merge` from `package.json`. 
- Refactor client components to use native `fetch` and React 19's `use()` hook instead of SWR.
- Refactor the `cn()` utility in `src/lib/utils.ts` and all UI components to use standard template literals instead of `clsx` and `tailwind-merge`.

### R4. Mock Data Consolidation
Extract all hardcoded fallback datasets (e.g., `DEMO_TIMETABLE`, `DEMO_PROFILE`) scattered in `executor.ts` and the UI, consolidating them into a single `src/lib/fixtures` module to ensure tests and fallbacks use a single source of truth.

## Acceptance Criteria

### Verification & Testing
- [ ] **Dependency Audit:** `package.json` must NOT contain `swr`, `clsx`, or `tailwind-merge`.
- [ ] **Crypto Audit:** `src/lib/session.ts` must NOT contain manual `crypto.createCipheriv` logic.
- [ ] **AI Routing:** The AI executor must route tools natively using Vercel AI SDK instead of custom string parsing.
- [ ] **Static Analysis:** `npm run build`, `npm run lint`, and `npx tsc --noEmit` must pass perfectly with zero errors.
- [ ] **E2E Stability:** The existing opaque-box Playwright tests must continue to pass, proving that the refactoring did not break core user flows.
</USER_REQUEST>
