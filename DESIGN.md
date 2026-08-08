# 🎨 KL Sync - Design System & Brand Strategy (`DESIGN.md`)

## 1. Brand Identity & Aesthetic Style
* **Industry Context**: EdTech / University Student Portal / Productivity Dashboard.
* **Aesthetic Style**: **Dark Cyber Minimalist** (Human-engineered, native CSS, zero AI-bloat).
* **Design Philosophy**: High density, zero clutter, instant legibility, sub-millisecond perceived latency. Follows the "Ponytail" strictness: native standard solutions over bloated third-party dependencies.

---

## 2. Color Palette & Design Tokens

### Primary & Dark Mode Palette
- **Background Deep**: `#090d16` (Deep Obsidian / Midnight)
- **Card Background**: `rgba(15, 23, 42, 0.65)` (Glassmorphic Slate)
- **Primary Accent**: `#3b82f6` (Vibrant Blue - Actions, Active States)
- **Secondary Accent**: `#8b5cf6` (Electric Purple - Badges, Highlights)
- **Success / High Attendance**: `#10b981` (Emerald Green - ≥75% Attendance)
- **Warning / Medium Attendance**: `#f59e0b` (Amber - 65%-74% Attendance)
- **Danger / Low Attendance**: `#ef4444` (Crimson - <65% Attendance)

### Contrast Matrix (WCAG 2.2 AAA Compliance)
- Primary Text on Background (`#f8fafc` on `#090d16`): **16.2:1** (Exceeds 7:1 requirement for AAA)
- Secondary Text (`#cbd5e1` on `#090d16`): **10.4:1** (Exceeds 7:1 requirement for AAA)
- Muted Text (`#94a3b8` on `#090d16`): **7.1:1** (Meets 7:1 requirement for AAA)
- Focus Rings: `#38bdf8` (High visibility 2px ring with 2px offset, exceeds 3:1 area contrast)

---

## 3. Typography & Hierarchy
- **Font Family**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
- **Heading Hierarchy**:
  - `h1` (Dashboard Title): `text-2xl font-bold tracking-tight text-slate-100`
  - `h2` (Section Header): `text-lg font-semibold text-slate-200`
  - `h3` (Card Heading): `text-sm font-medium text-slate-400 uppercase tracking-wider`
- **Body & Metrics**:
  - Main Body: `text-sm text-slate-300`
  - Hero Metric Numbers: `text-3xl font-extrabold tracking-tight`

---

## 4. UI/UX Accessibility (WCAG 2.2 AAA) & Pre-Delivery Checklist
- [x] **Enhanced Color Contrast (1.4.6)**: All text elements have a minimum contrast ratio of **7.1:1** (normal text) and **4.5:1** (large text) against their backgrounds.
- [x] **Enhanced Target Size (2.5.5)**: All interactive inputs, buttons, icons, and tab triggers enforce a minimum touch target size of **44 × 44 px**.
- [x] **Focus Appearance (2.4.13)**: High-visibility focus indicators (`focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`).
- [x] **ARIA Live & Accessibility**: Screen-reader accessible tags on icon-only buttons, loading skeletons, and interactive charts via `aria-live` containers.
- [x] **Keyboard Traversal & Focus Traps**: Full tab order traversal without focus traps.

---

## 5. Visual Anti-Patterns Excluded (EdTech & Dashboard Specific)
1. ❌ **Generic Light Mode Grays**: Avoid dull `#f0f0f0` backgrounds that feel like legacy enterprise software.
2. ❌ **Data Density Overload**: Avoid displaying raw HTML tables without visual hierarchy, color coding, or progress indicators.
3. ❌ **Unresponsive Tables**: Avoid horizontal scrollbars without sticky header controls on mobile devices.
4. ❌ **Heavy Skeuomorphism & AI Aesthetics**: Avoid heavy drop shadows, intrusive 3D gradients, glowing blobs, Magic UI abstractions, or unnecessary `framer-motion` overhead; use strict, native solid Tailwind blocks.
