# Project: KL Sync Frontend Redesign

## Architecture
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5.8
- **Architecture**: Edge Proxy (Stateless, no DB). Session tokens encrypted with AES-256-GCM via Web Crypto API.
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens (`src/app/globals.css`).
- **Icon Engine**: 100% Native zero-runtime SVG library (`src/components/ui/icons.tsx` — 57 primitives).
- **Philosophy**: Ponytail (Zero UI/icon bloat; no `lucide-react`, `framer-motion`, `swr`, `clsx`, `tailwind-merge`).
- **Data Layer**: Custom `useNativeQuery` with in-memory L1 cache, `sessionStorage` L2 cache, and in-flight Promise deduplication.
- **Accessibility**: WCAG 2.2 AAA compliance across all screens (contrast >= 7.1:1, touch targets >= 44x44px, `:focus-visible` 3px rings, skip-navigation links, ARIA live regions).
- **i18n**: 9-language zero-dependency internationalization engine with real-time RTL layout switching (`dir="rtl"`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Zero-Bloat Foundation | Enforce Ponytail philosophy; zero external UI/icon dependencies (`lucide-react`, `framer-motion`, `swr`, `clsx`, `tailwind-merge` eliminated). | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Native SVG Icon Suite | 57 native SVG icon components with forwardRef in `src/components/ui/icons.tsx`. | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Fluid Motion Physics | Pure TypeScript Apple fluid motion (`project`, `rubberband`, `createVelocityTracker`, `triggerHaptic`). | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Specular Dark Design System | Tailwind v4 specular dark tokens, elevation surfaces 0-4, frosted glassmorphism, spring transitions. | M1 | ORIGINAL_REQUEST §R2 |
| 5 | WCAG 2.2 AAA Accessibility | Contrast >= 7.1:1 (foreground 18.7:1), touch targets >= 44px, `:focus-visible` rings, skip-links, ARIA live. | M2 | ORIGINAL_REQUEST §R3 |
| 6 | 9-Language i18n & RTL | 9 languages (`en`, `te`, `hi`, `es`, `fr`, `de`, `ar`, `zh`, `ru`) with real-time bidirectional layout switching. | M2 | ORIGINAL_REQUEST §R3 |
| 7 | Authentication & Login | Split-screen glass hero, OCR auto-solve, PoW challenge, ComplianceModal standard badges, prefetching. | M3 | ORIGINAL_REQUEST §R4 |
| 8 | Shell Navigation | Collapsible desktop sidebar (260px <-> 64px), top status bar with profile avatar, mobile gesture dock. | M3 | ORIGINAL_REQUEST §R4 |
| 9 | 11 Dashboard Module Routes | Overview, Attendance (LTPS rollup, bunk forecast, SVG chart), Timetable (matrix grid), Marks & CGPA (SVG trend chart), Profile, Fee Management (SVG donut), Tools (calculators), Circulars, Hostels, Library, Exam Seating. | M3 | ORIGINAL_REQUEST §R4 |
| 10 | AI Copilot Integration | Floating trigger, `Cmd+K` / `Ctrl+Shift+A` shortcuts, gesture drawer sheet, Zod-validated tool execution. | M4 | ORIGINAL_REQUEST §R5 |
| 11 | Interactive Execution Cards | 4 interactive execution cards for Attendance target, Fee balance, CGPA goal predictor, and timetable queries. | M4 | ORIGINAL_REQUEST §R5 |
| 12 | 100% E2E Test Pass & Adversarial Hardening | 4-Tier opaque-box test suite (Tiers 1-4) + Tier 5 white-box adversarial stress tests + 9/9 Agent-as-Judge. | M5 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Foundation, Primitives & Fluid Motion (M1) | `src/components/ui/`, `src/lib/fluid-motion.ts`, `src/app/globals.css`, icons, tokens | none | DONE |
| 2 | Accessibility (WCAG AAA) & i18n RTL Engine (M2) | `src/lib/i18n/`, `src/components/ui/LanguageSelector.tsx`, WCAG contrast & touch targets | M1 | DONE |
| 3 | Authentication & 12 Dashboard Modules (M3) | `src/app/page.tsx`, `src/components/Navigation.tsx`, `src/app/dashboard/**` | M1, M2 | DONE |
| 4 | AI Copilot & Interactive Execution Cards (M4) | `src/components/ai/**`, `src/lib/ai/**`, `src/app/api/ai/chat/route.ts` | M1, M2, M3 | DONE |
| 5 | Dual Track E2E Acceptance & Adversarial Hardening (M5) | 4-Tier E2E Suites, Tier 5 Adversarial Stress, 9/9 Agent-as-Judge, Turbopack Build | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts
### `src/components/ui/icons.tsx` ↔ All Components
- Function signatures: `export const <IconName> = createIcon(...)` (React.ForwardRefExoticComponent<IconProps>)
- Props: `IconProps { size?: number | string; className?: string; strokeWidth?: number; ... }`

### `src/lib/fluid-motion.ts` ↔ UI Components
- `project(initialVelocity: number, decelerationRate?: number): number`
- `rubberband(overshoot: number, dimension: number, constant?: number): number`
- `triggerHaptic(type: 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): boolean`
- `createVelocityTracker(): { addSample(position: number): void; getVelocity(): number; reset(): void }`

### `src/lib/i18n/index.ts` ↔ UI Components
- `t(key: TranslationKey, params?: Record<string, string | number>): string`
- `getLocale(): SupportedLocale`
- `setLocale(locale: SupportedLocale): void`
- `getDirection(locale?: SupportedLocale): 'ltr' | 'rtl'`

### `src/hooks/useNativeQuery.ts` ↔ Dashboard Pages
- `useNativeQuery<T>(key: string, fetcher: () => Promise<T>, options?: QueryOptions<T>): QueryResult<T>`

### `src/lib/ai/tools.ts` & `executor.ts` ↔ AI Copilot UI
- `executeTool(toolName: string, args: Record<string, unknown>, sessionContext: SessionContext): Promise<ToolResult>`

## Code Layout
```
src/
├── app/
│   ├── api/
│   │   ├── ai/chat/route.ts
│   │   ├── captcha/route.ts
│   │   ├── erp-proxy/route.ts
│   │   ├── fetch-photo/route.ts
│   │   └── login/route.ts
│   ├── dashboard/
│   │   ├── attendance/
│   │   ├── circulars/
│   │   ├── exam-seating/
│   │   ├── fee/
│   │   ├── hostels/
│   │   ├── library/
│   │   ├── marks/
│   │   ├── overview/
│   │   ├── profile/
│   │   ├── timetable/
│   │   ├── tools/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ai/
│   │   ├── AIChatMessageList.tsx
│   │   ├── AIChatSheet.tsx
│   │   ├── AICopilot.tsx
│   │   └── ExecutionCards.tsx
│   ├── compliance/
│   │   └── ComplianceModal.tsx
│   ├── ui/
│   │   ├── icons.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   └── ...
│   ├── Captcha.tsx
│   └── Navigation.tsx
├── e2e/
│   ├── tier1-feature-coverage.test.ts
│   ├── tier2-boundary-corner-cases.test.ts
│   ├── tier3-cross-feature-combinations.test.ts
│   └── tier4-real-world-scenarios.test.ts
├── hooks/
│   ├── useAcademicSession.ts
│   ├── useAriaAnnounce.ts
│   └── useNativeQuery.ts
├── lib/
│   ├── ai/
│   ├── compliance/
│   ├── i18n/
│   ├── crypto.ts
│   ├── data-prefetcher.ts
│   └── fluid-motion.ts
└── types/
```
