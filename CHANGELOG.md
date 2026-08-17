# Changelog

All notable changes to the **KL Sync** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-08-17

### 🪮 System-Wide Ponytail Architecture & Native Icon Migration
- **Pruned `lucide-react`**: Removed heavyweight 500KB+ external icon dependency in favor of a native zero-runtime SVG library (`src/components/ui/icons.tsx` — 55 primitives with standardized `viewBox`, `strokeWidth`, and ARIA compliance).
- **Stabilized `useNativeQuery`**: Implemented `useRef` memoization on query keys to eliminate re-render/fetch loops during rapid student navigation and tab remounting.
- **Dual-Binding Scraper Mapping**: Enhanced `src/lib/scrapers/marks.ts` to automatically bind both `DynamicModel[semester]` and `DynamicModel[semesterid]` parameters against ERP endpoints.
- **Dead Code Pruning**: Removed legacy uncalled dialogs and wrappers (`AIChatDialog.tsx`, `useERPData.ts`, `command.tsx`, `tooltip.tsx`).

### 🧪 Quality & Test Suite Expansion (310 Tests Across 52 Suites)
- **91 New Test Suites**: Added comprehensive icon adversarial tests (`src/components/ui/icons.test.ts`, `challenger-icons-adversarial.test.ts`), layout stability checks, and marks scraper edge case suites.
- **End-to-End Browser Audit**: 11/11 dashboard routes verified with live session hydration and 0 console errors.
- **Challenger Browser Stress Suite**: 15/15 adversarial checks passed across multi-tab concurrency, history hopping, and WCAG 2.2 AAA touch target audits.

---

## [2.2.0] - 2026-08-11

### 🧹 Dependency Purge & Zero-Dep Utilities (M3)
- **Removed `swr`, `clsx`, `tailwind-merge`**: Replaced with zero-dependency native implementations. The `cn()` class-name utility in `src/lib/utils.ts` now handles strings, objects, arrays, and conditional classes natively without any third-party imports.
- **Variable Rename Cleanup**: Renamed all `swrError` references to `fetchError` across dashboard pages for consistency with the native data fetching layer.

### 🧪 Expanded Test Suite (219 Tests Across 33 Suites)
- **20 new tests**: Added `src/lib/utils.test.ts` (cn() helper), `src/lib/ai/empirical-m2-stress.test.ts` (AI tool calling stress tests), and `src/lib/ai/challenger-executor-adversarial.test.ts` (adversarial executor tests).
- **Zero-Drift Baseline**: 219/219 tests pass, 9/9 Agent-as-Judge tests pass, 0 TypeScript errors, 0 ESLint errors, clean Turbopack production build.

### 🔒 Security Updates
- **Dependabot PR #63 merged**: Bumped `undici`, `sharp`, and 5 other transitive dependencies to patch 4 high/medium severity CVEs (CRLF injection, cache directive bypass, cookie attribute injection, retry content-length mismatch).
- **PR #64 closed**: Leaked API key file (`profile_dump.html`) no longer exists in the working tree; key should be rotated in Google Cloud Console.

---

## [2.1.0] - 2026-08-08

### 🤖 Agentic AI Copilot & Natural Language Querying
- **Agent Toolkit Registry (`src/lib/ai/tools.ts`)**: Built typed Zod function schemas for all 7 ERP modules and utility calculators (`getAttendance`, `getTimetable`, `getMarks`, `getFeeDetails`, `getStudentProfile`, `calculateAttendanceTarget`, `predictCGPA`).
- **AI Chat Proxy (`src/app/api/ai/chat/route.ts`)**: Implemented robust route handler supporting contextual tool execution, prompt sanitization, and fallback advice formatting.
- **Interactive Copilot UI (`src/components/ai/`)**: Added `AICopilot` floating widget, `AIChatSheet` drawer, suggestion chips, and live tool execution indicators.

