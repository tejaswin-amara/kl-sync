# WCAG 2.2 Level AAA Accessibility Audit Analysis

**Project:** KL Sync ERP Client  
**Scope:** All CSS stylesheets (`src/app/globals.css`), layouts, UI components (`src/components/`), and pages (`src/app/`)  
**Audit Standard:** WCAG 2.2 Level AAA Compliance  
**Date:** August 8, 2026  

---

## Executive Summary

A comprehensive, line-by-line audit of the KL Sync codebase was performed to evaluate strict compliance with **WCAG 2.2 Level AAA** standards. The application features a modern dark-mode aesthetic with glassmorphic cards and responsive layouts. However, to meet AAA standards, three critical accessibility dimensions require remediation:

1. **Enhanced Contrast Ratio (1.4.6 Level AAA):** Normal text (< 24px / 18pt normal, < 18.66px / 14pt bold) requires at least **7:1** contrast ratio. Several CSS token definitions (`--muted-foreground`, `--accent-foreground`, `--destructive`, `--warning`) and hardcoded Tailwind utility classes (`text-slate-400`, `text-zinc-400`, `text-zinc-500`, `text-indigo-400`, `text-red-500`, `text-yellow-500`) range between **2.2:1 and 6.7:1**, failing the 7:1 AAA standard on dark surfaces (#06060a, #0c0c12, #12121a).
2. **Enhanced Target Size (2.5.8 / 2.5.5 Level AAA):** Interactive pointer targets (buttons, links, inputs, selects, tab controls, dialog closers) must be **≥ 44×44 CSS pixels**. Multiple UI controls currently measure **24px to 40px** in height or width (e.g., `select.tsx` `min-h-[40px]`, `button.tsx` `size="sm"` 36px, `dialog.tsx` close button 32px, `AIChatSheet.tsx` header buttons 36px, `AIChatInput.tsx` send button 36px, `AIChatSuggestionChips.tsx` 28px, sub-tab and filter buttons 24px–32px).
3. **Accessible Names (4.1.2 & 2.5.3 Level AAA):** Interactive controls, icon buttons, and form inputs must have explicit, unambiguous accessible names (`aria-label`, `<label htmlFor>`, or visible text matching function). Key gaps include unbound form labels in `tools/page.tsx`, non-semantic clickable `<div>` elements in `Navigation.tsx`, and unlabelled icon buttons.

---

## 1. Contrast Ratio (Enhanced) Audit (WCAG 2.2 1.4.6 - Level AAA)

### 1.1 CSS Design Tokens Analysis (`src/app/globals.css`)

| CSS Variable | Current Value | Background Surface | Current Contrast | AAA Threshold (Normal Text) | Pass / Fail | Proposed Fix Value | New Contrast |
|---|---|---|---|---|---|---|---|
| `--muted-foreground` | `#a1a1aa` (slate-400) | `--surface-1` (`#0c0c12`) | **6.7:1** | 7.0:1 | ❌ FAIL | `#d4d4d8` (zinc-300) | **11.1:1** |
| `--muted-foreground` | `#a1a1aa` (slate-400) | `--surface-2` (`#12121a`) | **6.54:1** | 7.0:1 | ❌ FAIL | `#d4d4d8` (zinc-300) | **10.8:1** |
| `--muted-foreground` | `#a1a1aa` (slate-400) | `--surface-3` (`#1a1a24`) | **6.1:1** | 7.0:1 | ❌ FAIL | `#cbd5e1` (slate-300) | **10.2:1** |
| `--accent-foreground` | `#818cf8` (indigo-400) | `--background` (`#06060a`) | **6.6:1** | 7.0:1 | ❌ FAIL | `#a5b4fc` (indigo-300) | **8.6:1** |
| `--destructive` | `#ef4444` (red-500) | `--background` (`#06060a`) | **5.09:1** | 7.0:1 | ❌ FAIL | `#fca5a5` (red-300) | **8.4:1** |
| `--warning` | `#f59e0b` (amber-500) | `--surface-3` (`#1a1a24`) | **6.5:1** | 7.0:1 | ❌ FAIL | `#fcd34d` (amber-300) | **10.5:1** |
| `--color-primary` (StatCard icon text) | `#4f46e5` (indigo-600) | `--surface-1` (`#0c0c12`) | **2.2:1** | 7.0:1 | ❌ FAIL | `#a5b4fc` (indigo-300) | **8.6:1** |

---

### 1.2 Component & Page Specific Contrast Findings

#### A. Component Primitives (`src/components/ui/`)
1. **`src/components/ui/badge.tsx`**
   - **Line 43 (`variant="info"`):** Uses `text-indigo-400` (#818cf8) -> Contrast ratio **6.6:1** (FAILS 7:1).
     *Fix:* Change to `text-indigo-300` (#a5b4fc).
   - **Line 42 (`variant="danger"`):** Uses `text-destructive` (#ef4444) -> Contrast ratio **5.09:1** (FAILS 7:1).
     *Fix:* Change to `text-rose-300` (#fca5a5).
   - **Line 41 (`variant="warning"`):** Uses `text-warning` (#f59e0b) -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-amber-300` (#fcd34d).
   - **Line 38 & 44 (`variant="default"`, `variant="outline"`):** Uses `text-muted-foreground` (#a1a1aa) -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-zinc-300` (#d4d4d8).

2. **`src/components/ui/button.tsx`**
   - **Lines 46 & 48 (`variant="ghost"`, `variant="outline"`):** Uses `text-muted-foreground` (#a1a1aa) -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-zinc-300 hover:text-foreground`.

3. **`src/components/ui/input.tsx` & `command.tsx`**
   - **`input.tsx` Line 25:** `placeholder:text-muted-foreground/60` -> Opacity 60% of `#a1a1aa` on dark background creates contrast **< 3.5:1** (FAILS 7:1).
     *Fix:* Change to `placeholder:text-zinc-400`.
   - **`command.tsx` Line 76 & 99:** `placeholder:text-muted-foreground` & `CommandEmpty` -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-zinc-300`.

4. **`src/components/ui/stat-card.tsx`**
   - **Line 16 (`accentMap.primary.iconText`):** Uses `text-primary` (#4f46e5) -> Contrast ratio on dark card surface is **2.2:1** (SEVERE FAILURE).
     *Fix:* Change `iconText` to `text-indigo-300`.
   - **Line 31 (`accentMap.danger.iconText`):** Uses `text-destructive` (#ef4444) -> Contrast ratio **5.09:1** (FAILS 7:1).
     *Fix:* Change `iconText` to `text-rose-400`.
   - **Line 81 (`trend.positive ? ... : 'text-destructive'`):** Negative trend text uses `text-destructive` -> Contrast ratio **5.09:1** (FAILS 7:1).
     *Fix:* Change to `text-rose-300`.

5. **`src/components/ui/progress.tsx`**
   - **Lines 16 & 22 (`getProgressColor` & `getProgressBg`):** `text-destructive` (#ef4444) -> Contrast ratio **5.09:1** (FAILS 7:1).
     *Fix:* Use `text-rose-300` for low values (<75%).

6. **`src/components/attendance-calculator.tsx`**
   - **Line 56:** `text-green-500` -> Contrast ratio **6.5:1** on dark background (FAILS 7:1).
     *Fix:* Change to `text-emerald-400` (**9.2:1**).
   - **Line 57:** `text-yellow-500` -> Contrast ratio **6.8:1** (FAILS 7:1).
     *Fix:* Change to `text-amber-300` (**10.5:1**).
   - **Line 58 & 253:** `text-red-500` -> Contrast ratio **5.09:1** (FAILS 7:1).
     *Fix:* Change to `text-rose-300` (**8.4:1**).

#### B. Charts & Page Components (`src/app/dashboard/`)
1. **`src/app/dashboard/attendance/AttendanceChart.tsx`**
   - **Line 56 & SVG text lines 89, 138:** Uses `text-muted-foreground` and `fill-muted-foreground` (#a1a1aa) -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change text and SVG fills to `text-slate-300` / `fill-slate-300`.

2. **`src/app/dashboard/marks/GpaTrendChart.tsx`**
   - **Line 70:** Max score label uses `text-primary` (#4f46e5) -> Contrast ratio **2.2:1** (FAILS 7:1).
     *Fix:* Change to `text-indigo-300`.
   - **Lines 68, 106, 152:** Uses `text-muted-foreground` and `fill-muted-foreground` -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-zinc-300` / `fill-zinc-300`.

3. **`src/app/dashboard/fee/FeeBreakdownChart.tsx`**
   - **Lines 65, 114, 125, 132:** Uses `text-muted-foreground` -> Contrast ratio **6.5:1** (FAILS 7:1).
     *Fix:* Change to `text-slate-300`.

4. **`src/app/dashboard/exam-seating/page.tsx`**
   - **Lines 57, 68, 114, 123, 133, 140, 155:** `text-zinc-400` (**6.54:1**) and `text-zinc-500` (**4.6:1**) fail 7:1.
     *Fix:* Upgrade all to `text-zinc-300`.
   - **Lines 31, 171:** `text-indigo-400` (#818cf8) -> Contrast ratio **6.6:1** (FAILS 7:1).
     *Fix:* Upgrade to `text-indigo-300` (#a5b4fc).

5. **`src/app/dashboard/timetable/page.tsx`**
   - **Lines 177, 188, 213, 232, 259, 274, 309, 369:** Uses `text-zinc-400` (**6.54:1**) and `text-zinc-500` (**4.6:1**).
     *Fix:* Upgrade to `text-zinc-300`.

6. **`src/app/dashboard/tools/page.tsx`**
   - **Lines 144, 157, 208, 221:** Form section headers use `text-zinc-500` (#71717a) -> Contrast ratio **4.6:1** (FAILS 7:1).
     *Fix:* Change to `text-zinc-300`.

---

## 2. Target Size (Enhanced) Audit (WCAG 2.2 2.5.8 / 2.5.5 - Level AAA)

All interactive controls must have dimensions **≥ 44×44 CSS pixels**.

| Component / Page File | Line Number | Element Description | Current Dimension | AAA Required Dimension | Violation Type | Proposed Code Fix |
|---|---|---|---|---|---|---|
| `src/components/ui/select.tsx` | Line 17 | Select input dropdown | `min-h-[40px]` (40px) | `min-h-[44px]` (44px) | Target Height | Replace `min-h-[40px]` with `min-h-[44px]` |
| `src/components/ui/button.tsx` | Line 53 | Small button (`size="sm"`) | `min-h-[36px]` (36px) | `min-h-[44px]` (44px) | Target Height | Replace `min-h-[36px]` with `min-h-[44px] min-w-[44px] px-3.5 py-2.5` |
| `src/components/ui/dialog.tsx` | Line 112 | Dialog close button | 32×32px (`p-1.5` + 20px icon) | 44×44px | Target Size | Add `min-w-[44px] min-h-[44px] flex items-center justify-center` |
| `src/components/ai/AIChatSheet.tsx` | Lines 64, 75 | Header action buttons ("Clear chat", "Expand modal") | `min-w-[36px] min-h-[36px]` | 44×44px | Target Size | Replace `min-w-[36px] min-h-[36px]` with `min-w-[44px] min-h-[44px]` |
| `src/components/ai/AIChatDialog.tsx` | Lines 61, 72 | Header action buttons ("Clear chat", "Switch drawer") | `min-w-[36px] min-h-[36px]` | 44×44px | Target Size | Replace `min-w-[36px] min-h-[36px]` with `min-w-[44px] min-h-[44px]` |
| `src/components/ai/AIChatInput.tsx` | Line 65 | Chat Send query button | `w-9 h-9` (36×36px) | 44×44px | Target Size | Upgrade to `min-w-[44px] min-h-[44px] w-11 h-11` |
| `src/components/ai/AIChatSuggestionChips.tsx` | Line 57 | Quick query suggestion chips | 28px height (`py-1.5`) | 44px height | Target Height | Add `min-h-[44px] px-3.5 py-2.5 flex items-center` |
| `src/components/Navigation.tsx` | Line 292 | Desktop sidebar collapse toggle button | 28×28px (`p-1.5` + 16px icon) | 44×44px | Target Size | Add `min-w-[44px] min-h-[44px] flex items-center justify-center` |
| `src/components/Navigation.tsx` | Lines 318, 350 | Collapsed desktop nav items & sign-out button | 36px height (`py-2.5` collapsed) | 44px height | Target Height | Ensure `min-h-[44px]` in collapsed state |
| `src/components/Navigation.tsx` | Line 480 | Header profile user dropdown button | ~36px height (`p-1.5`) | 44px height | Target Height | Add `min-h-[44px] flex items-center` |
| `src/app/dashboard/page.tsx` | Line 292 | Schedule refresh button | 24×24px (`p-1` + 14px icon) | 44×44px | Target Size | Upgrade to `p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center` |
| `src/app/dashboard/page.tsx` | Line 309 | Day selector filter buttons | 24px height (`py-1`) | 44px height | Target Height | Upgrade to `px-3 py-2.5 min-h-[44px] flex items-center` |
| `src/app/dashboard/profile/page.tsx` | Lines 180-192 | Profile category sub-tab buttons | 32px height (`py-2`) | 44px height | Target Height | Add `min-h-[44px] px-4 py-2.5 flex items-center` |
| `src/app/dashboard/timetable/page.tsx` | Lines 172, 183 | View mode toggle buttons (Grid vs List) | 28px height (`py-1.5`) | 44px height | Target Height | Upgrade to `px-3 py-2.5 min-h-[44px] flex items-center` |
| `src/app/dashboard/timetable/page.tsx` | Lines 252-264 | Day filter tab buttons | 28px height (`py-1.5`) | 44px height | Target Height | Upgrade to `px-3.5 py-2.5 min-h-[44px] flex items-center` |
| `src/app/dashboard/timetable/page.tsx` | Lines 198, 217 | Year and Semester select dropdowns | 24px height (`py-1`) | 44px height | Target Height | Upgrade to `py-2.5 min-h-[44px]` |
| `src/app/dashboard/timetable/page.tsx` | Line 236 | Export CSV action button | 32px height (`py-2`) | 44px height | Target Height | Upgrade to `px-4 py-2.5 min-h-[44px] flex items-center` |
| `src/app/page.tsx` | Line 212 | Security Info modal trigger button | ~20px height | 44px height | Target Height | Add `min-h-[44px] min-w-[44px] inline-flex items-center` |

---

## 3. Accessible Names & ARIA Compliance Audit (WCAG 2.2 4.1.2 & 2.5.3 - Level AAA)

### 3.1 Unbound Form Inputs (`src/app/dashboard/tools/page.tsx`)
- **Observation:** In `tools/page.tsx`, 4 `<input>` controls are placed next to `<label>` text, but lack `id` attributes and the `<label>` elements lack `htmlFor` attributes:
  - Line 144: `<label>` "Total Classes" -> Input at line 147 has no `id`.
  - Line 157: `<label>` "Classes Attended" -> Input at line 160 has no `id`.
  - Line 208: `<label>` "Target CGPA Goal" -> Input at line 211 has no `id`.
  - Line 221: `<label>` "Upcoming Credits" -> Input at line 224 has no `id`.
- **Logic Chain:** Assistive technologies (screen readers) fail to announce the purpose of an input when it is not programmatically associated with its label via `id`/`htmlFor`.
- **Remediation:** Bind labels to inputs explicitly:
  ```tsx
  <label htmlFor="tools-total-classes" className="...">Total Classes</label>
  <input id="tools-total-classes" type="number" ... />
  ```

### 3.2 Non-Semantic Clickable Element (`src/components/Navigation.tsx`)
- **Observation:** Line 480 contains an interactive user profile trigger implemented as a `<div>`:
  ```tsx
  <div className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors">
    <ProfileAvatar user={user} />
    <span className="text-sm font-medium text-foreground hidden xl:block">{user.name}</span>
  </div>
  ```
- **Logic Chain:** A `<div>` with `cursor-pointer` is not keyboard accessible (cannot be focused via Tab or activated via Enter/Space) and has no accessible role or name.
- **Remediation:** Replace with a semantic `<button>` or add explicit button accessibility attributes:
  ```tsx
  <button
    type="button"
    aria-label="User profile options"
    className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1.5 pr-3 min-h-[44px] rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary"
  >
    <ProfileAvatar user={user} />
    <span className="text-sm font-medium text-foreground hidden xl:block">{user.name}</span>
  </button>
  ```

### 3.3 Missing `aria-label` on Icon Buttons
- **`src/app/dashboard/page.tsx` Line 292:** Refresh schedule button `<button onClick={loadSchedule}>` lacks `aria-label`.  
  *Remediation:* Add `aria-label="Refresh daily schedule"`.
- **`src/app/dashboard/timetable/page.tsx` Lines 198 & 217:** Academic year and semester dropdown `<select>` controls lack labels or ARIA attributes.  
  *Remediation:* Add `aria-label="Select Academic Year"` and `aria-label="Select Semester"`.

---

## 4. Step-by-Step Remediation Plan for Implementer

1. **Step 1: CSS Design Token Upgrade (`src/app/globals.css`)**
   - Update `--muted-foreground` to `#d4d4d8` (zinc-300).
   - Update `--accent-foreground` and `--ring` to `#a5b4fc` (indigo-300).
   - Update `--destructive` to `#fca5a5` (red-300).
   - Update `--warning` to `#fcd34d` (amber-300).

2. **Step 2: Component Primitives Sizing & Color Refactor (`src/components/ui/`)**
   - `select.tsx`: Change `min-h-[40px]` to `min-h-[44px]`.
   - `button.tsx`: Change `size="sm"` to `min-h-[44px] min-w-[44px] px-3.5 py-2.5`. Update `ghost` and `outline` text color to `text-zinc-300`.
   - `badge.tsx`: Update `info` to `text-indigo-300`, `danger` to `text-rose-300`, `warning` to `text-amber-300`.
   - `dialog.tsx` & `sheet.tsx`: Ensure all close buttons have `min-w-[44px] min-h-[44px]` and `DialogDescription`/`SheetDescription` use `text-zinc-300`.
   - `stat-card.tsx`: Update `primary` accent icon text to `text-indigo-300` and `danger` accent icon text to `text-rose-400`.

3. **Step 3: AI Copilot Widget Sizing & Labeling (`src/components/ai/`)**
   - `AIChatSheet.tsx` & `AIChatDialog.tsx`: Upgrade clear chat and view toggle buttons to `min-w-[44px] min-h-[44px]`.
   - `AIChatInput.tsx`: Upgrade Send button to `min-w-[44px] min-h-[44px] w-11 h-11`.
   - `AIChatSuggestionChips.tsx`: Add `min-h-[44px] py-2.5` to suggestion buttons.

4. **Step 4: Layout & Dashboard Pages Target Size & Contrast Overhaul**
   - `Navigation.tsx`: Fix collapse button (44×44px), collapsed item heights (44px), profile header button (44px), and muted text colors.
   - `dashboard/page.tsx`: Fix schedule refresh button (44×44px), day filter buttons (44px), and link contrast colors (`text-indigo-300`).
   - `dashboard/profile/page.tsx`: Fix category sub-tab buttons (`min-h-[44px] py-2.5`).
   - `dashboard/timetable/page.tsx`: Fix view toggle buttons, day filter tabs, select inputs, and export button to `min-h-[44px]`.
   - `dashboard/tools/page.tsx`: Add `htmlFor` / `id` bindings on all 4 input fields and update header text contrast to `text-zinc-300`.

---
