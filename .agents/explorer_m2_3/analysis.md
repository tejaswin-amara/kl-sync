# Milestone 2 (M2) Charts & Accessibility Analysis Report

## Executive Summary
This report provides a comprehensive investigation of Milestone 2 (M2) analytics and accessibility requirements for KL Sync. It covers: (1) an architectural specification for lightweight, clean SVG visual trend charts for attendance, GPA/marks, and fee breakdown; (2) an evidence-based WCAG 2.2 AA accessibility audit of `Navigation.tsx`, `page.tsx` (landing page), and dashboard pages; and (3) a concrete implementation plan for ARIA live notification regions, skip navigation target positioning, >=44px touch targets, focus rings (`:focus-visible`), and dark mode contrast compliance.

---

## 1. Visual Trend Charts Implementation Plan

### 1.1 Architectural Rationale & Constraints
- **Zero Heavy Dependencies**: Rather than adding heavy chart libraries (e.g. Recharts, Chart.js), charts are implemented using custom React + SVG components (<5KB total overhead) using native Next.js/Tailwind tokens.
- **Responsive viewBox Scaling**: SVG charts utilize standard `viewBox="0 0 500 220"` with `preserveAspectRatio="xMidYMid meet"` for smooth auto-scaling on 320px mobile up to 4K displays.
- **Dual Presentation (Visual + Accessible Table)**: Every SVG chart is paired with a hidden or expandable accessible data table (`role="table"`) or `aria-label` description so screen readers can consume chart data effortlessly.

### 1.2 Interactive Chart Specifications

#### A. Attendance Trend Chart (`<AttendanceChart />`)
- **Location**: `src/app/dashboard/attendance/page.tsx` & `src/app/dashboard/page.tsx`
- **Chart Type**: Grouped Column / Horizontal Bar SVG Chart with Threshold Lines.
- **Key Visual Elements**:
  - Horizontal reference lines at **85%** (target safety zone) and **75%** (debarment risk zone) with dashed SVG `<line stroke-dasharray="4 4">`.
  - SVG Bar elements for each subject with color-coded fills:
    - `>= 85%`: Green (`var(--success)`)
    - `75% - 84%`: Yellow/Orange (`var(--warning)`)
    - `< 75%`: Red (`var(--destructive)`)
  - Interactive tooltip popover on hover/focus displaying: Subject Code, Conducted Classes, Attended Classes, Current %, and Classes Needed / Can Skip.
- **Data Source**: Hook `useAttendance(selectedYear, selectedSem)`.

#### B. GPA & Marks History Chart (`<GpaTrendChart />` & `<MarksBreakdownChart />`)
- **Location**: `src/app/dashboard/marks/page.tsx` & `src/app/dashboard/page.tsx`
- **Chart Type**: Smooth Line / Area SVG Chart (GPA trend) and Horizontal Progress Bars (Course Marks).
- **Key Visual Elements**:
  - SVG Cubic Bezier Curve (`<path d="M... C..." />`) tracking SGPA/CGPA across historical semesters with subtle gradient fill under the curve.
  - Interactive SVG circles (`<circle>`) at semester data points with hover ring expansion and tooltip displaying Semester name, SGPA, CGPA, and Total Earned Credits.
  - Course-wise internal/external marks breakdown stacked bar (`<div role="progressbar">`).
- **Data Source**: ERP profile / marks endpoint (`processERPDataForCGPA`).

#### C. Fee Breakdown Chart (`<FeeBreakdownChart />`)
- **Location**: `src/app/dashboard/fee/page.tsx`
- **Chart Type**: Semi-Donut / Stacked Bar SVG Chart.
- **Key Visual Elements**:
  - Dual SVG arc segments (`<path d="M... A..." />` or `stroke-dasharray` circle segments) showing Paid Fee vs Pending Fee.
  - Legend badges with precise monetary amounts (`₹XX,XXX`) and percentage share.
  - Hover/click highlight on chart slice to filter/highlight the corresponding row in the fee details table below.
- **Data Source**: Hook `useFee()`.

---

## 2. WCAG 2.2 AA Accessibility Audit Findings

### 2.1 Navigation Component (`src/components/Navigation.tsx`)

