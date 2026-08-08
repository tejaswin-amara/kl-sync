# Project Context - KL Sync Architectural Simplification

## Repository Details
- Path: `C:\Users\speed\Documents\antigravity\optimistic-pascal`
- Framework: Next.js (React 19)
- Key Files:
  - `src/lib/session.ts` (Authentication session logic)
  - `src/lib/ai/executor.ts` (AI intent routing & execution)
  - `src/lib/utils.ts` (Styling utilities `cn()`)
  - `package.json` (Dependencies list)
  - `src/lib/fixtures` (Target for mock data consolidation)

## Rules & Standards
- Strict TypeScript & Next.js conventions.
- No unused dependencies (`swr`, `clsx`, `tailwind-merge`).
- Native tool calling via Vercel AI SDK.
- Zero error policy on build, lint, and typecheck.
- All Playwright tests must pass.
