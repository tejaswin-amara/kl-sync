# Detailed Specification Mining & Analysis: KL Sync ERP Client

**Working Directory:** `C:\Users\speed\Documents\antigravity\optimistic-pascal`  
**Miner Role:** AI Capability & Spec Miner  
**Date:** 2026-08-06  

---

## Executive Summary

This document presents the complete specification analysis for the KL Sync ERP Client project. It synthesizes requirements from `ORIGINAL_REQUEST.md`, project architectural blueprints (`PROJECT.md`), static analysis tools, and codebase inspection. Key focus areas include **R3 (AI Capability Integration)**, exact CLI verification steps (`npm run build`, `npm run lint`, `npx tsc --noEmit`, `npx tsx --test src/lib/scraper.test.ts`), the **Agent-as-Judge script**, **Lighthouse audit targets (>95 across core metrics)**, and a comprehensive inventory of feature specifications and edge cases.

---

## 1. Deep Dive: R3 — AI Capability Integration Requirements

Requirement **R3** from `ORIGINAL_REQUEST.md` specifies:
> *"Integrate agentic AI capabilities to improve user interactions, data querying, or workflow automation within the ERP client using the provided agent toolkits."*

To satisfy R3 end-to-end, the application architecture must define four interconnected pillars:

### 1.1 Agent Toolkits & Function Call Registry
- **Specification:** A typed set of agent tools that expose ERP capabilities and calculation utilities directly to an LLM/Agent execution loop.
- **Tool Inventory:**
  1. `get_student_attendance`: Fetches course attendance percentages, conducted classes, and attended classes.
  2. `get_timetable_schedule`: Retrieves today's or weekly normalized timetable sessions (time slots, rooms, faculty, course names).
  3. `get_marks_and_cgpa`: Queries internal assessment marks, semester grade cards, and official/weighted CGPA.
  4. `get_fee_status`: Resolves paid orders, pending balance, and total fee commitments.
  5. `get_profile_info`: Fetches student demographic data, university ID, and hostel/library/exam seating details.
  6. `calculate_attendance_target`: Simulates classes to attend or miss to hit 75% or 85% attendance targets.
  7. `predict_cgpa_goal`: Computes required upcoming semester GPA to reach a target CGPA.
- **Interface Contract:** Standardized JSON Schema input/output definitions for function calling (compatible with Vercel AI SDK, OpenAI tool calling, or custom agent loop).

### 1.2 User Interaction Surfaces (Copilot / Assistant UI)
- **Specification:** Responsive, accessible UI for interacting with AI capabilities.
- **Modalities:**
  - **Floating Copilot Widget & Drawer:** Accessible via keyboard shortcut (e.g. `Cmd+K` / `Ctrl+K`) or persistent floating button on desktop and mobile layout.
  - **Embedded Assistant Page:** Dedicated `/dashboard/copilot` or AI Assistant tab within the navigation shell.
  - **Interactive Quick-Action Chips:** Pre-built prompt suggestions (e.g., *"Can I skip Operating Systems tomorrow?"*, *"What GPA do I need for a 9.0 CGPA?"*, *"Show pending fees"*).
- **UX & Feedback Constraints:**
  - Streaming text responses with loading state indicators.
  - Generative UI cards (rendering interactive Attendance/CGPA calculator widgets inside chat responses).
  - Explicit error handling for unauthenticated sessions or expired proxy cookies.

### 1.3 Natural Language Data Querying Engine
- **Specification:** Enables plain English queries over complex, multi-module ERP data structures.
- **Query Scenarios:**
  - *"What is my current attendance in DBMS?"* -> Resolves to `get_student_attendance` filter by course code/name.
  - *"Where is my next class right now?"* -> Resolves current day order, compares current time against timetable slot ranges.
  - *"What's my total pending tuition fee?"* -> Invokes `get_fee_status` and formats total currency.
- **Context Awareness:** Automatically injects academic year, semester ID, and current student session context into agent prompts without user needing to repeat context.

### 1.4 Workflow Automation Engine
- **Specification:** Multi-step automated reasoning and task execution.
- **Automation Workflows:**
  - **Smart Attendance Alert & Recovery Plan:** Automatically identifies courses below 85%/75% threshold and generates a step-by-step attendance attendance schedule.
  - **CGPA Goal Roadmap Generator:** Takes user's desired graduation CGPA, inspects remaining credits, and outputs required grades per upcoming course.
  - **Daily Schedule & Exam Preparation Digest:** Combines daily timetable sessions with upcoming exam seating allotments into a concise daily briefing.

