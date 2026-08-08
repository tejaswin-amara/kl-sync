# Changelog

All notable changes to the **KL Sync** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
