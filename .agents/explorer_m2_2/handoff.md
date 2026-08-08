# Handoff Report — M2 Mobile Card Views Explorer

## 1. Observation
- **Inspected Files**:
  - `src/components/ERPTablePage.tsx`: Lines 53–72 render a generic `<table>` wrapped in `overflow-x-auto`. Used by `circulars`, `hostels`, `library`.
  - `src/app/dashboard/attendance/page.tsx`: Lines 76–138 render a custom `<table>` displaying attendance percentage badges, conducted/attended counts, and class skip/need projections.
  - `src/app/dashboard/timetable/page.tsx`: Lines 342–484 render an 8-period horizontal matrix grid table; lines 496–577 render a list view `<table>` with 7 columns (`Day`, `Period/Slot`, `Course Code`, `Course Title`, `Component & Section`, `Venue/Room`, `Faculty`).
  - `src/app/dashboard/marks/page.tsx`: Lines 65–84 render a dynamic `<table>` for marks and grades.
  - `src/app/dashboard/fee/page.tsx`: Lines 40–75 render a dynamic `<table>` highlighting unpaid fee rows with `bg-destructive/3` and status icons.
  - `src/app/dashboard/profile/page.tsx`: Lines 207–261 render dynamic `<table>` elements for extended profile sub-tabs (`courses`, `results`, `family`, etc.).
  - `src/app/dashboard/exam-seating/page.tsx`: Lines 73–116 render a `<table>` with a custom `Armchair` seat number badge.
  - `src/app/dashboard/page.tsx` & `src/app/dashboard/tools/page.tsx`: Widget components (`TodayScheduleWidget`, `CurrentCoursesWidget`) and tool calculators.
  - `src/components/Navigation.tsx`: Navigation sidebar & bottom bar layout containing touch triggers for all dashboard routes.
  - `src/app/globals.css`: Design token system, responsive spacing, and `:focus-visible` ring definitions.

- **Observed Mobile Issues (<640px Viewports)**:
  - Wide data tables force horizontal scrolling, causing truncated text, cramped columns, and low readability.
  - Interactive elements like day filter tabs, dropdown selects, and expand buttons in some components are under the WCAG 2.2 AA touch target size threshold (44px x 44px).
  - Lack of structured mobile card view layout for dynamic ERP proxy tables.

---

## 2. Logic Chain
1. **Premise**: Desktop data tables work well on wide viewports (`>=640px`) but fail mobile usability standards on phone screens (`<640px`).
2. **Analysis**:
   - Replacing desktop tables entirely would degrade the desktop UX.
   - Dual-rendering (`hidden sm:block` for desktop tables and `block sm:hidden` for mobile card lists) retains full desktop fidelity while delivering a mobile-native experience.
3. **Design Requirement**:
   - Mobile cards must highlight key metrics at a glance (e.g. Attendance %, Fee Pending ₹, Seat No, Course Title) and provide an expandable drawer (chevron toggle >=44px) for full details.
   - All interactive controls (tabs, toggles, buttons) must satisfy WCAG 2.2 AA (>=44px touch targets).

---

## 3. Caveats
- **Read-Only Scope**: This report is an investigation and implementation plan only. No source files outside `.agents/explorer_m2_2/` were modified.
- **ERP Dynamic Keys**: Several proxy endpoints (`marks`, `fee`, extended `profile`) return dynamic JSON key names from Cheerio web scrapers. Mobile card implementations must safely handle fallback keys using case-insensitive key discovery (e.g. `k.toLowerCase().includes('code')`).

---

## 4. Conclusion
- A comprehensive mobile card view transformation plan has been formulated for all 12 dashboard page routes and `ERPTablePage.tsx`.
- The plan specifies:
  1. A shared mobile card component pattern (`MobileDataCard`) for `ERPTablePage.tsx`.
  2. Tailored mobile card representations for `attendance`, `timetable`, `marks`, `fee`, `profile`, and `exam-seating`.
  3. Strict adherence to WCAG 2.2 AA touch target guidelines (>=44px touch targets, ARIA attributes).
- The detailed breakdown is available in `.agents/explorer_m2_2/analysis.md`.

---

## 5. Verification Method
1. **Static Analysis & Build Verification**:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
   - `npm run test`
2. **Mobile Viewport Inspection**:
   - Open developer tools, emulate mobile device viewports (`<640px`, e.g. 375px or 390px width).
   - Verify that data tables are hidden and responsive cards render vertically with expandable details.
   - Confirm touch targets (buttons, pills, triggers) measure at least 44px × 44px.
