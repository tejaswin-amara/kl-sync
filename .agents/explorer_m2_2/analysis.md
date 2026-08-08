# Milestone 2 (M2) Mobile Card Views — Architectural & Implementation Analysis

## Executive Summary
This analysis details the current desktop table implementations across all 12 dashboard page routes in `src/app/dashboard/*` and the core `ERPTablePage.tsx` component. It formulates a concrete, step-by-step implementation plan for converting desktop data tables into touch-friendly, responsive card representations for `<640px` viewports while maintaining desktop table rendering for `>=640px`.

---

## 1. Codebase Inspection & Audit Findings

### 1.1 Shared Table Component (`src/components/ERPTablePage.tsx`)
- **Current Behavior**: Renders a raw HTML `<table>` inside a `overflow-x-auto` wrapper for any dynamic key-value dataset.
- **Affected Dashboard Pages**:
  - `src/app/dashboard/circulars/page.tsx`
  - `src/app/dashboard/hostels/page.tsx`
  - `src/app/dashboard/library/page.tsx`
- **Deficiencies on Mobile (<640px)**:
  - Wide datasets force awkward horizontal scrolling.
  - Column text becomes squished or truncated.
  - No touch-optimized expansion or visual key metric hierarchy.

### 1.2 Dedicated Dashboard Page Routes (`src/app/dashboard/*`)

| # | Route | Current Desktop Table Implementation | Mobile Limitations (<640px) |
|---|-------|--------------------------------------|-----------------------------|
| 1 | `/dashboard` (Overview) | Widgets (`TodayScheduleWidget`, `CurrentCoursesWidget`) using card stacks | Day pills in schedule widget are small (<32px height); need >=44px touch targets. |
| 2 | `/dashboard/attendance` | Dynamic `<table>` with custom percentage badges and projection text ("Need X classes") | Horizontal scroll; projection text squished in table cells. |
| 3 | `/dashboard/timetable` | Dual-view (`grid` academic matrix table & `list` table with 7 columns) | Matrix grid requires massive horizontal scrolling across 8 periods; list table overflows screen width. |
| 4 | `/dashboard/marks` | Raw `<table>` with dynamic columns (`Course Code`, `Course Title`, `Max Marks`, `Obtained Marks`, etc.) | Severe horizontal scroll; search & export controls lack min 44px touch height on mobile. |
| 5 | `/dashboard/fee` | Raw `<table>` with custom status cell formatting (`isRowUnpaid` with red background) | Table columns overflow; fee status badge hard to read on mobile screens. |
| 6 | `/dashboard/profile` | Header card + scalar grid + extended array sub-tab tables (`courses`, `results`, `family`, etc.) | Extended tab tables render raw `<table>` with horizontal scroll; tab pills lack 44px target height. |
| 7 | `/dashboard/circulars` | Uses `ERPTablePage.tsx` | Raw table with horizontal scroll. |
| 8 | `/dashboard/hostels` | Uses `ERPTablePage.tsx` | Raw table with horizontal scroll. |
| 9 | `/dashboard/library` | Uses `ERPTablePage.tsx` | Raw table with horizontal scroll. |
| 10 | `/dashboard/exam-seating` | Raw `<table>` with custom `Armchair` seat number badge | Horizontal scroll; seat number and room location hidden unless scrolled right. |
| 11 | `/dashboard/tools` | Responsive 2-column grid calculator cards | Input fields and buttons should be enlarged to min-h-[44px] on mobile. |

---

## 2. Implementation Strategy for Mobile Card Transformations (<640px)

### 2.1 Dual-Render Pattern (`hidden sm:block` vs `block sm:hidden`)
All tabular views will adopt a dual-render architectural pattern:
- **`hidden sm:block` / `hidden md:table`**: Preserves the existing desktop table layout for wide screens (`>=640px`), retaining sticky headers, hover states, and full column density.
- **`block sm:hidden`**: Renders a vertical stack of responsive `<MobileDataCard>` components optimized for mobile devices (`<640px`).

---

### 2.2 Module-Specific Mobile Card Designs

#### A. Generic ERP Table Page (`ERPTablePage.tsx`) & Shared Mobile Card Component
- **Header**: Primary identification key (e.g., `Title`, `Subject`, `Name`, or first object key) as a prominent title, paired with a detected status or category badge.
- **Key Metrics Body**: Summary of 2–3 key properties (e.g. Date, Category, Amount).
- **Expandable Details**: A chevron button (`min-h-[44px] min-w-[44px]`) toggles a collapsible drawer showing all remaining key-value fields.

#### B. Attendance Module (`src/app/dashboard/attendance/page.tsx`)
- **Card Header**:
  - Course Code (pill badge) & Course Name (font-semibold).
  - Attendance Status Badge: Color-coded percentage badge (Green `>=85%`, Yellow `75-84%`, Red `<75%`) with `TrendingUp`, `AlertTriangle`, or `TrendingDown` icon.
