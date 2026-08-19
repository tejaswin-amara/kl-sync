# KL Sync System Improvement Backlog

**Audit status:** Initial backlog created before implementation. Findings will be updated with evidence, acceptance criteria, and final status as fixes land.

**Repository:** [`tejaswin-amara/kl-sync`](https://github.com/tejaswin-amara/kl-sync)

**Audit method:** Complete tracked-file inventory, source-level heuristic scan, targeted line-by-line review of trust boundaries and core flows, baseline lint/build/test execution, and reference comparison against Ponytail and the supplied engineering/design repositories.

## Executive summary

The repository contains a substantial amount of intentional test and stress coverage, a broad ERP module surface, and an already-reworked dark frontend. The most urgent issues are not visual: **invalid or missing session tokens can silently become demo sessions**, the ERP and AI APIs can return demo data without a real authenticated session, encrypted-session encoding can fall back to base64, the dashboard middleware checks only cookie presence, and the AI path is pinned to an unsupported model in the current environment while converting runtime failures into successful-looking responses. These defects weaken the trust boundary and explain the current AI/e2e baseline failures.

The complete tracked inventory contains **191 files**, including **178 text files** and approximately **37,088 lines**. The heuristic scan produced **528 matches**, but many are expected in tests, documentation, scripts, or intentional browser/storage code. The backlog therefore treats heuristics as review queues, not automatic defects.

| Priority | Finding family | Current evidence | Required outcome |
|---|---|---|---|
| Blocker | Session trust boundary | `src/lib/session.ts:63-69,72-116`; `src/app/api/erp-proxy/[module]/route.ts:55-66`; `src/app/api/ai/chat/route.ts:51-63` | Invalid, missing, expired, or tampered sessions fail closed with 401; only explicit local demo mode can return fixtures. |
| Critical | Session confidentiality | `src/lib/session.ts:63-69`; login client persists session material in browser storage and writes `document.cookie` | Remove plaintext/base64 fallback; set encrypted session as server-controlled `httpOnly` cookie; do not persist bearer session tokens in JS-readable storage. |
| Critical | Authenticated API semantics | `src/app/api/erp-proxy/[module]/route.ts:133-239`; `src/app/api/ai/chat/route.ts:88-105`; `src/app/api/fetch-photo/route.ts:42-51` | No-auth requests never receive student fixtures or HTTP 200 success responses. |
| High | Middleware integrity | `src/middleware.ts:4-15` | Guard checks a valid session shape/expiry or delegates to a safe server validation boundary, not only cookie existence. |
| High | AI reliability | `src/lib/ai/executor.ts:602-620`; baseline test output | Configurable supported model, bounded fallback to offline matcher, stable tool result shaping, and truthful HTTP errors. |
| High | Rate limiting and IP trust | `src/lib/request-utils.ts:31-63`; API routes | Avoid trusting arbitrary forwarded headers; document proxy trust; make limits bounded and deploy-safe or explicitly scope them to best-effort protection. |
| High | Frontend architecture | `src/app/page.tsx`, `src/components/Navigation.tsx`, route pages | Rebuild from explicit component contracts, preserve domain logic, reduce compressed one-line JSX, consolidate repeated states, and keep one intentional scroll context. |
| Medium | Verification quality | `npm test` baseline | Split deterministic unit/integration tests from external AI/browser suites; fix or quarantine environment-dependent tests; add regression tests for fail-closed auth. |
| Medium | Performance/debloat | 21 scroll-UX matches, repeated fetch/storage/console findings, test harness duplication | Remove redundant wrappers and unstable effects; preserve only necessary table overflow, fetch retries, and user-visible diagnostics. |

## Evidence-backed findings and fixes

### SEC-001 — Invalid session tokens downgrade to the demo session

**Severity:** Blocker. **Evidence:** `src/lib/session.ts:72-116` catches every decode/parsing failure and returns `DEMO_SESSION`. `src/app/api/erp-proxy/[module]/route.ts:55-66` and `src/app/api/ai/chat/route.ts:54-63` also default to `DEMO_SESSION` when the token is missing or cannot be decoded.

**Impact:** A missing, corrupted, forged, expired, or tampered session can be treated as a valid demo context. This collapses the authentication boundary and makes it impossible for callers to distinguish unauthenticated access from intentional local demo mode.

**Fix:** Make `decodeSession` throw `SessionDecodeError` for empty, malformed, legacy-disallowed, or cryptographically invalid tokens. Introduce an explicit, development-only demo gate controlled by a documented server environment flag and never infer demo mode from failure. API routes must return 401 for missing/invalid sessions unless the explicit demo gate is enabled.

**Acceptance:** New tests assert that null, empty, malformed, tampered, and wrong-secret tokens reject; protected API routes return 401 and never return fixtures without explicit demo mode.

### SEC-002 — Encrypted session encoding has a plaintext-style fallback

**Severity:** Critical. **Evidence:** `src/lib/session.ts:63-69` returns a `b64.` token after most encryption failures.

**Impact:** A runtime crypto failure or unexpected configuration error can send raw session contents in reversible base64, contradicting the security policy.

**Fix:** Remove the base64 fallback from production and normal runtime paths. If a compatibility decoder is retained for a deliberate migration window, gate it behind an explicit migration flag, never issue new b64 tokens, and emit a controlled migration failure rather than silently accepting arbitrary base64.

**Acceptance:** `encodeSession` either returns `enc.` or throws; tests verify no `b64.` output is produced by the encoder.

### SEC-003 — Session bearer tokens are exposed to browser JavaScript

**Severity:** Critical. **Evidence:** login and client code write session/CSRF values into `sessionStorage`, `localStorage`, and `document.cookie`; the heuristic scan reports 128 privacy-state and 97 session-state matches across the repository.

**Impact:** Any XSS or compromised third-party script can read a bearer session token and impersonate a student. Storing the same token in multiple locations creates race and cleanup complexity.

**Fix:** Set the encrypted session in a server response cookie with `httpOnly`, `secure` in production, `sameSite=lax` or stricter where compatible, `path=/`, and a bounded lifetime. Remove `document.cookie` and JS-readable session-token persistence. Keep only non-sensitive UI preferences client-side. Pass short-lived CSRF material only where required and never store the bearer token in local/session storage.

**Acceptance:** Browser storage contains no `kl_erp_session` bearer value; API routes authenticate from the cookie; sign-out clears server cookie and client caches; tests cover cookie flags and cleanup.

### SEC-004 — Dashboard middleware checks only cookie presence

**Severity:** High. **Evidence:** `src/middleware.ts:4-15` redirects only when the `kl_erp_session` cookie is absent.

**Impact:** A stale or forged cookie passes the route guard and renders a protected shell until API calls fail. This causes misleading UI and increases exposure to invalid-session paths.

**Fix:** Use a lightweight, fail-closed session validation boundary. If middleware runtime constraints make full Web Crypto validation inappropriate, use middleware only as a coarse redirect and enforce authoritative validation in every server data/API path; the client shell must render an auth-expired state rather than assuming access.

**Acceptance:** Invalid/tampered cookie reaches neither protected data nor a misleading authenticated state; expired sessions consistently produce 401 and redirect/clear state.

### SEC-005 — Protected request utilities accept bearer tokens from body/query

**Severity:** High. **Evidence:** `src/lib/request-utils.ts:15-25` accepts `sessionId` from body and query; `src/app/api/erp-proxy/[module]/route.ts:56` uses it.

**Impact:** URLs, access logs, browser history, analytics, referrers, and upstream proxies can capture tokens. Body/header fallbacks also duplicate the trust surface.

**Fix:** For protected read APIs, accept only the `httpOnly` session cookie and, if a narrowly documented migration is required, a header that is never logged. Remove query-string token support. Keep login bootstrap separate from authenticated ERP requests.

**Acceptance:** Query/body token tests return 401; cookie-authenticated requests continue to work; no session token is included in generated URLs or client logs.

### SEC-006 — ERP proxy serves fixtures to missing/invalid sessions

**Severity:** Blocker. **Evidence:** `src/app/api/erp-proxy/[module]/route.ts:55-66,133-239` defaults to `DEMO_SESSION` and serves module fixtures when `isDemoSession(session)` is true.

**Impact:** Unauthenticated callers can receive plausible academic, fee, profile, library, hostel, and exam data with HTTP 200. This is both an authorization defect and a data-integrity problem.

**Fix:** Require a verified session before fixture or upstream paths. Demo fixtures must be explicitly enabled for local development and clearly labeled. Invalid sessions return 401; real upstream failures return 502/504; empty valid data returns a distinct empty response.

**Acceptance:** A request without a cookie receives 401 for every ERP module; explicit development demo mode remains deterministic and cannot be enabled in production.

### SEC-007 — AI chat serves demo context without authentication and masks failures

**Severity:** Critical. **Evidence:** `src/app/api/ai/chat/route.ts:51-63,88-105` defaults to demo, and the outer catch returns `success: true` with an assistant error message.

**Impact:** Unauthenticated users can invoke tool behavior against fixtures, while clients and tests cannot distinguish a successful answer from a server failure.

**Fix:** Require a verified session or explicit development demo gate. Return 401 for missing auth, 400 for invalid messages, 429 for rate limits, 502/503 for model/upstream failure, and 200 only for a valid assistant result. Preserve a deterministic offline matcher for configured offline mode or supported model failure, but mark the response mode explicitly.

**Acceptance:** AI tests assert truthful status codes, no fixture access without demo mode, and stable response schema for tool calls and fallback answers.

### SEC-008 — Photo proxy returns demo SVG for invalid sessions

**Severity:** High. **Evidence:** `src/app/api/fetch-photo/route.ts:42-51` decodes permissively and returns a dummy SVG for `isDemoSession`.

**Impact:** The same invalid-session downgrade exists on a route that can proxy user-associated media. The response also accepts a client header before cookie, increasing token ingress paths.

**Fix:** Require a valid cookie session, preserve strict ERP-origin and path allowlisting, return 401 for invalid sessions, and use a static placeholder only in the UI when the authenticated photo request fails.

**Acceptance:** Invalid session never yields a 200 image; successful responses enforce image content types and bounded cache behavior.

### REL-001 — AI model is hardcoded to an unsupported provider model

**Severity:** High. **Evidence:** `src/lib/ai/executor.ts:616-620` calls `openai('gpt-4o')`; baseline test output reports `Unsupported model` and downstream undefined tool results.

**Fix:** Use a validated environment-configured model with a supported default. Isolate model construction behind one small helper, validate the allowed model list, and fall back to the deterministic offline matcher for unsupported/unavailable provider errors.

**Acceptance:** AI tests pass with no external provider, with the configured supported provider model, and with a simulated provider failure. No unhandled SDK error reaches route-level success responses.

### REL-002 — AI runtime failures are reported as successful responses

**Severity:** High. **Evidence:** `src/app/api/ai/chat/route.ts:96-105` returns `success: true` after an exception.

**Fix:** Return a typed error envelope with truthful status, a correlation-safe server log, and a user-safe message. The client should render an error state with retry, not append an assistant success message.

**Acceptance:** Failure tests assert `success: false` and non-2xx status; UI retry leaves prior messages intact and does not duplicate sends.

### REL-003 — Error responses can leak internal upstream details

**Severity:** High. **Evidence:** ERP proxy catch path returns `details: errMessage` at `src/app/api/erp-proxy/[module]/route.ts:368-375`; login catch returns `error.message` at `src/app/api/login/route.ts:165-173`.

**Fix:** Map known errors to stable safe messages and log detailed errors only on the server with request correlation IDs. Do not return stack fragments, endpoint details, or upstream response text.

**Acceptance:** Client-visible errors contain no session values, upstream URLs, parser internals, or stack traces.

### REL-004 — Rate limiting is process-local and trusts forwarded identity headers

**Severity:** High. **Evidence:** `src/lib/request-utils.ts:31-63` stores limits in a per-process `Map`, trusts the first `x-forwarded-for` value, and uses a localhost fallback.

**Fix:** Treat forwarded headers as trusted only when the deployment proxy contract is explicit; otherwise use the platform-provided address. Bound the in-memory map to prevent unbounded key growth. Document that the limiter is best-effort in a stateless multi-instance deployment, or use a deploy-supported shared limiter if one is already available.

**Acceptance:** Spoofed headers cannot trivially rotate limits in tests; map memory is bounded; response headers expose retry timing consistently.

### REL-005 — Login demo bypass is too broad and embedded in production request handling

**Severity:** High. **Evidence:** `src/app/api/login/route.ts:14-19,70-94` treats empty captcha tokens and multiple public usernames as demo mode.

**Fix:** Put demo login behind a development-only explicit server flag. Require captcha verification and normal credential validation in production. Keep fixture identities out of production behavior.

**Acceptance:** Production configuration rejects demo usernames/tokens; local demo tests remain opt-in and clearly labeled.

### FE-001 — Ground-up frontend architecture needs explicit route and state contracts

**Severity:** High. **Evidence:** Prior redesign touched many compressed one-line JSX routes and shared primitives; the route surface spans login, shell, 11 modules, compliance, language, AI, charts, and shared tables.

**Fix:** Rebuild the presentation layer around a small shared shell, page header, state boundary, table/mobile-card, form, dialog/sheet, chart, and copilot contract. Keep data hooks, schemas, scrapers, and API contracts separate. Remove duplicated markup instead of layering wrappers.

**Acceptance:** Every route documents and renders loading, empty, error, partial-data, and success states; all existing destinations and actions remain reachable.

### FE-002 — Single-scroll and responsive behavior must be consistent

**Severity:** Medium. **Evidence:** Heuristic scan reports 21 scroll-UX matches; route tables and timetable matrices need horizontal overflow while shell and nested cards should not compete for vertical scroll.

**Fix:** Use one intentional main scroll context per authenticated layout, contained horizontal table overflow, and accessible mobile navigation. Remove scrollboxes that hide focusable controls or create nested page movement.

**Acceptance:** Keyboard focus is never trapped in an invisible overflow region; representative viewports show no accidental horizontal page overflow or clipped actions.

### FE-003 — UI errors, status, and accessibility need a shared state language

**Severity:** High. **Evidence:** Many route-specific components implement their own status, loading, error, badge, and table presentation.

**Fix:** Consolidate semantic status tokens, `aria-live` behavior, focus restoration, retry affordances, empty states, chart labels, and mobile expansion patterns into shared primitives.

**Acceptance:** Status is not conveyed by color alone; dialogs/sheets restore focus; all form errors are announced; touch targets remain at least 44px.

### REL-006 — Effect and request stability requires a focused audit

**Severity:** High. **Evidence:** Heuristic scan found 43 fetch patterns, 16 `new Date()` patterns, and 13 `setTimeout` patterns; existing stress scripts specifically target infinite fetch and session propagation.

**Fix:** Trace every effect and request dependency. Stabilize query inputs, add abort/cancellation where appropriate, bound retries, prevent duplicate prefetch, and ensure stale responses cannot overwrite newer state.

**Acceptance:** Stress tests show bounded request counts, no setState-after-unmount warnings, and deterministic cache invalidation.

### TEST-001 — Baseline test suite is not fully green

**Severity:** High. **Evidence:** `npm run lint` and `npm run build` pass in the baseline command sequence, but `npm test` fails in AI/e2e scenarios because the provider rejects `gpt-4o`; several tests then dereference missing tool results or expect successful assistant payloads.

**Fix:** Separate deterministic tests from provider-dependent tests, use a supported configurable model or offline fixture, update expectations for truthful errors, and add fail-closed session/API tests.

**Acceptance:** The required deterministic test command passes without external AI credentials; provider tests are explicitly gated and produce actionable skips rather than false failures.

### TEST-002 — Verification commands are broader than the declared package scripts

**Severity:** Medium. **Evidence:** `AGENTS.md:18-40` requires typecheck, native tests, agent judge, Playwright, and build, while `package.json` exposes only lint/build/start/test. Playwright and stress scripts are present but not unified.

**Fix:** Add documented, deterministic scripts for typecheck, unit, integration, e2e, AI/provider, and full verification. Do not hide failures behind a single opaque command.

**Acceptance:** CI and local instructions match package scripts and report per-layer pass/fail results.

### DEBT-001 — Heuristic matches are noisy and need classification, not blanket cleanup

**Severity:** Medium. **Evidence:** 528 heuristic matches include 178 console matches, 128 localStorage matches, 97 sessionStorage matches, docs/test/script examples, and intentional diagnostics.

**Fix:** Maintain a classified audit ledger. Remove only production-risk matches; preserve security logs, test fixtures, documentation, and explicit client preferences. Add a lint rule or targeted review for new high-risk patterns rather than deleting useful evidence.

**Acceptance:** Every remaining high-risk heuristic match has a classification and owner; no blanket grep-based cleanup introduces regressions.

### DEBT-002 — Test/stress harnesses should be separated from product source and CI intent

**Severity:** Medium. **Evidence:** Many top heuristic files are challenger/stress scripts and test suites, including `scripts/challenger-browser-stress.ts`, `scripts/challenger-interaction-stress.ts`, and `tests/challenger_*`.

**Fix:** Keep them if they are maintained, but document purpose, required environment, expected external dependencies, and whether they run in CI. Remove stale generated logs or move experimental harnesses into an explicit lab area only when no active workflow depends on them.

**Acceptance:** A new contributor can run the stable suite without accidentally invoking expensive or provider-dependent stress harnesses.

### DOC-001 — Security policy and implementation must agree

**Severity:** High. **Evidence:** `SECURITY.md` promises encrypted session cookies and zero server residue, while current session code permits base64 fallback and client code persists session material in JS-readable stores.

**Fix:** Update code first, then revise policy and README to describe actual cookie flags, demo mode, storage boundaries, third-party deployment limitations, and failure semantics.

**Acceptance:** Documentation claims are verified against code and automated tests.

## Ground-up frontend redesign backlog

The redesign will be executed after trust-boundary fixes are stable, but the list is created now so system behavior remains the source of truth.

| Surface | Improvement | Acceptance |
|---|---|---|
| Login | Rebuild as a compact dark entry flow with explicit states for validation, captcha loading/error, retry, offline/upstream failure, and session success. | No scroll bloat, visible status, keyboard-complete, no token leakage. |
| App shell | Rebuild desktop/mobile navigation around route metadata, one main scroll context, and explicit escape paths. | All 11 modules reachable; active state and focus are correct at 375–1440px. |
| Dashboard | Compose context summary, metrics, schedule, current courses, and next actions from shared cards and state boundaries. | Cached/partial/empty/error data is understandable without layout shift. |
| Data modules | Use shared page header, filters, table/mobile cards, export, retry, and empty states. | Attendance, marks, fee, timetable, profile, library, hostel, circulars, exam seating, and tools retain behavior. |
| Charts | Add accessible labels, textual summaries, tabular fallback, and semantic color use. | Meaning is preserved without color or hover-only interaction. |
| AI copilot | Rebuild composer, message list, tool status, error/retry, and offline/provider modes. | No false success messages, no hidden auth fallback, keyboard and reduced-motion support. |
| Compliance/language | Keep privacy/data export/erasure and i18n/RTL available in compact, focus-safe dialogs/sheets. | Focus restoration, translated labels, RTL layout, and destructive confirmation work. |

## Reference-to-decision mapping

The Ponytail reference supplies the minimal-change ladder and the rule that security, validation, error handling, and accessibility are never removed for brevity. OpenDesign and UI UX Pro Max inform design-system contracts, visual hierarchy, responsive states, and live critique. RealWorld, PetClinic, T3, Cal.com, and shadcn inform route/shell and primitive composition. The system-design and learning references inform explicit boundaries, failure-mode documentation, and traceable acceptance tests. Agent-skills, governance-toolkit, ag-kit, Agent-Reach, codebase-memory-mcp, anthropics/skills, imgui, Rust, and no-mistakes inform code intelligence, governance, bloat control, explicit contracts, reproducibility, and safe Git workflows.

## Definition of done

All blocker and critical findings are fixed or explicitly prevented by configuration; high-priority findings have code and tests; the redesigned frontend preserves route coverage and core workflows; deterministic verification passes; provider/browser limitations are separated and documented; the final traceability ledger maps findings to commits and tests; no temporary audit files remain; the worktree is clean; and the final result is pushed to the selected repository.

## Execution status — 2026-08-19

The blocker and critical trust-boundary fixes are implemented. Session encoding is encrypted-only and bounded; malformed, missing, and tampered tokens reject instead of becoming demo sessions; production demo mode is impossible without an explicit non-production flag; login and CAPTCHA bootstrap use short-lived `httpOnly` cookies; the ERP, AI, and photo routes fail closed; query/body bearer-token fallbacks are removed; logout clears server cookies; AI model selection is validated and provider failures fall back deterministically; live ERP tool failures no longer substitute demo data; error statuses and client-visible messages are truthful and sanitized; CAPTCHA signing secrets fail closed in production; and forwarded-IP trust is explicit and the in-memory limiter is bounded.

The frontend pass preserves the existing dark redesign while strengthening the root metadata, service-worker boundary, single authenticated scroll context, narrow/short-viewport login behavior, safe-area spacing, horizontal-overflow prevention, mobile CAPTCHA flex behavior, reduced-motion support, and one-screen desktop composition. The verification surface now exposes `typecheck`, `test`, `test:api`, and `verify` scripts. The deterministic full suite currently passes **110 tests across 10 suites**, and the API workflow suite passes **38 tests**. The production build and lint pass after the changes.

The remaining heuristic matches are classified as intentional fixtures, tests, diagnostics, browser-only preferences, or the required upstream scraper behavior; they are not blanket-removed because doing so would reduce observability or break core workflows. The final traceability record is maintained in `PONYTAIL_REFERENCE_NOTES.md`, `VERIFICATION_NOTES.md`, and this backlog.

## Remediation pass — 2026-08-19

The deployed-instance security and performance findings were addressed in the working tree. Session-bound API responses now receive explicit `private, no-store, max-age=0` headers with `Vary: Cookie`; the service worker caches only public shell assets and never caches `/api/` responses; old cache versions are deleted on activation; valid 192px and 512px PWA icons, `robots.txt`, and `sitemap.xml` are present; and the login logo was reduced from approximately 405 KB PNG transfer to an approximately 35 KB WebP asset. Security headers now include `nosniff`, `DENY` frame protection, Referrer-Policy, Permissions-Policy, COOP/CORP, and a report-only CSP.

The CAPTCHA path is now truthful. The CapJS widget is mounted in the login form and its real token is submitted as `captchaToken`; synthetic `demo_token`, `abcd`, timeout, and error success paths were removed from production behavior; CAPTCHA bootstrap and login are rate limited; production CAPTCHA verification rejects demo and structural legacy tokens; and the manual ERP CAPTCHA input remains available when an OCR provider is unavailable. A local production browser smoke test confirmed automatic CapJS verification completes when an explicit `CAP_SECRET` is configured. The live deployment’s CapJS challenge endpoint also returned a valid challenge, confirming its production secret path is available. ERP text-CAPTCHA auto-fill remains dependent on a configured `OCR_SPACE_API_KEY`; without that provider, the system now fails honestly into manual entry rather than claiming a false solve.

Attendance and related academic callers now rely on the encrypted HttpOnly session cookie rather than the obsolete browser-readable CSRF/session-storage transport. The main dashboard, tools page, attendance hook, marks hook, timetable hook, prefetcher contract, and profile expiry path were migrated. The ERP cookie jar now preserves cookies through bounded same-origin redirects and rejects external redirect targets; attendance login/term selectors accept common quote and selector variations; empty HTML table responses become explicit format errors; and stale shared query data is cleared on session-expiry errors. Redirect/cookie-jar tests and the new security regression suite cover these boundaries.

The final remediation verification passed TypeScript, ESLint, production build, the deterministic suite with **110 passing tests across 10 suites**, both dependency audits with **0 vulnerabilities**, and the focused CAPTCHA/security/scraper suite with **33 passing tests**. The commit and Vercel deployment record will be added after the final GitHub and preview/production publication checks.
