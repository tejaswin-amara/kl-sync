# Project: KL Sync Frontend Redesign

## Architecture
KL Sync is a high-performance, dark-themed, responsive web application built with Next.js 16 (App Router), React 19, TailwindCSS v4, and Lucide React icons. It serves as an edge proxy for KL University's legacy ERP system.

### Data Flow & Component Hierarchy
- **Entry & Auth Flow**: `src/app/page.tsx` (Landing & Login) -> `/api/captcha` & `/api/captcha/redeem` (Cap CAPTCHA PoW & ERP OCR captcha) -> `/api/login` (ERP session & device registration) -> Session stored in encrypted cookie & `sessionStorage`.
- **Navigation Shell**: `src/app/dashboard/layout.tsx` -> `src/components/Navigation.tsx` (Responsive Desktop Sidebar & Mobile Drawer) -> Sub-routes (`src/app/dashboard/*`).
- **Core UI Primitives**: `src/components/ui/` (Button, Card, Input, Badge, Dialog/Modal, Tabs, Drawer/Sheet, Tooltip, Skeleton shimmer).
- **ERP Scraper Edge Proxy**: `/api/erp-proxy/[module]/route.ts` -> `src/lib/scrapers/*` (http-jar, attendance, timetable, marks, fee, profile).
- **Utility Calculators**: `src/lib/cgpa.ts`, `src/lib/fee-utils.ts`, `src/lib/timetable-parser.ts`, `src/components/attendance-calculator.tsx`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Landing Page & Sign-In Form | Asymmetric split branding + login form with remember credentials option | M2 | Survey 2 |
| 2 | Cap CAPTCHA Integration | Client-side PoW bot protection widget (`cap-widget`) with auto-solver | M2 | Survey 2 |
| 3 | ERP Image Captcha & Auto-OCR | ERP visual security code fetch with automated OCR.space solving | M2 | Survey 2 |
| 4 | ERP First-Time Device Registration | Handles device ID cookie registration for single-signon safety | M2 | Survey 2 |
| 5 | Responsive Layout & Drawer | Desktop fixed sidebar + mobile backdrop drawer with active route highlights | M1 | Survey 2 |
| 6 | Academic Session Hook | Custom hook managing academic year & semester selections across modules | M1 | Survey 2 |
| 7 | Overview Hero & Quick Stats | Live summary of CGPA, attendance %, pending fee total, and completed credits | M3 | Survey 2 |
| 8 | Today's Schedule Widget | Real-time daily timetable widget pre-enriched with course titles & faculty | M3 | Survey 2 |
| 9 | Attendance Data Grid | Real-time course attendance table with threshold-based color coding | M3 | Survey 2 |
| 10 | Class Projection Indicator | Calculates exact classes needed or safe to skip to hit 85%/75% policy | M3 | Survey 2 |
| 11 | Universal Timetable Parser | Auto-detects matrix or list timetable HTML formats and normalizes sessions | M3 | Survey 2 |
| 12 | Timetable View Modes | Toggleable Matrix Grid View (sticky day column) & List View with CSV export | M3 | Survey 2 |
| 13 | Marks & Grades Viewer | Displays internal assessment marks and semester grade cards with search | M3 | Survey 2 |
| 14 | CGPA & Weighted GPA Processor | Extracts official summary CGPA or computes weighted GPA from grade letters | M3 | Survey 2 |
| 15 | Fee Orders & Payment Status | Parses fee orders, normalizes currency, and classifies paid vs. pending balance | M3 | Survey 2 |
| 16 | Accounting Currency Parser | Handles currency symbols (₹,$), text (INR, Rs), commas, and accounting parens | M3 | Survey 2 |
| 17 | Profile Demographics & Multi-Tab | Parses student photo, university ID, and extracts sub-tab data tables | M4 | Survey 2 |
| 18 | Profile Photo Edge Proxy | Serves student profile images via `sharp` with edge cache control | M4 | Survey 2 |
| 19 | Official Circulars List | Fetches registrar office announcements and visibility lists | M4 | Survey 2 |
| 20 | Hostel Room Occupancy | Displays room allocation, block details, and occupancy status | M4 | Survey 2 |
| 21 | Library Circulation History | Displays book borrowing history, due dates, and return status | M4 | Survey 2 |
| 22 | Attendance Target Calculator | Pre-populated calculator evaluating classes to attend/miss for 75%/85% | M4 | Survey 2 |
| 23 | CGPA Goal Predictor | Calculates required GPA in upcoming credits to achieve target CGPA goal | M4 | Survey 2 |
| 24 | Exam Room & Seat Locator | Displays exam room allotments and seat numbers with highlight badges | M4 | Survey 2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System, UI Primitives & Responsive Layout Shell | `globals.css` theme tokens, glassmorphism utilities, micro-interactions, fonts cleanup, `src/components/ui/` primitives, responsive `Navigation.tsx` shell | None | DONE |
| M2 | Landing Page, Login Modal & Dual CAPTCHA Integration (R2) | `src/app/page.tsx` redesign, login modal/form, error alerts, status banners, Cap CAPTCHA PoW feedback, ERP image captcha auto-OCR refresh, device registration retry UX | M1 | PLANNED |
| M3 | Core Academic & Financial Dashboard Modules (Attendance, Timetable, Marks, Fee) | Overview Hero & Today's Schedule in `src/app/dashboard/page.tsx`, Attendance module, Timetable matrix grid & list views, Marks & Grades viewer, Fee payment & pending balance view | M1 | PLANNED |
| M4 | Student Services, Calculator Tools & Final Acceptance Verification | Profile page & photo proxy, Circulars, Hostels, Library, Exam Seating, Tools page (Attendance Target & CGPA Goal Predictor), full verification (`npm run build`, `npm run lint`, `npm run test` all 30 pass) | M1, M2, M3 | PLANNED |

