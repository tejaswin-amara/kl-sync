# M2 Design System, Tokens & UI Primitives Architecture & Implementation Analysis

**Author:** M2 Design Tokens & UI Primitives Explorer  
**Date:** 2026-08-07  
**Working Directory:** `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m2_1`  
**Milestone:** M2 (UI/UX, Accessibility & Mobile Overhaul)

---

## Executive Summary

This document presents a comprehensive, read-only architectural investigation and implementation plan for **Milestone 2 (M2)** of KL Sync. The scope covers:
1. Expanding design tokens, surface hierarchy, glassmorphism utilities, and accessibility standards in `src/app/globals.css`.
2. Enhancing existing primitives (`badge.tsx` and `skeleton.tsx`).
3. Designing and specifying 6 new shadcn-style component primitives: Tooltip (`tooltip.tsx`), Toast/Notification system (`toast.tsx`, `use-toast.ts`), Sheet/Drawer (`sheet.tsx`), Command Palette (`command.tsx`), Skeleton (`skeleton.tsx`), and Status Badge (`badge.tsx`).

All primitives are designed without external heavy dependencies (such as `@radix-ui/*` or `cmdk`), relying on standard React 19 hooks, HTML5 ARIA attributes, Tailwind CSS v4 inline theme variables, and `clsx` / `tailwind-merge` (`cn()` utility). This ensures instant SSR execution, zero bundle bloat, and seamless verification with Node's native test runner (`npx tsx --test src/components/ui/primitives.test.ts`).

---

## Section 1: Inspection Findings — `globals.css` & Design System Tokens

### 1.1 Current CSS Token & Style Setup
Inspection of `src/app/globals.css` (362 lines) reveals:
- **Tailwind CSS Integration:** `@import "tailwindcss";` using Tailwind CSS v4 (`@theme inline`).
- **Color Variables:** Dark mode palette with root variables (`--background: #06060a`, `--foreground: #f4f4f5`, `--primary: #6366f1`, `--secondary: #1a1a24`, `--muted: #1a1a24`, `--accent: rgba(99,102,241,0.12)`, `--destructive: #ef4444`, `--border: rgba(255,255,255,0.08)`, `--ring: #818cf8`).
- **Surface Hierarchy:** Currently defines 4 surface levels:
  - `--surface-0`: `#06060a` (Base app background)
  - `--surface-1`: `#0c0c12` (Cards & containers)
  - `--surface-2`: `#12121a` (Elevated cards & popovers)
  - `--surface-3`: `#1a1a24` (Hover states & active elements)
- **Glassmorphic Classes:** Basic `.glass` (80% opacity, 16px blur) and `.glass-subtle` (50% opacity, 8px blur).
- **Animations:** `@keyframes shimmer`, `fade-in`, `pulse-glow`, `slide-up`, `slide-down`, `scale-in`, `spin`.
- **Accessibility:** Basic `:focus-visible` ring and `.skip-nav` link.

### 1.2 Identified Token & Utility Gaps
1. **Surface Hierarchy Gaps:** Missing `--surface-4` (modal/flyout surfaces), `--surface-overlay` (dimming backdrops), `--surface-hover` (`rgba(255,255,255,0.04)`), and `--surface-active` (`rgba(255,255,255,0.08)`).
2. **Glassmorphism Utility Gaps:** Missing specialized glass classes needed for M2 components:
   - `.glass-panel`: Backdrop blur 20px, subtle gradient border, high elevation for Sheets & Dialogs.
   - `.glass-card`: Backdrop blur 12px with subtle inner glow for dashboard cards.
   - `.glass-modal`: Backdrop blur 24px with dark 85% opacity overlay for modals & Command Palette.
   - `.glass-input`: Backdrop blur 8px, focused border transition for search inputs & command items.
   - `.glass-header`: Sticky backdrop blur header styling with bottom border.
3. **Glow & Shadow Token Gaps:** Missing glow shadows for status states (`--shadow-glow-warning`, `--shadow-glow-error`, `--shadow-glow-info`).
4. **WCAG 2.2 Accessibility Token Gaps:**
   - Touch targets require strict minimum bounds (`44px x 44px` on mobile/touch viewports).
   - High-contrast focus rings (`outline-2 outline-offset-2`).
   - Media query for reduced motion (`@media (prefers-reduced-motion: reduce)` to disable non-essential animations).