### 🧪 Comprehensive Quality Verification & AI Judge Harness
- **Expanded Test Suite (199 Tests Across 32 Suites)**: Added Tier 1 (Feature Coverage), Tier 2 (Boundary Cases), Tier 3 (Cross-System Integration), and Tier 4 (Real-World Journeys) opaque-box E2E test suites.
- **Programmatic Agent-as-Judge Suite (`scripts/agent-as-judge.ts`)**: Implemented 9 automated verification tests validating schema integrity, intent resolution, tool execution, and error resilience.
- **Zero-Drift Baseline**: Verified 100% pass rate across unit tests, TypeScript type checks (`npx tsc --noEmit`), ESLint analysis (`npm run lint`), and Next.js Turbopack production builds (`npm run build`).

### 🎨 WCAG 2.2 AAA & Ponytail Codebase Optimization
- **Accessibility Hardening**: Added ARIA live regions (`aria-live.tsx`), keyboard shortcut palette (`command.tsx`), >=44px touch targets, and high-contrast color tokens.
- **Ponytail Complexity Audit**: Streamlined dependencies, eliminated speculative abstractions, and verified minimal stdlib/native platform usage.

---

## [2.0.0] - 2026-08-02

### 🚀 Major Architectural Overhaul
- **Modular Scraper Engine (`src/lib/scrapers/`)**: Refactored the monolithic `src/lib/scraper.ts` file (~1500 lines) into dedicated domain scrapers:
  - `http-jar.ts`: Handles session cookie management, redirect tracking, `fetchWithJar`, timeouts, and generic HTML table parsing.
  - `attendance.ts`: Captcha fetching, login credential posting, and attendance breakdown parsing.
  - `timetable.ts`: Matrix timetable extraction and heuristic grid validation.
  - `marks.ts`: Internal marks, end exam results, and CGPA calculations.
  - `fee.ts`: Student fee orders, payment details, and generic module endpoints.
  - `profile.ts`: Multi-tab student profile scraping and demographic extraction.
- **Facade Pattern**: Re-written `src/lib/scraper.ts` as a barrel file re-exporting all modular functions to guarantee backwards compatibility across all Next.js API routes and pages.

### 🔒 Security Patches & Hardening
- **Fatal Production Security Check**: Enforced explicit runtime exception (`[SECURITY FATAL]`) in `src/lib/session.ts` if `SESSION_SECRET` is missing in production environments, ensuring plain Base64 fallback is impossible on live deployments.
- **Strict Photo Proxy Validation**: Sanitized photo path inputs in `/api/fetch-photo` to strictly require `/uploads/` paths, preventing path traversal or SSRF vulnerabilities.
- **CSRF Resolution Enforcement**: Added explicit 400 error handling in `/api/erp-proxy/[module]` if CSRF token resolution fails prior to form submission.
- **Sanitized Auth Error Logs**: Masked sensitive login parameters and passwords in exception traces in `/api/login`.

### ⚡ Timetable & UI Enhancements
- **Multi-Session Cell Splitting**: Added `splitCellSessions` and `parseCellContentMultiple` in `src/lib/timetable-parser.ts` to cleanly extract and stack multiple class/lab sessions per period slot.
- **Matrix Grid Layout Reorientation**: Updated `/dashboard/timetable` UI to render Days (Monday–Sunday) down sticky vertical left headers and Periods across top horizontal headers.
- **Responsive Spacing**: Improved vertical spacing and zero-scroll layout boundaries on the root login screen (`src/app/page.tsx`).

### 🛠️ Developer Experience & CI/CD
- **Automated CI Workflow**: Added `.github/workflows/ci.yml` running ESLint, strict TypeScript type checking (`tsc --noEmit`), automated scraper unit tests, and production Next.js compilation.
- **Comprehensive Unit Testing**: Added 18 unit tests in `src/lib/scraper.test.ts` covering timetable normalization, cell splitting, and HTML table matrix formats.
- **Prettier & ESLint Cleanliness**: Formatted codebase via Prettier and resolved all ESLint warnings and errors.
