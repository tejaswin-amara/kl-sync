# Project: KL Sync ERP Overhaul & Modernization

## Architecture
- Framework: Next.js 16.2.9 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS v4 (@tailwindcss/postcss).
- State & Data Layer: SWR client-side data fetching & caching hooks, Next.js serverless route handlers (`/api/*`), Cheerio HTML scraper engine (`src/lib/scrapers/*`), AES-256-GCM encrypted session cookies.
- AI Integration Layer: Agent Toolkit JSON Schema function definitions (`src/lib/ai/tools.ts`), AI execution engine (`src/lib/ai/executor.ts`), chat API (`/api/ai/chat`), and Copilot UI (`src/components/ai/*`).
- Quality & Verification: Native TS node test runner (`npx tsx --test`), ESLint 9, `npx tsc --noEmit`, automated agent-as-judge suite, and Lighthouse auditing harness.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | SWR/Data Hooks Migration | Client-side SWR data fetching hooks with caching & revalidation for all dashboard modules | M1 | survey 1,2 |
| 2 | Zod Schema Validation | Runtime Zod validation for API routes and scraper outputs | M1 | survey 1,2 |
| 3 | Backend Scraper Resilience | Fix silent mock fallbacks (return explicit 502/504 errors on ERP failure) | M1 | survey 2 |
| 4 | Profile Sub-tab Concurrency Queue | Concurrency pool for profile sub-tab fetching to eliminate IIS overload | M1 | survey 2 |
| 5 | CAPTCHA OCR Optimization | Optimize dual external OCR timeouts for faster captcha resolution | M1 | survey 2 |
| 6 | API Route & Security Tests | Add unit tests for `/api/login`, `/api/erp-proxy/*`, `/api/fetch-photo`, `session.ts`, `http-jar.ts` | M1 | survey 2 |
| 7 | Glassmorphism & Token System | Refine design tokens, surface hierarchy, and glassmorphic UI styles in `globals.css` | M2 | survey 1 |
| 8 | Expanded Component Primitives | Implement shadcn-style Tooltip, Toast, Sheet, Command Palette, Skeleton, Status Badge | M2 | survey 1 |
| 9 | Mobile Data Card Views | Responsive card transformations for `<640px` viewports across all dashboard tables | M2 | survey 1 |
| 10 | Interactive Analytics Charts | Interactive visual trend charts for attendance, GPA/marks, and fee breakdown | M2 | survey 1 |
| 11 | WCAG 2.2 Accessibility Overhaul | ARIA live regions, skip nav, >=44px touch targets, focus rings, keyboard accessibility | M2 | survey 1,3 |
| 12 | Agent Toolkit Registry | Typed JSON Schema function signatures wrapping all 7 ERP data tools & calculators | M3 | survey 3 |
| 13 | AI Copilot Chat API | Route handler `/api/ai/chat` supporting tool calls, context, and error recovery | M3 | survey 3 |
| 14 | AI Copilot UI & Widget | Floating Copilot chat widget and integrated sidebar drawer for AI interactions | M3 | survey 3 |
| 15 | Natural Language Data Querying | Query ERP data in natural language ("What is my OS attendance?", "Show fee balance") | M3 | survey 3 |
| 16 | Workflow Automation & Advice | Automated attendance risk warnings, target calculation, and CGPA improvement roadmaps | M3 | survey 3 |
| 17 | E2E Opaque-Box Test Harness | Requirement-driven test runner and infrastructure for ERP client workflows | M4 | survey 3 |
| 18 | Tier 1-4 Quality Test Cases | Complete Tier 1 (Feature), Tier 2 (Boundary), Tier 3 (Cross-feature), Tier 4 (Real-world) test suite | M4 | survey 3 |
| 19 | Agent-as-Judge Test Suite | Programmatic test script verifying AI capabilities without crashing Node | M4 | survey 3 |
| 20 | Static Analysis Baseline Check | Verify `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run test` zero errors | M4 | survey 1,3 |
| 21 | Performance & Asset Optimization | Dynamic imports, CSS/font optimization, photo caching, FCP/TBT optimization | M5 | survey 2,3 |
| 22 | Automated Lighthouse Audit | Verify Lighthouse >95 score in Performance, Accessibility, and Best Practices | M5 | survey 3 |
| 23 | Tier 5 Adversarial Hardening | White-box adversarial testing, edge case stress-testing, and final sign-off | M5 | survey 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Architecture & Data Fetching Foundation | SWR hooks, Zod validation schemas, backend error handling, scraper concurrency queue, route unit tests | none | DONE |
| M2 | UI/UX, Accessibility & Mobile Overhaul | Glassmorphic design system, expanded UI primitives, mobile card views, visual charts, ARIA live regions | M1 | DONE |
| M3 | Agentic AI Capabilities & Tooling | Agent toolkit registry, `/api/ai/chat` handler, Copilot widget/UI, NL querying, workflow automation | M1, M2 | DONE |
| M4 | E2E Testing Suite & Quality Verification | Opaque-box test harness, Tier 1-4 tests, Agent-as-Judge script, TEST_READY.md, verification pass | M1, M2, M3 | DONE |
| M5 | Performance Hardening & Lighthouse Audit | Asset & cache optimization, automated Lighthouse >95 audit, Tier 5 adversarial hardening | M1, M2, M3, M4 | DONE |
| M6 | WCAG 2.2 AAA Upgrade & Ponytail Audit | Audit M1-5, ponytail audit artifact, WCAG AAA 7:1 contrast, >=44px targets, accessible names | M1..M5 | DONE |

