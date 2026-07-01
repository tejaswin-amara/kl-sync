# KL Sync — Comprehensive Codebase Audit
> Generated: July 2026 | Scope: All 41 source files, config, tests, public assets, CI

---

## 🔴 CRITICAL — Security

### SEC-1: Password stored in plaintext localStorage  
**File:** `src/app/login/page.tsx:160,216`  
`remember_password` is written to `localStorage` as a plain string. Any XSS on the page, a browser extension, or physical device access can read it. Use a session-only store, or derive a salted hash for display purposes only. Never persist the raw password across sessions.

### SEC-2: No rate limiting on any API route  
**Files:** All routes under `src/app/api/`  
`/api/login`, `/api/erp/captcha`, `/api/erp/data`, `/api/parse-ocr` have zero rate limiting. The login endpoint is trivially brute-forceable. Add Vercel's `@upstash/ratelimit` (or equivalent) with a sliding-window limiter keyed on IP.

### SEC-3: No security headers in `next.config.ts`  
**File:** `next.config.ts`  
The config has no `headers()` export. At minimum: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and `Referrer-Policy` should be set.

### SEC-4: No CORS policy on API routes  
**Files:** `src/app/api/**/*.ts`  
No `Access-Control-Allow-Origin` headers are set. Any origin can call the API. While not critical for a PWA (same-origin), it should be explicitly locked down.

### SEC-5: Service worker caches API responses  
**File:** `public/sw.js:21`  
The `fetch` handler unconditionally caches every successful GET response, including `/api/*`. A stale cached ERP response could serve outdated attendance data silently. API routes must be excluded from caching.

---

## 🔴 CRITICAL — Broken / Missing

### BUG-1: `/icon.png` is missing  
**Files:** `public/manifest.json`, `public/sw.js:5`  
Both the PWA manifest and the Service Worker `cache.addAll()` call reference `/icon.png`, which does not exist. Chrome PWA install will fail. The SW `install` event will throw on `cache.addAll()`, breaking offline support entirely.

### BUG-2: Service worker `install` crashes on missing asset  
**File:** `public/sw.js:5`  
`cache.addAll(['/login', '/icon.png'])` — if any URL in this list fails, the entire install is rejected and no Service Worker is registered. Either add `icon.png` to `public/` or remove it from the precache list.

### BUG-3: Command menu navigates to non-existent routes  
**File:** `src/components/command-menu.tsx:56,63`  
`window.location.href = '/timetable'` and `/profile` are tab states on the dashboard (`/`), not separate pages. These hard-navigations 404. Should dispatch tab-change events or use shared state.

### BUG-4: `parse()` crashes on empty attendance array  
**File:** `src/components/calculator/erp.tsx:28`  
`const r0 = raw[0]` throws `TypeError: Cannot read properties of undefined` when `raw` is an empty array. The upstream checks guard against this in the happy path but not in all code paths (e.g., after a manual OCR parse that returns `[]`).

### BUG-5: `getClassesNeeded` returns `-1` but UI is silent  
**File:** `src/components/calculator/erp.tsx:70,495`  
When more than 100 simulated classes are needed, the function returns `-1`. The card only renders the "Need X classes" text when `classesNeeded > 0`, so `-1` renders nothing. A student at 0% attendance sees no guidance at all.

### BUG-6: `GlassCard` glow never activates  
**File:** `src/components/ui/glass-card.tsx:33`  
`group-hover:opacity-100` requires an ancestor with the `group` class. None exists in any usage of `GlassCard`. The hover glow for `medium` and `high` intensity cards is permanently invisible.

### BUG-7: `GlassCard` inner `p-6` always overrides consumer padding  
**File:** `src/components/ui/glass-card.tsx:40`  
The inner wrapper hardcodes `p-6`. Usage like `<GlassCard className="p-5">` passes `p-5` to the `motion.div` wrapper but the content `div` inside still has `p-6`. Padding customization is broken.

### BUG-8: Timetable dropdown uses `setTimeout` race condition  
**File:** `src/components/calculator/erp.tsx:302,305`  
`onChange` sets state then calls `fetchTabData` in a `setTimeout(..., 100)`. The fetch runs before React guarantees the state is committed. Should use `useEffect` with `[ttYear, ttSem]` deps or pass the value directly.

### BUG-9: Command menu does not close on Escape  
**File:** `src/components/command-menu.tsx:13`  
The `keydown` handler only toggles on `Cmd/Ctrl+K`. Pressing `Escape` (standard UX expectation for modals) does nothing.

---

## 🟠 HIGH — TypeScript & Lint

