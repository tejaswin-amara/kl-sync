# Project: KL-Sync Frontend Elevation & Stress Verification

## Architecture
KL-Sync is an unofficial high-performance, minimalist ERP web client and edge proxy for KL University students.
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens (`globals.css`)
- **Icon Engine**: Zero-runtime native SVG library (`src/components/ui/icons.tsx` — 55 primitives)
- **Design Language**: Apple Human Interface Guidelines (OLED deep black, translucent chrome materials `blur(24px) saturate(180%)`, specular elevation `inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)`, fluid spring physics, active press scale(0.965), and Web Vibration haptics).
- **Accessibility**: WCAG 2.2 AAA standard (contrast ratios $\ge 7.1:1$, touch targets $\ge 44\text{px} \times 44\text{px}$, high-visibility focus rings).
- **Data Tables & Typography**: OpenType Tabular Numerals (`font-feature-settings: 'tnum' 1, 'ss01' 1`, `font-variant-numeric: tabular-nums`) and zero-layout-shift bounding boxes with skeleton loading states.

## Feature Inventory
Every feature from the Survey phase mapped to its assigned milestone:
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|:------:|
| 1 | Apple Spring Physics & Tokens | `--ease-spring-default`, `--ease-spring-sheet`, `--ease-spring-bounce`, `.touch-press` scale(0.965) | M1 | Survey 1 | DONE |
| 2 | Specular Rim Elevation & Translucent Materials | `.apple-card`, `.apple-chrome`, `.apple-sheet`, `.apple-modal`, `.apple-pill` with specular inset shadows | M1 | Survey 1 | DONE |
| 3 | Web Vibration Haptics Engine | Multimodal haptic feedback (`triggerHaptic`) with silent fallback across buttons, tabs, and sheet actions | M1 | Survey 1 | DONE |
| 4 | OpenType Tabular Numerals | `.tabular-numbers` with `tnum` 1 applied across all numeric metrics, badges, charts, and tables | M1 | Survey 2 | DONE |
| 5 | Zero-Layout-Shift Table Architecture | Fixed header heights, responsive skeleton rows (`h-12 w-full`), timetable matrix bounds (`min-w-[170px]`) | M1 | Survey 2 | DONE |
| 6 | Exam Seating Route Alignment | Polish `src/app/dashboard/exam-seating/page.tsx` with `PageHeader`, `apple-card`, `tabular-numbers`, `Skeleton`, `animate-spring-up` | M1 | Survey 1 & 2 | DONE |
| 7 | Zero-Bloat Native SVG Icon Engine | 55 pure SVG primitives in `src/components/ui/icons.tsx`, zero `lucide-react`, zero emojis as UI icons | M2 | Survey 3 | DONE |
| 8 | WCAG 2.2 AAA Accessibility | Contrast $\ge 7.1:1$, touch targets $\ge 44\text{px}$, `:focus-visible` rings, accessibility triple-gate | M2 | Survey 3 | DONE |
| 9 | Ponytail YAGNI Compliance | Standard library primitives, zero bloat, clean dependencies | M2 | Survey 3 | DONE |
| 10 | Quality Gate Verification | Pass `tsc --noEmit`, `npm run lint`, `npm test` (318/318), `agent-as-judge` (9/9), `npm run build` (15/15) | M2 | Survey 3 | DONE |
| 11 | Adversarial Stress & Forensic Integrity | Empirical verification via Challenger stress suites and Forensic Auditor verification | M3 | Project Pattern | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:------:|
| M1 | UI/UX Consistency & Exam-Seating Alignment | Refactor `src/app/dashboard/exam-seating/page.tsx` to match system-wide `apple-card`, `PageHeader`, `animate-spring-up`, `tabular-numbers`, `Skeleton` loading, and `triggerHaptic` | none | **DONE** |
| M2 | Comprehensive Quality Gate & Review Verification | Execute full suite of verification commands (tsc, lint, 318 tests, 9 agent-as-judge tests, build, icon stress, E2E browser tests) with 2 independent Reviewers and Challengers | M1 | **DONE** |
| M3 | Final Forensic Audit & Adversarial Verification | Forensic Auditor (`teamwork_preview_auditor`) integrity check + Challenger stress verification for zero-cheating and 100% compliance | M2 | **DONE** |