---

## Section 2: Inspection Findings — Existing UI Primitives Audit

Inspection of `src/components/ui/` (12 files) reveals:

| Component | Current State | M2 Requirement / Expansion Gap |
|---|---|---|
| `badge.tsx` | Basic implementation with `variant` (`default`, `success`, `warning`, `danger`, `info`, `outline`, `emerald`) & `dot` | Needs explicit ERP status variants (`present`, `absent`, `warning`, `danger`, `info`, `success`, `pending`, `neutral`, `glass`), size scale (`sm`, `md`, `lg`), live pulse animation for dots (`pulse`), and icon support. |
| `skeleton.tsx` | Simple div with `bg-surface-2 shimmer` & basic variants (`default`, `circle`, `text`) | Needs expanded variant types (`avatar`, `card`, `table-row`), animation selector (`shimmer`, `pulse`, `none`), and pre-built composite loaders (`SkeletonCard`, `SkeletonTableRow`, `SkeletonStatGrid`). |
| `button.tsx` | Full-featured button with sizes (`default`, `sm`, `lg`, `icon`), variants, and `min-h-[44px]` touch target | Fully operational; supports all upcoming primitives. |
| `card.tsx` | Compound component (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) | Fully operational; fits surface hierarchy. |
| `dialog.tsx` | Accessible modal dialog with `DialogContext`, trigger, overlay, keyboard Escape handler | Serves as blueprint for `sheet.tsx` and `command.tsx`. |
| `input.tsx` | Accessible text input with `leftIcon`, `rightIcon`, error state, and touch target | Fully operational. |
| `select.tsx` | Native styled select dropdown | Fully operational. |
| `progress.tsx` | Animated progress bar with percentage indicator | Fully operational. |

---

## Section 3: Detailed Implementation Plan — Design Token & CSS Utility Expansion

### 3.1 Proposed Additions to `src/app/globals.css`

#### 1. Surface & Color Token Expansion (`@theme inline` and `:root`)
```css
:root {
  /* Extended Surface Layers */
  --surface-0: #06060a;
  --surface-1: #0c0c12;
  --surface-2: #12121a;
  --surface-3: #1a1a24;
  --surface-4: #222230;
  --surface-overlay: rgba(4, 4, 8, 0.75);
  --surface-hover: rgba(255, 255, 255, 0.05);
  --surface-active: rgba(255, 255, 255, 0.09);

  /* Status Tokens */
  --color-present: #10b981;
  --color-absent: #ef4444;
  --color-pending: #f59e0b;
  --color-neutral: #6b7280;

  /* Glow Shadows */
  --shadow-glow-primary: 0 0 20px rgba(99, 102, 241, 0.25);
  --shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.25);
  --shadow-glow-warning: 0 0 20px rgba(245, 158, 11, 0.25);
  --shadow-glow-error: 0 0 20px rgba(239, 68, 68, 0.25);
  --shadow-glow-info: 0 0 20px rgba(99, 102, 241, 0.25);
}
```

