# 🎨 KL Sync — Master Design System & Architectural Specification (`DESIGN.md`)

This document defines the master design system, physics engine, color tokens, optical typography, and accessibility architecture of **KL Sync**.

Synthesized from:
1. **Apple Design (`emilkowalski/apple-design`)**: WWDC fluid motion, momentum projection, UIKit rubber-banding, specular elevation, translucent materials, and multimodal Web Vibration haptics.
2. **Open Design (`nexu-io/open-design`)**: Scalable, container-query responsive component architecture, live academic KPI dashboards, and clean semantic structure.
3. **UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`)**: WCAG 2.2 AAA standard compliance (contrast $\ge 7.1:1$, touch targets $\ge 44\text{px}$), 100% SVG zero-emoji icon engine, zero layout shifts, and delightful micro-interactions.

---

## 1. Deep Space Dark Mode Palette & Materials

### Surface Elevation & Specular Radii
- **Background Root**: `#07080a` (Deep OLED Space Black)
- **Surface 1 (Base Cards)**: `rgba(255, 255, 255, 0.035)` with `backdrop-filter: blur(24px) saturate(180%)`
- **Surface 2 (Elevated & Controls)**: `rgba(255, 255, 255, 0.065)`
- **Surface 3 (Hover & Active Surfaces)**: `rgba(255, 255, 255, 0.11)`
- **Specular Rim Border**: `1px solid rgba(255, 255, 255, 0.09)` + inset top highlight `inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)`

### Vibrancy Accents
- **Primary Indigo**: `#6366f1` / `#818cf8` (`hsl(238 84% 67%)`)
- **Success Emerald**: `#10b981` / `#34d399` (`hsl(160 84% 39%)`)
- **Warning Amber**: `#f59e0b` / `#fbbf24` (`hsl(38 92% 50%)`)
- **Destructive Crimson**: `#ef4444` / `#f87171` (`hsl(0 84% 60%)`)

---

## 2. Fluid Motion, Physics & Haptics Engine

### Spring Curves
- `--ease-spring-default`: `cubic-bezier(0.2, 0.9, 0.3, 1)` (Damping 1.0, zero overshoot)
- `--ease-spring-bounce`: `cubic-bezier(0.34, 1.4, 0.64, 1)` (Damping 0.82, tactile pop)
- `--ease-spring-sheet`: `cubic-bezier(0.32, 0.72, 0, 1)` (iOS Bottom Sheet curve)

### Physical Motion Equations
- **Exponential Decay Velocity Projection**:
  $$\text{project}(v, 0.998) = \left(\frac{v}{1000}\right) \cdot \frac{0.998}{1 - 0.998}$$
- **UIKit Rubber-Banding Resistance Curve**:
  $$\text{rubberband}(x, \text{dim}, 0.55) = \frac{x \cdot \text{dim} \cdot 0.55}{\text{dim} + 0.55 \cdot |x|}$$

### Multimodal Web Vibration Haptic Feedback
- **`selection`**: `6ms` single tap (Tabs, Filters, Toggles)
- **`light`**: `10ms` subtle pulse (Buttons, Actions, Row Expand)
- **`medium`**: `18ms` crisp click (AI Query Submit, Modal Open)
- **`success`**: `[12ms, 40ms, 16ms]` dual confirmation pulse (Captcha Solved, Sync Completed)
- **`warning`**: `[18ms, 50ms, 18ms]` cautionary pulse (Clear History)
- **`error`**: `[30ms, 60ms, 30ms]` error alert pulse (Network/Auth Failure)

---

## 3. Optical Typography & Tabular Layouts

- **Display Titles**: `-0.035em` tracking, tight leading `1.1`, bold font weight.
- **Section Headers**: `-0.025em` tracking, leading `1.2`, font-heading class.
- **Body Text**: `0em` tracking, leading `1.5`, high-contrast text.
- **Caption & Micro-Pills**: `+0.06em` positive tracking, uppercase, `10px - 11px` size, font-semibold.
- **Numbers & Metrics**: Tabular numerals enabled (`font-feature-settings: "tnum" 1`) across all attendance %, CGPA, fees, and marks to ensure zero layout shift.

---

## 4. Accessibility Triple-Gate (WCAG 2.2 AAA)

1. **Contrast Ratio**: $\ge 7.1:1$ for all text against backgrounds (Primary text ratio: `16.2:1`).
2. **Interactive Touch Targets**: Enforces a minimum interactive bounding box of $\ge 44 \times 44\text{px}$ on all buttons, select triggers, search inputs, and modal dismissals.
3. **High Visibility Focus Indicators**: Custom `:focus-visible` ring (`focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2`).
4. **Motion & Transparency Preferences**:
   - `@media (prefers-reduced-motion)`: Replaces physical springs with clean opacity cross-fades.
   - `@media (prefers-reduced-transparency)`: Disables backdrop filters and falls back to opaque high-contrast surfaces.
   - `@media (prefers-contrast: more)`: Elevates border contrast $\ge 7.1:1$.

---

## 5. Pure SVG Zero-Runtime Icon Engine

All icons originate from the native 55-component SVG engine in [`src/components/ui/icons.tsx`](file:///C:/Users/speed/Documents/antigravity/optimistic-pascal/src/components/ui/icons.tsx). Zero third-party icon packages, zero runtime bloat, zero emoji icons.