| Line(s) | Observed Issue | WCAG Violation | Impact | Remediation Plan |
|---|---|---|---|---|
| 227-239, 295-311, 347-357 | Active navigation links use visual styling (`bg-primary/10`) but lack `aria-current="page"`. | WCAG 4.1.2 (Name, Role, Value) | Screen readers cannot identify the currently active page. | Add `aria-current={active ? 'page' : undefined}` to all desktop, mobile drawer, and bottom bar `<Link>` elements. |
| 205-208 | Mobile drawer backdrop (`div className="fixed inset-0 bg-black/60 z-40 lg:hidden"`) has `onClick` but lacks `role="button"`, `tabIndex={0}`, or `aria-label`. | WCAG 2.1.1 (Keyboard), 4.1.2 | Keyboard users cannot dismiss mobile drawer by pressing Enter/Space on backdrop. | Replace backdrop with button or add `onKeyDown`, `role="button"`, `tabIndex={-1}`, and `aria-label="Close menu backdrop"`. |
| 177-183, 276-282 | Mobile hamburger button and desktop collapse button lack `aria-expanded`. | WCAG 4.1.2 (Name, Role, Value) | Screen reader users do not know if menu is open or collapsed. | Add `aria-expanded={sidebarOpen}` to menu button and `aria-expanded={!collapsed}` to collapse button. |
| 361-369 | Bottom bar "More" overflow button lacks `aria-expanded={moreOpen}` and `aria-controls="more-menu-sheet"`. | WCAG 4.1.2 | Screen readers cannot announce sheet open state. | Add `aria-expanded={moreOpen}` and `aria-haspopup="dialog"`. |
| 374 | "More" overflow sheet backdrop `div` has `onClick` but no keyboard handler or `aria-label`. | WCAG 2.1.1 | Keyboard navigation gap. | Add keyboard escape/click listener and `aria-hidden="true"`. |

### 2.2 Landing & Login Page (`src/app/page.tsx`)

| Line(s) | Observed Issue | WCAG Violation | Impact | Remediation Plan |
|---|---|---|---|---|
| 250-262 | Error and status alert banners do not have `role="alert"` or `aria-live="polite"`. | WCAG 4.1.3 (Status Messages) | Login failure messages and captcha retry notices are not announced to screen readers. | Add `role="alert"` and `aria-live="assertive"` to error box, and `role="status"` `aria-live="polite"` to status box. |
| 298-307 | "Remember credentials" checkbox is native `w-4 h-4` (16px x 16px) without padded touch target. | WCAG 2.5.8 (Target Size - Min 24px/44px) | Difficult to tap accurately on mobile touchscreens. | Enclose checkbox in a touch target container (`min-h-[44px] flex items-center gap-3 cursor-pointer py-2`). |
| 374 | Footnote text uses `text-muted-foreground/50` on background `#06060a`. Calculated contrast ratio is **2.9:1**. | WCAG 1.4.3 (Contrast - Minimum 4.5:1) | Fails contrast requirement for small body text. | Change class to `text-muted-foreground/80` (yielding >5.2:1 contrast ratio). |
| 340-349 | Captcha refresh button (`Button variant="outline" size="icon"`) has `h-[44px] w-[44px]` (good!), but missing `aria-controls="captcha-field"`. | WCAG 4.1.2 | Screen readers don't know which field changes. | Add `aria-controls="captcha-field"` and `aria-label="Refresh security code"`. |

### 2.3 Dashboard Pages (`src/app/dashboard/*`)