---

## 2. Verification & Testing Commands Specification

The following verification suite MUST pass with 0 errors to satisfy acceptance criteria:

| Command | Primary Duty | Target Scope | Expected Output / Exit Code |
|---------|--------------|--------------|-----------------------------|
| `npm run build` | Next.js production build & static optimization | `src/app`, `src/components`, `src/lib` | Exit code `0`; `✓ Compiled successfully`, static pages generated cleanly |
| `npm run lint` | ESLint static code analysis | All `.ts`, `.tsx`, `.mjs` files | Exit code `0`; `0 errors`, `0 warnings` |
| `npx tsc --noEmit` | Strict TypeScript typechecking | Project-wide TypeScript code | Exit code `0`; 0 compilation errors |
| `npx tsx --test src/lib/scraper.test.ts` | Scraper & parser unit test suite | `src/lib/scraper.test.ts` | Exit code `0`; 18 passing tests across 5 suites |
| `npm run test` (Baseline) | Full project unit test suite | `src/**/*.test.ts` | Exit code `0`; 49 passing tests across 12 suites |

---

## 3. Agent-as-Judge & Lighthouse Audit Specifications

### 3.1 Independent Agent-as-Judge Script
- **Purpose:** Programmatic verification of AI capabilities to ensure tool execution reliability and zero-crash operation.
- **Location / Command:** `npx tsx scripts/agent-as-judge.ts` or `npx tsx src/lib/ai/judge.test.ts`.
- **Assertions & Test Coverage:**
  1. **Tool Invocation Integrity:** Verifies all registered agent tools execute with mocked/real ERP responses without throwing unhandled exceptions.
  2. **Schema & Result Validation:** Confirms agent responses conform to JSON outputs and structured UI payload schemas.
  3. **Error Resilience:** Asserts graceful fallback when ERP endpoints return empty data, invalid HTML, or session timeout errors.
  4. **Natural Language Query Disambiguation:** Verifies intent classification for sample user prompts.