- **Card Body**:
  - Attended vs Conducted ratio (`Attended X / Y conducted`).
  - Visual `<Progress>` bar reflecting percentage.
  - Projection Pill: "Need X classes to hit 85%" (destructive/warning accent) or "Can skip Y classes" (success accent).
- **Expandable Section**:
  - Component breakdown (Lecture, Practical, Tutorial sessions), room location, and faculty details.

#### C. Timetable Module (`src/app/dashboard/timetable/page.tsx`)
- **Responsive Behavior**:
  - On viewports `<640px`, auto-switch from matrix grid view to a mobile-friendly Timeline / Card List view.
  - Filter Bar: Scrollable day selector pills with `min-h-[44px] px-4 py-2.5` touch targets.
- **Card Structure**:
  - Period Slot Badge: `P1 (09:00 AM - 09:50 AM)`.
  - Component Tag: `Lecture` (indigo badge), `Practical` (emerald badge), `Skill` (purple badge).
  - Main Title: Course Name & Code.
  - Footer Badges: Venue/Room (`MapPin` icon in emerald text) and Faculty name.

#### D. Marks & Grades Module (`src/app/dashboard/marks/page.tsx`)
- **Card Header**: Course Title & Code, Final Grade / Total Score Badge (e.g. `Grade: O` or `92/100`).
- **Key Metrics**: Credits earned, semester term.
- **Expandable Section**: Detailed evaluation component list (Mid-Sem 1, Mid-Sem 2, Continuous Evaluation, End-Sem) rendered in a clean key-value grid when expanded.

#### E. Fee Details Module (`src/app/dashboard/fee/page.tsx`)
- **Card Header**: Fee Type / Description, Amount in bold font-mono (`₹X,XXX`).
- **Status Badge**: `Paid` (green check icon) vs `Pending / Unpaid` (red clock icon).
- **Card Body**: Due date, Term/Semester.
- **Card Styling**: Unpaid fee cards get a subtle red accent border (`border-destructive/30 bg-destructive/5`).

#### F. Student Profile Module (`src/app/dashboard/profile/page.tsx`)
- **Scalar Grid**: Maintained as `grid-cols-2` on mobile, but padding and touch target spacing increased.
- **Extended Sub-tabs**: Tab selection pills enlarged to `min-h-[44px]` height.
- **Tab Data Array Cards**: Replaces sub-tab raw `<table>` with mobile cards displaying course details, semester results, and family info.

#### G. Exam Seating Module (`src/app/dashboard/exam-seating/page.tsx`)
- **Card Header**: Course Title & Code, Seating Badge (`Armchair` icon + Seat No in bold indigo e.g. `Seat: A-12`).
- **Card Body**: Exam Date, Time Slot, Exam Hall / Room location with `MapPin`.

---

## 3. Touch Target & Accessibility Guidelines (WCAG 2.2 AA)

To satisfy Milestone 2 WCAG 2.2 AA accessibility criteria:
1. **Minimum Touch Target Size**: All interactive elements (tab buttons, expand/collapse toggles, filter pills, dropdown triggers, search inputs, export buttons) must have a minimum physical touch target of **44px × 44px** (`min-h-[44px]` and `min-w-[44px]` or adequate padding `p-3`).
2. **Focus Visibility**: All mobile card expand/collapse triggers must retain focus rings (`:focus-visible` outline from `globals.css`).
3. **Screen Reader ARIA Attributes**:
   - Expandable card triggers: `aria-expanded={isExpanded}`, `aria-controls={`card-details-${id}`}`.
   - Status indicators: `aria-label="Attendance status: 88%, On track"`.
   - Live data regions: `aria-live="polite"` for filtered/searched list counts.

---

## 4. Proposed Handoff / Step-by-Step Implementation Roadmap

1. **Step 1: Create Shared Mobile Data Card Primitive (`src/components/ui/mobile-card.tsx`)**
   - Reusable card component supporting title, status badge, summary metrics, and expandable details drawer.
2. **Step 2: Update `ERPTablePage.tsx`**
   - Add dual-render layout (`hidden sm:block` table vs `block sm:hidden` mobile cards).
3. **Step 3: Refactor Dedicated Pages (`attendance`, `timetable`, `marks`, `fee`, `profile`, `exam-seating`)**
   - Implement custom mobile card views tailored to each module's key metrics.
4. **Step 4: Audit Touch Targets & WCAG Compliance**
   - Ensure all interactive elements meet the 44px touch target requirement and include ARIA attributes.
5. **Step 5: Verification & Quality Checks**
   - Verify `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npm run test`.
