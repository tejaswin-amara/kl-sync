## 2026-08-06T17:17:39Z

Path to ORIGINAL_REQUEST.md: C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md
Path to PROJECT.md: C:\Users\speed\Documents\antigravity\optimistic-pascal\PROJECT.md

Explorer handoffs:
- Data Hooks & Zod Schemas: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_1\handoff.md
- Scraper Resilience & Performance: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_2\handoff.md
- Unit Testing Suite: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_3\handoff.md

Scope & Tasks for Milestone 1 (M1: Architecture & Data Fetching Foundation):
1. Install required packages: `zod` and `swr`.
2. Implement Zod Validation Schemas in `src/lib/schemas/`: `attendance.ts`, `timetable.ts`, `marks.ts`, `fee.ts`, `profile.ts`, `login.ts`, `index.ts`. Validate runtime structures for scrapers and route responses.
3. Implement Client SWR Data Fetching Hooks in `src/hooks/`: `useAttendance.ts`, `useTimetable.ts`, `useMarks.ts`, `useFee.ts`, `useProfile.ts`, `index.ts`. Update `src/app/dashboard/*` pages and `src/components/ERPTablePage.tsx` to use these SWR hooks with revalidation & caching.
4. Refactor Backend Scraper Resilience & Performance:
   - `src/app/api/erp-proxy/[module]/route.ts`: Remove silent mock fallbacks in `catch (error)`. Return explicit `502 Bad Gateway` / `504 Gateway Timeout` JSON error responses when live ERP fails.
   - `src/lib/scrapers/profile.ts`: Replace unbounded `Promise.all` across profile sub-tabs with a batch-size 3 concurrency queue with 5s timeouts.
   - `src/app/api/captcha/route.ts` & `src/lib/captcha.ts`: Implement 2s dual OCR race, replace `.clear()` with timestamp-backed token pruning, prevent submitting fallback '8888' captchas to live ERP.
5. Create New Unit Test Files:
   - `src/lib/session.test.ts` (encrypt/decrypt roundtrip, invalid key handling).
   - `src/lib/scrapers/http-jar.test.ts` (cookie jar storage, headers, ERP endpoints map).
   - `src/app/api/erp-proxy.test.ts` (proxy response schemas & error status handling).
6. Verification: Run `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npx tsx --test src/lib/scraper.test.ts`. All must pass with zero errors.