## Code Layout
```
src/
├── app/
│   ├── layout.tsx                      # Root layout, Inter & Outfit fonts
│   ├── globals.css                     # Semantic color tokens, Apple spring curves, materials, tabular-numbers
│   ├── page.tsx                        # Login route with CAPTCHA PoW and haptics
│   ├── api/                            # Edge proxy API endpoints
│   └── dashboard/                      # 11 ERP module routes
│       ├── page.tsx                    # Dashboard overview & schedule widget
│       ├── attendance/                 # Attendance module & circular/bar SVG charts
│       ├── timetable/                  # Timetable matrix & list views
│       ├── marks/                      # Marks module & spline GPA trend chart
│       ├── profile/                    # Profile module & scalar sub-tabs
│       ├── fee/                        # Fee module & donut chart
│       ├── tools/                      # Attendance calculator & CGPA predictor
│       ├── circulars/                  # Circulars ERP table page
│       ├── hostels/                    # Hostels ERP table page
│       ├── library/                    # Library ERP table page
│       └── exam-seating/               # Exam seating ERP table & mobile card view
├── components/
│   ├── Navigation.tsx                  # Global navigation bar & drawer
│   ├── ERPTablePage.tsx                # Reusable Apple-styled ERP table page
│   ├── ui/
│   │   ├── button.tsx                  # Apple tactile button with haptics & active scale
│   │   ├── stat-card.tsx               # Metric stat card with tabular numbers & specular depth
│   │   ├── progress.tsx                # Progress bar & circular ring
│   │   ├── skeleton.tsx                # Pulse skeleton placeholder
│   │   ├── sheet.tsx                   # Gesture drag sheet with fluid physics
│   │   ├── icons.tsx                   # 55 native pure SVG icon primitives
│   │   └── page-header.tsx             # Standardized module page header
│   └── ai/                             # AI Copilot components
├── lib/
│   ├── fluid-motion.ts                 # WWDC spring physics, project(), rubberband(), triggerHaptic()
│   ├── utils.ts                        # Zero-dependency cn helper
│   └── scrapers/                       # ERP scrapers
└── scripts/
    ├── agent-as-judge.ts               # AI Tool capability evaluation suite
    ├── challenger-icon-stress.ts       # Native SVG icon engine verification
    ├── challenger-browser-stress.ts    # Deep browser DOM & touch target audit
    ├── challenger-interaction-stress.ts# Fluid motion physics & layout shift audit
    └── e2e-browser-audit.ts            # Multi-route browser navigation audit
```

## Interface Contracts
### `PageHeader` (`src/components/ui/page-header.tsx`)
- Props: `icon: React.ComponentType<{ className?: string; size?: number }>`, `title: string`, `description: string`, `badge?: React.ReactNode`, `actions?: React.ReactNode`, `className?: string`
- Semantics: Renders standard module header with icon badge, title, subtitle, and responsive action slot.

### `ERPTablePage` (`src/components/ERPTablePage.tsx`)
- Props: `title: string`, `description: string`, `icon: React.ComponentType`, `columns: string[]`, `rows: (string | number)[][]`, `searchPlaceholder?: string`, `actions?: React.ReactNode`
- Features: Live search filter, CSV export, responsive table on desktop, expandable card list on mobile, `tabular-numbers`, skeleton loading state.

### `fluid-motion.ts` (`src/lib/fluid-motion.ts`)
- `triggerHaptic(type: 'light' | 'selection' | 'medium' | 'heavy' | 'success' | 'warning' | 'error')`: Triggers `navigator.vibrate` with silent fallback.
- `project(initialVelocity: number, decayRate = 0.998)`: Exponential decay displacement calculator.
- `rubberband(overshoot: number, dimension: number, constant = 0.55)`: UIKit rubberband resistance formula.