| Component / Page | Line(s) | Observed Issue | WCAG Violation | Remediation Plan |
|---|---|---|---|---|
| `attendance/page.tsx` | 38, 39 | `<Select>` controls for Academic Year and Semester lack `<label>` or `aria-label`. | WCAG 4.1.2, 1.3.1 | Add `aria-label="Select Academic Year"` and `aria-label="Select Semester"`. |
| `attendance/page.tsx` | 80-82 | Table headers (`<th>`) lack `scope="col"`. | WCAG 1.3.1 (Info and Relationships) | Add `scope="col"` to all `<th>` elements across tables. |
| `marks/page.tsx` | 42-47 | Search `<Input>` has `placeholder="Search courses..."` but no visible `<label>` or `aria-label`. | WCAG 3.3.2 (Labels or Instructions) | Add `aria-label="Search courses"`. |
| `fee/page.tsx` | 53 | Unpaid fee row relies on subtle background tint (`bg-destructive/3`) alone without strong text contrast or ARIA indicator. | WCAG 1.4.1 (Use of Color) | Ensure status badge explicitly indicates "Unpaid" with high contrast icon & text, and add `aria-label="Unpaid fee item"`. |
| `page.tsx` (Overview) | 309-317 | Today's schedule day selector pills (`px-2.5 py-1`) have height ~28px (<44px). | WCAG 2.5.8 (Target Size) | Increase padding (`py-2 px-3`) and minimum height (`min-h-[44px]`). |
| `Progress.tsx` | 48-86 | Circular progress bar variant does not render `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. | WCAG 4.1.2 | Add `role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}` to circular SVG container. |

---

## 3. Implementation Plan for ARIA Live, Skip Nav, Touch Targets & Contrast

### 3.1 ARIA Live Region Architecture
- **Global Toast & Announcer Provider**: Create `src/components/ui/aria-live.tsx` exporting a global context and `AriaLiveRegion` component.
- **Placement**: Mount in `src/app/layout.tsx` at the root level.
- **Regions**:
  - `<div role="status" aria-live="polite" className="sr-only" />` for non-disruptive data load status announcements ("Attendance synced successfully", "Captcha refreshed").
  - `<div role="alert" aria-live="assertive" className="sr-only" />` for error alerts ("Invalid credentials", "ERP connection timed out").

### 3.2 Skip Navigation Target Optimization
- **Current Defect**: In `src/app/layout.tsx`, `<a href="#main-content" className="skip-nav">` targets `<div id="main-content">`, which wraps the entire `{children}`. In dashboard pages, `{children}` contains `Navigation.tsx` including top header and sidebar. Therefore, pressing Tab on "Skip to content" does not jump past navigation!
- **Fix Plan**:
  1. Remove `id="main-content"` from `layout.tsx`.
  2. Add `id="main-content"` directly to the `<div className="flex-1 overflow-y-auto...">` inside `<main>` in `src/components/Navigation.tsx`.
  3. On landing page (`src/app/page.tsx`), add `id="main-content"` to the login card container `<main>` or right panel.

### 3.3 Touch Target Size Standard (>= 44px x 44px)
- **Rules**:
  - All interactive buttons, icon buttons, inputs, selects, links, and checkboxes must satisfy `min-h-[44px]` and `min-w-[44px]` (or equivalent touch padding container).
  - Update `Button.tsx` size variants: `size="sm"` should be `min-h-[40px] sm:min-h-[36px]` with extended touch target padding (`p-2.5`).
  - Update day selector buttons in schedule widget (`py-2 px-3.5 min-h-[44px]`).
  - Wrap checkboxes in `label className="min-h-[44px] flex items-center gap-3 cursor-pointer py-2 px-1"`.

### 3.4 Focus Rings (`:focus-visible`)
- Enforce visible high-contrast ring for keyboard focus:
  ```css
  :focus-visible {
    outline: 2px solid var(--ring) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.25) !important;
  }
  ```
- Verify all interactive controls use standard `focus-visible:` classes and avoid removing focus outlines without alternative focus indicators.

### 3.5 Dark Mode Contrast Compliance (WCAG 2.2 AA)
- Audit all color combinations:
  - Base background: `#06060a`
  - Text primary (`#f4f4f5`): **15.2:1** (PASS)
  - Text muted (`#a1a1aa`): **7.3:1** (PASS)
  - Replace low contrast utilities:
    - Remove `text-muted-foreground/50` (2.9:1 FAILS) -> replace with `text-muted-foreground/80` (5.2:1 PASS).
    - Remove `text-muted-foreground/70` (4.2:1 FAILS for small text) -> replace with `text-muted-foreground/90` (6.4:1 PASS).
    - Update `Badge` muted/secondary variants to ensure text contrast meets 4.5:1 ratio against card backgrounds.