## Interface Contracts
### UI Primitives Contract (`src/components/ui/`)
- Exported components: `Button`, `Card`, `Input`, `Badge`, `Dialog`, `Tabs`, `Sheet` (Mobile Drawer), `Skeleton`, `Tooltip`.
- All primitives must support Tailwind v4 class merging via `cn(...)` from `src/lib/utils.ts`.
- All interactive primitives must meet WCAG 2.2 touch target standards (`min-h-[44px]` for inputs and buttons) and display explicit focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-400`).

### Navigation Shell Contract (`src/components/Navigation.tsx`)
- Props: `{ children: React.ReactNode }`
- Responsive viewports: Mobile (<640px) uses top bar + slide-over drawer (`w-[280px]`); Desktop (>=1024px) uses fixed left sidebar (`w-[280px]`).
- Ultra-wide desktop (>=1536px): Content capped at `max-w-7xl mx-auto`.

### Dual Captcha Integration Contract (`src/components/Captcha.tsx`, `src/app/page.tsx`)
- Cap CAPTCHA: `<cap-widget>` invokes `onVerify(token: string)`.
- ERP Image Captcha: Automatically fetched from `/api/captcha`, solved via OCR, exposed with manual refresh capability.
- Error alerts: `bg-red-500/10 border-red-500/20 text-red-400` banner; Status alerts: `bg-blue-500/10 border-blue-500/20 text-blue-400` banner.

## Code Layout
- `src/app/globals.css`: Centralized design tokens, `@theme inline`, glassmorphic utilities (`.glass-panel`, `.glass-card`, `.glass-input`), micro-interaction animations.
- `src/app/layout.tsx`: Root layout with font configuration (clean Next.js font variables, no external `<link>`).
- `src/app/page.tsx`: Redesigned Landing Page & Login Modal Form.
- `src/components/ui/`: Modular UI component primitives.
- `src/components/Navigation.tsx`: Responsive navigation shell.
- `src/components/Captcha.tsx`: Dual CAPTCHA integration component.
- `src/components/attendance-calculator.tsx`: Attendance calculator component.
- `src/app/dashboard/`: Sub-routes for overview and all 10 modules.