## Interface Contracts

### 1. Data Fetching Hooks (M1 ↔ M2, M3)
- `useAttendance()`: `{ data: AttendanceData | null, error: Error | null, isLoading: boolean, mutate: Function }`
- `useTimetable()`: `{ data: TimetableData | null, error: Error | null, isLoading: boolean, mutate: Function }`
- `useMarks()`: `{ data: MarksData | null, error: Error | null, isLoading: boolean, mutate: Function }`
- `useFee()`: `{ data: FeeData | null, error: Error | null, isLoading: boolean, mutate: Function }`
- `useProfile()`: `{ data: ProfileData | null, error: Error | null, isLoading: boolean, mutate: Function }`

### 2. AI Toolkit Function Registry (M1, M2 ↔ M3)
- `getAttendance({ subject?: string })` -> Promise<{ success: true, attendance: AttendanceSubject[] }>
- `getTimetable({ day?: string })` -> Promise<{ success: true, schedule: TimetableSlot[] }>
- `getMarks({ semester?: string })` -> Promise<{ success: true, marks: MarksSubject[] }>
- `getFeeDetails()` -> Promise<{ success: true, breakdown: FeeDetails }>
- `getStudentProfile()` -> Promise<{ success: true, profile: ProfileInfo }>
- `calculateAttendanceTarget({ currentAttended, currentTotal, targetPercent })` -> Promise<{ classesNeeded: number }>
- `predictCGPA({ currentCGPA, completedCredits, newCourses })` -> Promise<{ predictedCGPA: number }>

### 3. AI Chat Proxy Contract (M3 ↔ UI)
- `POST /api/ai/chat`
- Request: `{ messages: { role: 'user' | 'assistant' | 'system', content: string }[] }`
- Response: `{ message: { role: 'assistant', content: string }, toolCalls?: { tool: string, args: object, result: object }[] }`

### 4. E2E Test & Verification Interface (M4 ↔ System)
- `TEST_READY.md`: Signal file containing test runner invocation and tier coverage table.
- Agent-as-Judge script: `npx tsx scripts/agent-as-judge.ts` -> exits with code 0 on pass.

## Code Layout
```
src/
├── app/
│   ├── api/
│   │   ├── ai/chat/route.ts       # AI Copilot API handler (M3)
│   │   ├── captcha/route.ts       # Captcha verification route
│   │   ├── erp-proxy/[module]/    # Proxy handler with resilient error statuses (M1)
│   │   ├── fetch-photo/route.ts   # Cached photo fetcher (M1, M5)
│   │   └── login/route.ts         # Authentication proxy handler
│   ├── dashboard/                 # 12 Dashboard module pages with mobile card views (M2)
│   ├── globals.css                # Glassmorphic tokens, themes, WCAG styles (M2)
│   ├── layout.tsx                 # Root layout with Toast & Live region providers (M2)
│   └── page.tsx                   # Modernized landing page & login dialog (M2)
├── components/
│   ├── ai/                        # AICopilot widget, AIChatSheet, AIChatDialog (M3)
│   ├── ui/                        # Button, Card, Toast, Tooltip, Sheet, Skeleton, etc. (M2)
│   └── Navigation.tsx             # Responsive layout navigation shell (M2)
├── hooks/                         # Unified SWR data fetching hooks (M1)
│   ├── useAttendance.ts
│   ├── useFee.ts
│   ├── useMarks.ts
│   ├── useProfile.ts
│   └── useTimetable.ts
├── lib/
│   ├── ai/                        # Agent toolkit registry & executor (M3)
│   │   ├── executor.ts
│   │   └── tools.ts
│   ├── schemas/                   # Zod runtime validation schemas (M1)
│   ├── scrapers/                  # Cheerio scraper modules (M1)
│   ├── captcha.ts
│   ├── cgpa.ts
│   ├── fee-utils.ts
│   ├── scraper.ts
│   ├── session.ts
│   └── timetable-parser.ts
scripts/
└── agent-as-judge.ts              # Programmatic AI capability verification script (M4)
```