### 3.2 Lighthouse Performance, Accessibility & Best Practices Audit
- **Target Thresholds:** Score **>95** in Performance, Accessibility, and Best Practices.
- **Metric Breakdown & Requirements:**
  - **Performance (>95):**
    - First Contentful Paint (FCP) < 1.0s
    - Largest Contentful Paint (LCP) < 1.2s
    - Total Blocking Time (TBT) < 50ms
    - Cumulative Layout Shift (CLS) = 0.00
    - Optimized dynamic route loading, zero unnecessary large bundle re-renders.
  - **Accessibility (>95):**
    - Touch Target Size: Every interactive button, tab, and input element satisfies WCAG 2.2 touch target standards (`min-h-[44px]` or `44px x 44px`).
    - Color Contrast: Text elements achieve >= 4.5:1 contrast against dark background tokens (`zinc-950`, `zinc-900`).
    - Focus Rings & Semantics: Clear `focus-visible:ring-2 focus-visible:ring-indigo-400` rings, explicit `aria-label`, `aria-expanded`, and `role="dialog"` attributes.
  - **Best Practices (>95):**
    - Zero console error logs, secure cookies (`SameSite`, `HttpOnly`), standard Next.js asset loading.

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Security | Landing & Login Modal | Asymmetric split layout branding with dual CAPTCHA login modal | Username, Password, Captcha Tokens | ERP Session Cookies | Shows `bg-red-500/10` error banner on failure | `src/app/page.tsx` |
| 2 | Auth & Security | Cap CAPTCHA Integration | Client-side PoW bot protection widget (`cap-widget`) | User interaction / solution token | Verified token string | Re-renders widget on invalid token | `src/components/Captcha.tsx` |
| 3 | Auth & Security | ERP Image Captcha & Auto-OCR | ERP visual security code fetch with automated OCR solving | Image payload | 4-digit code string | Offers manual refresh button on OCR failure | `src/lib/captcha.ts` |
| 4 | Auth & Security | Device Registration Retry UX | Single-signon device ID cookie registration | Device ID header | Registered session token | Retries up to 3 times before prompting user | `src/app/api/login/route.ts` |
| 5 | UI & Layout | Responsive Layout Shell | Desktop fixed sidebar (`w-[280px]`) + Mobile slide-over drawer | Nav items, route state | Rendered sidebar / drawer | Auto-closes drawer on route navigation | `src/components/Navigation.tsx` |
| 6 | UI & Layout | Accessible UI Primitives | Button, Input, Badge, Card, Dialog, Skeleton with 44px min target | Props, children | Styled Accessible DOM Node | Throws descriptive error if Dialog context missing | `src/components/ui/*` |
| 7 | Dashboard | Overview Hero & Quick Stats | Live summary of CGPA, attendance %, pending fee, completed credits | ERP module payloads | Stat Cards | Shows Skeleton loading state while fetching | `src/app/dashboard/page.tsx` |
| 8 | Dashboard | Today's Timetable Widget | Real-time daily timetable widget pre-enriched with course titles & faculty | Day Order, Timetable grid | Session Cards | Displays "No classes scheduled" empty state | `src/app/dashboard/page.tsx` |
| 9 | Dashboard | Course Attendance Grid | Real-time course attendance table with threshold color coding | Academic Year, Semester ID | Table with % & status badges | Displays empty state card if no data | `src/app/dashboard/attendance/page.tsx` |
| 10 | Dashboard | Class Projection Indicator | Calculates exact classes needed or safe to skip for 85%/75% policy | Conducted, Attended classes | Required / Safe skip counts | Returns 0 for invalid negative counts | `src/components/attendance-calculator.tsx` |
| 11 | Dashboard | Universal Timetable Parser | Auto-detects matrix or list timetable HTML formats and normalizes | HTML table string | Timetable matrix grid / session array | Fallback to list parser on non-matrix format | `src/lib/timetable-parser.ts` |
| 12 | Dashboard | Timetable View Modes | Matrix Grid View (sticky day column) & List View with CSV export | View Mode toggle | Rendered view / downloaded CSV | Gracefully disables CSV export when grid empty | `src/app/dashboard/timetable/page.tsx` |
| 13 | Dashboard | Marks & Grades Viewer | Displays internal assessment marks and semester grade cards with search | Search term | Filtered marks table | Displays "No matching evaluation found" | `src/app/dashboard/marks/page.tsx` |
| 14 | Dashboard | CGPA & Weighted GPA Processor | Extracts official summary CGPA or computes weighted GPA from grades | Course grade array | `{ cgpa, credits }` | Ignores non-credit / audit courses | `src/lib/cgpa.ts` |
| 15 | Dashboard | Fee Orders & Payment Status | Parses fee orders, normalizes currency, classifies paid vs. pending | Fee HTML payload | Paid / Pending fee objects | Shows 0 pending balance if all paid | `src/lib/fee-utils.ts` |
| 16 | Dashboard | Accounting Currency Parser | Handles currency symbols (₹,$), text (INR, Rs), commas, parens | Raw string | Formatted number value | Defaults to 0 on invalid non-numeric string | `src/lib/fee-utils.ts` |
| 17 | Dashboard | Profile Demographics & Tabs | Student photo, university ID, sub-tab data tables | Profile HTML payload | Structured profile tabs | Gracefully skips missing demographic fields | `src/app/dashboard/profile/page.tsx` |
| 18 | Dashboard | Profile Photo Edge Proxy | Serves student profile images via `sharp` with edge cache control | Photo URL / ID | Image stream | Serves fallback avatar placeholder on 404 | `src/app/api/fetch-photo/route.ts` |
| 19 | Dashboard | Official Circulars List | Registrar office announcements and visibility lists | Circular HTML payload | Card list of circulars | Shows empty state if zero announcements | `src/app/dashboard/circulars/page.tsx` |
| 20 | Dashboard | Hostel Room Occupancy | Room allocation, block details, and occupancy status | Hostel HTML payload | Room details card | Displays "Not Allocated" badge if unassigned | `src/app/dashboard/hostels/page.tsx` |
| 21 | Dashboard | Library Circulation History | Book borrowing history, due dates, and return status | Library HTML payload | Book loan table | Highlights overdue books in red badge | `src/app/dashboard/library/page.tsx` |
| 22 | Dashboard | Exam Room & Seat Locator | Exam room allotments and seat numbers with highlight badges | Exam seating payload | Seating grid / cards | Shows "No upcoming exams" if empty | `src/app/dashboard/exam-seating/page.tsx` |
| 23 | Tools | Attendance Target Calculator | Pre-populated calculator evaluating classes to attend/miss | Conducted, Attended | Projection stats | Disallows negative input values | `src/app/dashboard/tools/page.tsx` |
| 24 | Tools | CGPA Goal Predictor | Calculates required GPA in upcoming credits to achieve target CGPA | Target CGPA, Upcoming credits | Required GPA number | Displays "Unreachable Goal" badge if > 10.0 | `src/app/dashboard/tools/page.tsx` |
| 25 | AI (R3) | AI Copilot Chat Interface | Interactive agent chat interface with text streaming & widgets | User NL prompt | Streamed reply + Generative UI card | Shows inline retry button on API failure | R3 Specification |
| 26 | AI (R3) | Agent Function Toolkit | Typed function calling tools accessing ERP scrapers and calculators | Tool call name + arguments | JSON result payload | Returns structured JSON error object on failure | R3 Specification |
| 27 | AI (R3) | NL Data Query Engine | Converts natural language queries into specific tool calls | User text prompt | Contextual ERP response | Clarifies intent if prompt is ambiguous | R3 Specification |
| 28 | AI (R3) | Multi-Step Workflow Engine | Automated reasoning pipelines (Attendance alerts, CGPA roadmaps) | Target goal / Trigger state | Multi-step action plan | Gracefully skips steps with missing data | R3 Specification |
| 29 | Testing | Agent-as-Judge Script | Programmatic verification script executing tool calls & queries | Script invocation | Test pass report / exit code 0 | Exits with non-zero code on unhandled failure | Acceptance Criteria |
| 30 | Quality | Lighthouse Audit Runner | Automated performance, accessibility, & best practices auditor | Site URL | Metric scores (>95 targets) | Fails build if score < 95 | Acceptance Criteria |