#### 2. Advanced Glassmorphism Utilities
```css
/* Glass Panels & Surfaces */
.glass-panel {
  background: rgba(12, 12, 18, 0.85);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.5);
}

.glass-card {
  background: linear-gradient(135deg, rgba(18, 18, 26, 0.75) 0%, rgba(12, 12, 18, 0.85) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-modal {
  background: rgba(8, 8, 14, 0.92);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.7);
}

.glass-input {
  background: rgba(18, 18, 26, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all var(--duration-normal) var(--ease-out);
}
.glass-input:focus-within,
.glass-input:focus {
  border-color: var(--ring);
  background: rgba(18, 18, 26, 0.85);
}

.glass-header {
  background: rgba(6, 6, 10, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

#### 3. Entrance & Slide Keyframes for Sheet and Toast
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-bottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-in-top {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-slide-in-right { animation: slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-slide-in-left { animation: slide-in-left 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-slide-in-bottom { animation: slide-in-bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-slide-in-top { animation: slide-in-top 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

#### 4. WCAG Accessibility Rules & Touch Bounds
```css
/* Touch target accessibility for mobile & interactive elements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Section 4: Detailed Implementation Plan — 6 Core UI Component Primitives

Below are the exact component signatures, hook APIs, and subcomponent architecture for the 6 target primitives in `src/components/ui/`.

---

### 4.1 Tooltip (`src/components/ui/tooltip.tsx`)

#### Purpose
Renders accessible hover/focus hints for icon buttons, table cells, and truncated text.

#### Component Architecture & API Surface
- `TooltipProvider`: Global context container supplying default delay (`delayDuration` = 200ms).
- `Tooltip`: State container (`open`, `defaultOpen`, `onOpenChange`).
- `TooltipTrigger`: Interactive element triggering tooltip visibility on `mouseenter`, `mouseleave`, `focus`, `blur`.
- `TooltipContent`: Floating popover container supporting `side` (`top` | `bottom` | `left` | `right`), `align` (`start` | `center` | `end`), `sideOffset` (default `6px`), `arrow` (boolean).

#### Signature Definition
```tsx
export interface TooltipProviderProps {
  delayDuration?: number;
  children: React.ReactNode;
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children: React.ReactNode;
}

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  arrow?: boolean;
}
```

#### Accessibility Features
- `role="tooltip"` on `TooltipContent`.
- Dynamic `aria-describedby` linking trigger to content ID.
- Escape key listener to dismiss active tooltips.
- Triggers are accessible via keyboard focus (`Tab`).

#### Unit Test Specification (`primitives.test.ts`)
1. Renders `TooltipTrigger` children cleanly.
2. Renders `TooltipContent` with `role="tooltip"` when open is true.
3. Applies correct positioning classes (`side="top"`, `side="bottom"`, etc.) and glassmorphism styling (`glass-panel`).

---

### 4.2 Toast / Notification System (`src/components/ui/toast.tsx` & `src/hooks/use-toast.ts`)

#### Purpose
Global notification dispatch system for success messages, error alerts, CAPTCHA hints, and network state changes.

#### State Engine Architecture (`use-toast.ts`)
- Custom event dispatcher / observer pattern with single global state array.
- Toast object structure:
  ```ts
  export interface Toast {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
    action?: React.ReactNode;
    duration?: number; // Default 5000ms
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  ```
- Public API export:
  - `toast({ title, description, variant, action, duration })` -> returns `{ id, dismiss, update }`.
  - `useToast()` hook returning `{ toasts, toast, dismiss }`.

#### Component Architecture (`toast.tsx`)
- `ToastProvider`: Wrap root layout (`src/app/layout.tsx`).
- `ToastViewport`: Fixed container positioned at top-right or bottom-right (`fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-[420px] w-full p-4 pointer-events-none`).
- `Toast`: Toast card container with `variant` styling:
  - `default`: `bg-surface-2/95 text-foreground border-border`
  - `success`: `bg-success/15 text-foreground border-success/30`
  - `warning`: `bg-warning/15 text-foreground border-warning/30`
  - `destructive`: `bg-destructive/15 text-foreground border-destructive/30`
  - `info`: `bg-primary/15 text-foreground border-primary/30`
- `ToastTitle`: `text-sm font-semibold`
- `ToastDescription`: `text-xs text-muted-foreground`
- `ToastClose`: `p-1 rounded-md text-muted-foreground hover:text-foreground`
- `ToastAction`: Custom action button (e.g. "Retry", "View Details")
- `Toaster`: Ready-to-use component that reads `useToast()` state and maps active toasts to `Toast` components.

#### Accessibility Features
- Container `ToastViewport` uses `aria-live="polite"` (or `aria-live="assertive"` for destructive toasts).
- Individual toasts use `role="status"` or `role="alert"`.
- Auto-dismiss pause on hover/focus.

#### Unit Test Specification (`primitives.test.ts`)
1. Verifies `toast()` helper dispatches toast items to subscribers.
2. Verifies `Toast` component renders title, description, and variant color border.
3. Verifies `Toaster` component renders active toasts with close button.

---

### 4.3 Sheet / Drawer (`src/components/ui/sheet.tsx`)

#### Purpose
Slide-over side panels for mobile menu navigation, profile drawers, attendance details, and AI Copilot sidebar drawer.

#### Component Architecture & API Surface
- `Sheet`: Context wrapper controlling `open` state.
- `SheetTrigger`: Button triggering sheet open.
- `SheetContent`: Slide-over container with `side` option:
  - `right` (default): `inset-y-0 right-0 h-full w-full sm:max-w-sm animate-slide-in-right`
  - `left`: `inset-y-0 left-0 h-full w-full sm:max-w-sm animate-slide-in-left`
  - `top`: `inset-x-0 top-0 w-full max-h-[80vh] animate-slide-in-top`
  - `bottom`: `inset-x-0 bottom-0 w-full max-h-[80vh] rounded-t-2xl animate-slide-in-bottom`
- `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`.

#### Signature Definition
```tsx
export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  overlay?: boolean;
}
```

#### Accessibility Features
- Focus trap and scroll lock on `document.body` when open.
- Keydown listener for `Escape` key to close.
- Overlay click handler to close.
- `role="dialog"` and `aria-modal="true"`.

#### Unit Test Specification (`primitives.test.ts`)
1. Throws error if `useSheet` is used outside `Sheet`.
2. Does not render content when `open=false`.
3. Renders overlay, close button, `role="dialog"`, and `side="right"` container when `open=true`.

---

### 4.4 Command Palette (`src/components/ui/command.tsx`)

#### Purpose
Global quick search (`Cmd+K` / `Ctrl+K`) for jumping to dashboard pages (Attendance, Timetable, Marks, Fee, etc.), searching ERP features, and triggering AI Copilot shortcuts.

#### Component Architecture & API Surface
- `Command`: Context wrapper holding search query state and keyboard index focus.
- `CommandDialog`: Modal dialog container with glass backdrop blur and `Cmd+K` keyboard shortcut listener.
- `CommandInput`: Search bar with search icon (`🔍`), placeholder, clear button, and autofocus.
- `CommandList`: Scrollable list wrapper (`max-h-[300px] overflow-y-auto p-2`).
- `CommandEmpty`: Component shown when no search results match query (`text-center py-6 text-xs text-muted-foreground`).
- `CommandGroup`: Category grouping header (e.g. "Navigation", "Calculators", "Actions").
- `CommandItem`: Individual selectable list item with hover/keyboard highlight (`aria-selected="true"` styling).
- `CommandShortcut`: Keyboard hint badge (e.g. `⌘A`, `Ctrl+T`).
- `CommandSeparator`: Divider line (`h-px bg-border my-1`).

#### Signature Definition
```tsx
export interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  placeholder?: string;
}

export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  onSelect?: () => void;
  keywords?: string[];
}
```

#### Keyboard & Filter Mechanics
- Internal state filters items based on `CommandInput` value matching item text content or `keywords`.
- Keydown listeners:
  - `ArrowDown`: Moves selection focus to next visible `CommandItem`.
  - `ArrowUp`: Moves selection focus to previous visible `CommandItem`.
  - `Enter`: Triggers `onSelect` callback of currently selected item.
  - `Escape`: Closes `CommandDialog`.

#### Unit Test Specification (`primitives.test.ts`)
1. Renders `CommandInput`, `CommandList`, `CommandGroup`, and `CommandItem` when open.
2. Filters items based on input value matching.
3. Renders `CommandShortcut` badge with correct text content.

---

### 4.5 Skeleton (`src/components/ui/skeleton.tsx`)

#### Purpose
Refactoring existing basic `skeleton.tsx` into a feature-complete loading state primitive for dashboard cards, stats, and mobile table card fallbacks.

#### Enhanced Variant & Animation API
```tsx
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'text' | 'avatar' | 'card' | 'table-row';
  animation?: 'shimmer' | 'pulse' | 'none';
}
```

#### Preset Composite Components
1. `SkeletonCard`: Pre-structured loading card with header line, body paragraph lines, and stat badge placeholder.
2. `SkeletonTableRow`: Pre-structured table row placeholder with 4 column blocks.
3. `SkeletonStatGrid`: Grid of 4 stat card skeleton loaders.

#### Implementation Details
- Base styling: `bg-surface-2/80 rounded-[--radius-md]`
- Variants:
  - `circle` / `avatar`: `rounded-full shrink-0`
  - `text`: `h-4 w-3/4 rounded-[--radius-sm]`
  - `card`: `h-32 w-full rounded-[--radius-lg]`
  - `table-row`: `h-12 w-full rounded-[--radius-md]`
- Animations:
  - `shimmer` (default): Uses `.shimmer` CSS class.
  - `pulse`: Uses `animate-pulse`.

#### Unit Test Specification (`primitives.test.ts`)
1. Renders default shimmer skeleton.
2. Renders `variant="circle"`, `variant="avatar"`, `variant="text"`.
3. Renders composite `SkeletonCard` and `SkeletonTableRow`.

---

### 4.6 Status Badge (`src/components/ui/badge.tsx`)

#### Purpose
Refactoring `badge.tsx` to provide comprehensive status indicators across ERP modules (Attendance status: Present/Absent; Fee status: Paid/Pending/Overdue; Marks grade status; AI tool status).

#### Enhanced API Surface
```tsx
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'emerald'
    | 'present'
    | 'absent'
    | 'pending'
    | 'neutral'
    | 'glass';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}
```

#### Mapping & Class Rules
- `size="sm"`: `text-[10px] px-2 py-0.5 gap-1`
- `size="md"` (default): `text-[11px] px-2.5 py-1 gap-1.5`
- `size="lg"`: `text-xs px-3 py-1.5 gap-2`
- `variant="present"`: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
- `variant="absent"`: `bg-rose-500/10 text-rose-400 border-rose-500/20`
- `variant="pending"`: `bg-amber-500/10 text-amber-400 border-amber-500/20`
- `variant="neutral"`: `bg-zinc-500/10 text-zinc-400 border-zinc-500/20`
- `variant="glass"`: `.glass text-foreground border-white/10`
- `dot`: Indicator circle (`w-1.5 h-1.5 rounded-full shrink-0`)
- `pulse`: Indicator circle includes `animate-ping` backdrop or `animate-pulse`.

#### Unit Test Specification (`primitives.test.ts`)
1. Renders default badge with font/tracking styles.
2. Renders status variants (`present`, `absent`, `pending`, `neutral`, `glass`).
3. Supports sizes (`sm`, `md`, `lg`).
4. Renders dot with pulse animation when `dot=true` and `pulse=true`.

---

## Section 5: Verification & Quality Assurance Strategy

### 5.1 Static Analysis & Build Pipeline
- `npx tsc --noEmit`: Confirms 0 TypeScript type errors across all newly defined primitives and props.
- `npm run lint`: Verifies 0 ESLint warnings or errors.
- `npm run build`: Confirms Next.js 16 App Router build completes cleanly with SSR compilation.

### 5.2 Native Unit Test Runner
- All component primitives will be verified in `src/components/ui/primitives.test.ts` using `node:test`, `node:assert/strict`, and `renderToString` from `react-dom/server`.
- Test command: `npx tsx --test src/components/ui/primitives.test.ts` (also included in `npm run test`).

---

## Summary of Implementation Deliverables (for Implementer Agent)

1. **`src/app/globals.css` Expansion**: Add surface levels `--surface-4`, `--surface-overlay`, glass classes (`.glass-panel`, `.glass-card`, `.glass-modal`, `.glass-input`, `.glass-header`), slide keyframes, and WCAG touch target utilities.
2. **`src/components/ui/tooltip.tsx`**: Create Tooltip primitive system.
3. **`src/hooks/use-toast.ts` & `src/components/ui/toast.tsx`**: Create Toast state engine and Toaster notification primitives.
4. **`src/components/ui/sheet.tsx`**: Create slide-over Sheet/Drawer primitive.
5. **`src/components/ui/command.tsx`**: Create Command Palette dialog & list primitives.
6. **`src/components/ui/skeleton.tsx`**: Refactor and expand Skeleton loaders & composite cards.
7. **`src/components/ui/badge.tsx`**: Refactor and expand Status Badge with ERP status variants and sizes.
8. **`src/components/ui/primitives.test.ts`**: Expand unit tests for 100% coverage of all UI primitives.
