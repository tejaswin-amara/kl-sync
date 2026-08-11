# Original User Request

## 2026-08-08T16:25:37Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval  
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build and refine the modern frontend design system and autonomous feature suite for **KL-Sync** (the unofficial minimalist ERP client for KL University).

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal  
Integrity mode: development

## Requirements

### R1. Modern Glassmorphic Design System & WCAG 2.2 AAA Compliance
Implement and refine a cohesive, dark cyber minimalist frontend adhering to WCAG 2.2 AAA accessibility standards:
- Contrast ratio ≥ 7.1:1 for normal text and ≥ 4.5:1 for large text.
- Minimum interactive touch target bounds of 44 × 44 px for all buttons, inputs, icons, and tab triggers.
- High-visibility focus indicators with 2px sky-blue offset rings.
- ARIA live region support for screen reader announcements.

### R2. Core ERP Dashboard & Data Visualization Components
Provide responsive UI primitives and interactive dashboards across all student ERP modules:
- Attendance breakdown with target calculator widget.
- Interactive timetable matrix grid with desktop sticky headers and mobile collapsible accordions.
- Internal marks, GPA trend charts, and CGPA predictor.
- Fee receipts and financial dues breakdown.
- Multi-tab student profile demographics view.

### R3. Agentic AI Copilot Assistant & Natural Language Query Engine
Integrate an interactive AI Copilot chat drawer supporting natural language queries:
- Typed Zod function schemas for all 7 ERP data tools and calculators.
- /api/ai/chat proxy handler with tool call execution indicators.
- Floating Copilot widget (min-h-[48px] min-w-[48px]) and suggestion chip bar.

### R4. Automated Quality Verification & E2E Test Suite
Enforce zero-drift build & test verification:
- 100% pass rate across unit test suite (199/199 tests).
- 100% pass rate across programmatic Agent-as-Judge suite (scripts/agent-as-judge.ts).
- 0 TypeScript compilation errors (npx tsc --noEmit).
- 0 ESLint warnings or errors (npm run lint).
- Clean production Next.js compilation (npm run build).

## Acceptance Criteria

### Accessibility & UI Quality
- [x] All primary text elements satisfy ≥ 7.1:1 contrast ratio against obsidian backgrounds.
- [x] All interactive controls enforce min-height and min-width of 44px.
- [x] Focus rings display explicit offset outline styles without focus traps.

### Technical & Test Verification
- [x] npm run test passes all 199 tests across 32 suites.
- [x] npx tsx scripts/agent-as-judge.ts passes 9/9 AI capability verification checks.
- [x] npx tsc --noEmit completes with exit code 0.
- [x] npm run lint completes with exit code 0.
- [x] npm run build completes clean Turbopack static generation for 15 routes.

</USER_REQUEST>