---

## 5. Edge Cases & Observed/Expected Behaviors

| # | Feature | Input / Edge Condition | Observed / Expected Behavior |
|---|---------|------------------------|------------------------------|
| 1 | Scraper HTML Table | Table cell contains `<br/>` or `\n` line breaks in multi-session cells | `splitCellSessions` splits sessions cleanly without dropping rooms or faculty. |
| 2 | Timetable Day Order | "DAY ORDER 7" or numeric "7" string | `normalizeDayOrder` correctly maps 7 to "Sunday" and 1-6 to Mon-Sat. |
| 3 | Timetable Slot Key | Slot text formatted as "P1", "Period 1", or "1" | `normalizeSlotKey` unifies all variations to standard slot keys ("P1", "P2", etc.). |
| 4 | Accounting Currency | Negative currency string formatted as `(₹ 1,500.00)` | `parseCurrency` converts parens to negative float (`-1500.00`). |
| 5 | CGPA Calculator | Student has non-credit or audit courses (0 credits, grade 'S'/'X') | `processERPDataForCGPA` excludes 0-credit courses from weighted GPA divisor. |
| 6 | Attendance Projection | Conducted classes equal 0 or attended classes exceed conducted | Calculator clamps percentage between 0% and 100%, preventing divide-by-zero NaN. |
| 7 | CGPA Predictor Goal | Required GPA calculated exceeds max possible grade point (> 10.00) | UI renders warning badge: "Unreachable Goal (Required GPA: X.XX)". |
| 8 | Cap CAPTCHA PoW | Missing or expired client PoW token during login submit | `verifyCaptchaToken` rejects request with 400 Bad Request error banner. |
| 9 | ERP Proxy Cookies | Session cookie expires or ERP returns 302 login redirect HTML | Scraper catches redirect, invalidates cookie cache, and prompts user to re-login. |
| 10 | AI Agent Tool Calling | User asks query for module with unselected academic year/sem | Agent tool prompts session hook or defaults to current active semester automatically. |
| 11 | AI Agent Crash Safety | Agent tool call receives malformed ERP HTML payload | Agent-as-judge verifies tool handles error gracefully and returns structured error object without throwing unhandled node exception. |
| 12 | UI Touch Targets | Mobile viewport (<640px) button or tab element rendered | All interactive components enforce minimum 44px touch height/width for WCAG compliance. |

---

## 6. Interface Constraints & Architecture Summary

1. **Security & Session Boundary:**
   - Client sessions stored in encrypted cookies + `sessionStorage`.
   - ERP proxy (`/api/erp-proxy/[module]`) routes calls through `fetchWithJar` with CookieJar merging and automatic redirect handling.
2. **Build & Type Constraints:**
   - Next.js 16 App Router with React 19 server/client component boundaries (`'use client'` headers where state/hooks are used).
   - Strict TypeScript (`npx tsc --noEmit`) with 0 errors allowed.
   - ESLint (`npm run lint`) with 0 warnings/errors.
3. **Performance & Design Constraints:**
   - TailwindCSS v4 with central tokens in `src/app/globals.css`.
   - Lucide React icons.
   - Glassmorphic panels (`.glass-panel`, `.glass-card`).
   - Touch target compliance (`min-h-[44px]`).