### TS-1: Test globals not typed — 57 TypeScript errors  
**File:** `tsconfig.json`  
`vitest/globals: true` is set in `vitest.config.ts` but `tsconfig.json` has no `"types": ["vitest/globals"]`. Every test file has `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. flagged as `TS2582`/`TS2304`. Fix: create `tsconfig.test.json` extending the base with `"types": ["vitest/globals"]` and point vitest at it.

### TS-2: 10 `@typescript-eslint/no-explicit-any` errors  
**Files:**  
- `src/app/api/erp/data/route.ts:56` — `error.message` typed as `any`  
- `src/app/api/parse-ocr/route.ts:12` — buffer re-assignment  
- `src/components/calculator/erp.tsx:149,150,201,224,397` — `info`, `profileData`, `timetableData`, `tabLoading` states  
- `src/components/ui/dot-pattern.tsx:14`  
- `src/lib/scraper.ts:30` — `res: any` in `getSetCookies`  

### TS-3: `cn()` duplicated in two files  
**Files:** `src/components/ui/glass-card.tsx:6`, `src/lib/utils.ts:4`  
`glass-card.tsx` re-defines and re-imports `cn`. It should import from `@/lib/utils`.

### TS-4: Unused imports / dead variables (15 ESLint warnings)  
- `AnimatePresence` imported but never used — `erp.tsx:6`  
- `changePeriod` defined but never called — `erp.tsx:245`  
- `clsx`, `ClassValue`, `twMerge` imported but unused — `login/page.tsx:7-8`  
- `_` unused in `route.ts:39` destructure  
- `csrfToken` param unused in `fetchTimetableData` — `scraper.ts:417`  
- Stale `eslint-disable` directives in `erp.tsx:168,530,532`  

### TS-5: `session.ts` uses deprecated `escape`/`unescape`  
**File:** `src/lib/session.ts:6,11`  
`btoa(unescape(encodeURIComponent(json)))` and `decodeURIComponent(escape(atob(b64)))` use `escape`/`unescape`, which are deprecated globals not available in all runtimes. Replace with `TextEncoder`/`TextDecoder` for proper UTF-8 safe base64.

---

## 🟠 HIGH — Testing

### TEST-1: 5 tests currently failing  
**Files:** `src/app/login/__tests__/page.test.tsx`, `src/app/api/parse-ocr/route.test.ts`  
`2 test files failed | 5 tests failed | 39 passed`. The failing tests are the auto-solve UI test and parse-ocr route tests. These mask real regressions.

### TEST-2: `ocr.test.ts` mocks `sharp` — but `ocr.ts` doesn't use `sharp`  
**File:** `src/lib/ocr.test.ts`  
The test file mocks `sharp` (image preprocessing) but `ocr.ts` in production does not import `sharp`. The tests are covering a phantom implementation, not what ships.

### TEST-3: `image-utils.ts` is an unimplemented stub  
**File:** `src/app/api/parse-ocr/image-utils.ts`  
Both exported functions immediately return the original buffer unchanged. Tests pass because they test the stub, not real image processing. Either implement the functions or delete them.

### TEST-4: No tests for key modules  
Missing test coverage:  
- `getCaptcha()` happy path (only error cases tested)  
- `fetchProfileData()` (untested entirely)  
- `fetchTimetableData()` (untested entirely)  
- `erp.tsx` — zero component tests  
- `erp/data/route.ts` — zero API route tests  
- `erp/captcha/route.ts` — zero API route tests  
- `command-menu.tsx` — zero tests  

### TEST-5: Duplicate scraper test files  
**Files:** `src/lib/scraper.test.ts` and `src/lib/__tests__/scraper.test.ts`  
Two separate test files for the scraper, in different directories. The one in `__tests__/` only covers `getCaptcha` errors; the one at root covers `loginAndFetchSemesters`. Consolidate into one.

---

## 🟡 MEDIUM — Architecture & Performance

### ARCH-1: No `error.tsx`, `not-found.tsx`, or `loading.tsx`  
**Directory:** `src/app/`  
App Router special files are missing. Unhandled errors show a blank white Next.js error page. 404s are generic. No skeleton loading state at route level.

### ARCH-2: No middleware for auth guard  
**File:** missing `src/middleware.ts`  
Auth is checked entirely in client-side `useEffect` with a localStorage read. A server-side middleware would prevent the unauthenticated flash before redirect and work even with JavaScript disabled.

### ARCH-3: No shared API client  
**Files:** `src/app/login/page.tsx`, `src/components/calculator/erp.tsx`  
`fetch('/api/erp/data', { headers: { 'x-session-id': ... } })` is copy-pasted in multiple places with duplicated headers. A typed `erpApi` client module would centralise this and catch header/body mismatches at compile time.

### ARCH-4: Split storage model  
**Files:** `login/page.tsx`, `erp.tsx`  
Session tokens go to `sessionStorage`, attendance data goes to `localStorage`, device ID goes to both `localStorage` AND an `httpOnly` cookie. This fragmentation makes "logout" incomplete and reasoning about auth state difficult.

### ARCH-5: Magic numbers for attendance thresholds  
**Files:** `erp.tsx:20`, `erp.tsx:256,257,471,472,495,496`  
`75` and `85` appear as bare literals throughout. A `const THRESHOLDS = { CONDONATION: 75, ELIGIBLE: 85 }` export would make the business rule change-safe.

### ARCH-6: `setTimeout` anti-pattern for state-dependent fetch  
Already noted as BUG-8. Also an architecture concern: the component conflates "user changed the dropdown" with "data should be fetched" without a debounce or cancel-on-unmount mechanism.

### ARCH-7: Timetable re-fetches on every tab switch  
**File:** `src/components/calculator/erp.tsx:282`  
Comment: "always fetch timetable to allow period change". This means every visit to the Timetable tab makes a live ERP request. Stale-while-revalidate or a dirty flag would reduce unnecessary requests.

### ARCH-8: `parse-ocr` hardcodes campus/semester values  
**File:** `src/app/api/parse-ocr/route.ts:46`  
`timeslot: 'S-7-MA'`, `academicyear: '2025-2026'`, `semester: 'Odd Sem'` are hardcoded. This OCR path is broken for any other semester, year, or campus section.

### ARCH-9: `fetchTimetableData` makes two ERP requests  
**File:** `src/lib/scraper.ts` (timetable function)  
First does a GET, then conditionally does a POST if the GET response looks like a search form — doubling latency. Evaluate whether the GET is ever necessary.

### ARCH-10: `console.error` used for structured debug logging  
**File:** `src/lib/scraper.ts`  
`console.error('[login] deviceIdSent=%s ...')` and similar. Debug telemetry shouldn't use the error channel. Use `console.debug` or a proper logger module, so log levels can be controlled.

---

## 🟡 MEDIUM — PWA & Service Worker

### PWA-1: Service worker has no `activate` handler / cache invalidation  
**File:** `public/sw.js`  
The cache is named `kl-sync-v1` and is never invalidated. When the app updates, stale JS/CSS bundles are served from cache. The `activate` event should delete old caches.

### PWA-2: SW caches ERP API responses  
**File:** `public/sw.js:19-21`  
`cache.put(event.request, resClone)` runs for all GET requests including `/api/erp/*`. Network-first means the cached version is only served on failure, but a cached 1-hour-old attendance response being served on network error is misleading. API routes should be excluded entirely.

### PWA-3: Manifest has only one icon size (192×192)  
**File:** `public/manifest.json`  
Chrome requires a 512×512 icon for PWA installability. The manifest currently only declares `192x192`. Add `512x512` (and `maskable` purpose variants) to pass the PWA install criteria.

### PWA-4: No `screenshots` in manifest  
**File:** `public/manifest.json`  
Modern browsers (Chrome M119+) show app screenshots in the install prompt. Adding the `screenshots` key would improve install conversion.

---

## 🟡 MEDIUM — Accessibility

### A11Y-1: Icon-only buttons have no accessible labels  
**Files:** `login/page.tsx`  
The Refresh, Wand (auto-solve), and Logout buttons are icon-only and have no `aria-label`. Screen readers announce them as unlabeled buttons.

### A11Y-2: Status info messages use error icon  
**File:** `src/app/login/page.tsx`  
The `status` state (e.g., "Fetching attendance data…") renders with `<AlertCircle>` — the same icon as errors — inside a blue box. An `<Info>` icon should be used for informational messages.

### A11Y-3: Attendance card uses `<button>` overlay inside a `<GlassCard>`  
**File:** `src/components/calculator/erp.tsx`  
`<button className="absolute inset-0">` makes the whole card clickable, but other child elements (progress bar, text) are within the same DOM structure. Screen readers can't distinguish the interactive surface from decorative children.

### A11Y-4: No `aria-expanded`/`aria-controls` on tab buttons  
**File:** `src/components/calculator/erp.tsx`  
The Dashboard/Profile/Timetable tab switcher has no ARIA role (`role="tablist"`, `role="tab"`, `aria-selected`).

### A11Y-5: NumberTicker has no accessible text alternative  
**File:** `src/components/ui/number-ticker.tsx`  
The animated counter renders an empty `<span>` initially and populates via `textContent` in a Spring callback. Until the animation runs, screen readers read nothing.

---

## 🟢 LOW — Code Quality & DX

### DX-1: `Zod` listed in README tech stack but not installed  
**Files:** `README.md`, `package.json`  
README says "Parsing/Scraping: Cheerio, Zod" but Zod is not in `dependencies` or `devDependencies`.

### DX-2: `.agents/` directory committed to the repo  
**File:** `.gitignore`  
The `.agents/` folder (Sovereign-OS knowledge files, evolution reports, harvested skills) is checked in. These are personal dev-agent artifacts. Add `.agents/` to `.gitignore`.

### DX-3: `.vercel` duplicated in `.gitignore`  
**File:** `.gitignore:37,61`  
`.vercel` appears twice.

### DX-4: `LICENSE` file is missing  
**Root directory**  
README and ESLint badge declare MIT. No `LICENSE` file exists. GitHub shows "No license" on the repo card, which discourages contributors.

### DX-5: `DESIGN_SYSTEM.md` is inaccessible / corrupted  
**File:** `DESIGN_SYSTEM.md`  
The file appears to have non-UTF-8 encoding making it unreadable. If it contains the design token system, fix the encoding or regenerate it.

### DX-6: `retro-grid.tsx` only has dark-mode grid lines  
**File:** `src/components/ui/retro-grid.tsx:24`  
The grid lines are `rgba(255,255,255,0.1)` — invisible in light mode. The component has no light mode variant despite the app having a light theme toggle.

### DX-7: Light mode CSS variables not defined  
**File:** `src/app/globals.css`  
All CSS custom properties (`--background`, `--foreground`, etc.) are only defined in `:root`. There is no `.light` or `[data-theme="light"]` block. Light mode relies entirely on Tailwind's `dark:` prefix overrides, but components using raw CSS vars (e.g., `.card`, `.field`) won't adapt.

### DX-8: `vitest.setup.ts` only imports `jest-dom` — no `vi` global setup  
**File:** `vitest.setup.ts`  
The file only has `import '@testing-library/jest-dom'`. `vi` is available via globals but nothing is configured for `fetch` mocking at the global level.

### DX-9: `NumberTicker` effect uses an expression instead of a function call  
**File:** `src/components/ui/number-ticker.tsx:30`  
`useEffect(() => springValue.on("change", ...))` — the return value of `.on()` (a cleanup unsubscribe function) should be returned from the effect, not left as an expression. ESLint warns `@typescript-eslint/no-unused-expressions`. The subscription is never cleaned up, causing a memory leak.

### DX-10: `parse-ocr` regex assumes specific ERP column order  
**File:** `src/app/api/parse-ocr/route.ts:40`  
The regex `line.match(/^([a-zA-Z0-9-]+)\s+(.+?)\s+([LTPSltps])\s+(\d+)\s+(\d+)/)` is fragile — assumes exactly 5 columns in a specific order and fails silently (returns `null` for the row) on any variation. No error is surfaced to the user.

---

## 📋 Summary Table

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| Security | 5 | — | — | — |
| Bugs | 9 | — | — | — |
| TypeScript/Lint | — | 5 | — | — |
| Testing | — | 5 | — | — |
| Architecture | — | — | 10 | — |
| PWA/SW | — | — | 4 | — |
| Accessibility | — | — | 5 | — |
| Code Quality/DX | — | — | — | 10 |
| **Total** | **14** | **10** | **19** | **10** |

**53 distinct issues across the full codebase.**

---

## Quick-win Fixes (under 30 min each)

1. Add `LICENSE` file (MIT)
2. Add `.agents/` to `.gitignore`
3. Remove duplicate `.vercel` from `.gitignore`
4. Remove `AnimatePresence`, `changePeriod`, dead imports
5. Move `cn()` out of `glass-card.tsx`, import from `@/lib/utils`
6. Add `"types": ["vitest/globals"]` to a `tsconfig.test.json`
7. Add `aria-label` to icon-only buttons in login page
8. Replace `escape`/`unescape` with `TextEncoder`/`TextDecoder` in `session.ts`
9. Add `icon.png` to `public/` (or remove from manifest/SW)
10. Fix SW `activate` handler to clear old caches
11. Fix `NumberTicker` effect to return the unsubscribe cleanup function
12. Remove the `setTimeout` hack for timetable fetching
13. Exclude API routes from SW caching
14. Add `THRESHOLDS` named constants for 75/85
