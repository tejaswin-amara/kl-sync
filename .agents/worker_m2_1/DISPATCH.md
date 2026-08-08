## 2026-08-07T04:35:48Z
Your working directory is: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2_1
Your role: M2 UI/UX, Accessibility & Mobile Worker

Path to ORIGINAL_REQUEST.md: C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md
Path to PROJECT.md: C:\Users\speed\Documents\antigravity\optimistic-pascal\PROJECT.md

Explorer handoffs:
- Design Tokens & UI Primitives: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2_1\handoff.md
- Mobile Card Views: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2_2\handoff.md
- Charts & Accessibility: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2_3\handoff.md

Scope & Tasks for Milestone 2 (M2: UI/UX, Accessibility & Mobile Overhaul):
1. Design Tokens & CSS Utilities (`src/app/globals.css`):
   - Refine design tokens, surface levels (`--surface-4`, `--surface-overlay`), glassmorphic utility classes (`.glass-panel`, `.glass-card`, `.glass-modal`, `.glass-input`, `.glass-header`), and dark theme WCAG contrast ratios.
2. Expanded Component Primitives (`src/components/ui/`):
   - Implement `tooltip.tsx`, `toast.tsx`, `use-toast.ts`, `sheet.tsx`, `command.tsx`, `skeleton.tsx`, `badge.tsx`.
   - Update `src/app/layout.tsx` to include `ToastProvider` / `Toaster` and `AriaLiveRegion`.
3. Mobile Card Views Transformation:
   - Refactor `src/components/ERPTablePage.tsx` and all dashboard pages in `src/app/dashboard/*` to render touch-friendly card views on mobile (`<640px` viewports) with expandable details and >=44px touch targets, while preserving desktop tables on `>=640px` viewports.
4. Interactive Visual Trend Charts:
   - Implement SVG chart components: `AttendanceChart.tsx` in `src/app/dashboard/attendance/`, `GpaTrendChart.tsx` in `src/app/dashboard/marks/`, and `FeeBreakdownChart.tsx` in `src/app/dashboard/fee/`.
5. WCAG 2.2 Accessibility Overhaul:
   - Add ARIA live notification regions, skip navigation link, `aria-current="page"`, `aria-expanded` on drawer/nav toggles, `role="progressbar"`, `scope="col"` on table headers, min >=44px touch targets, and focus rings (`:focus-visible`).
6. Unit Testing & Verification:
   - Create unit tests for new primitives and chart components in `src/components/ui/primitives-m2.test.ts`.
   - Run `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm run test`. All must pass with zero errors.

Write your changes report to `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2_1\changes.md`.
Write your handoff report to `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m2_1\handoff.md`. Include test/build command outputs.
Send a message to the orchestrator when complete.
