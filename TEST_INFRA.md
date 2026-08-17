# E2E Test Infra: KL-Sync Frontend Elevation

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation internals.
- Verification methodology: Multi-tiered verification (Unit/Integration, AI Capabilities, Visual/Interaction, Accessibility, Build Compilation).

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|----------------------|:------:|:------:|:------:|:------:|
| 1 | Apple Spring Physics & Interaction | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| 2 | Specular Elevation & Translucent Chrome | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| 3 | Multimodal Web Vibration Haptics | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| 4 | OpenType Tabular Numerals (tnum 1) | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| 5 | Zero-Layout-Shift Table Bounding Boxes | ORIGINAL_REQUEST §R2 | ✓ | ✓ | ✓ | ✓ |
| 6 | 11 Dashboard Routes & Auth Polish | ORIGINAL_REQUEST §R1 | ✓ | ✓ | ✓ | ✓ |
| 7 | Pure Native SVG Icon Engine | AGENTS.md §Architecture | ✓ | ✓ | ✓ | ✓ |
| 8 | WCAG 2.2 AAA Accessibility | AGENTS.md §Architecture | ✓ | ✓ | ✓ | ✓ |
| 9 | Ponytail YAGNI Compliance | AGENTS.md §Architecture | ✓ | ✓ | ✓ | ✓ |
| 10 | Quality Gate Verification Commands | ORIGINAL_REQUEST §R3 | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- **Tier 1: Type & Syntax Gating**: `npx tsc --noEmit` (0 errors) & `npm run lint` (0 errors).
- **Tier 2: Unit & Integration Test Suite**: `npm test` (`npx tsx --test src/**/*.test.ts`) covering 318 tests across 53 suites (crypto, session encoding, scrapers, UI components, AI tools).
- **Tier 3: AI Tool Capabilities Suite**: `npx tsx scripts/agent-as-judge.ts` verifying 9 tool execution scenarios.
- **Tier 4: E2E Browser & Icon Stress Suites**:
  - `npx tsx scripts/challenger-icon-stress.ts` (13 icon and repo integrity checks).
  - `e2e/dashboard-routes.spec.ts` (12 dashboard route navigation and rendering tests).
- **Tier 5: Production Compilation**: `npm run build` (15 static & dynamic Next.js routes compiled via Turbopack).

## Acceptance Thresholds
- `npx tsc --noEmit`: Exit code 0 (0 errors)
- `npm run lint`: Exit code 0 (0 warnings, 0 errors)
- `npm test`: 318/318 passing across 53 suites
- `npx tsx scripts/agent-as-judge.ts`: 9/9 passing
- `npm run build`: Exit code 0 (15/15 routes)
- Forensic Integrity: 0 cheating, 0 hardcoding, genuine logic verified.
