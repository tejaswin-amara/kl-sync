# E2E Test Infra: KL Sync Frontend

## Test Philosophy
- Opaque-box, requirement-driven verification derived directly from `ORIGINAL_REQUEST.md`.
- Zero dependency on internal implementation design.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Tier Breakdown
| # | Feature | Requirement Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|-------------------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Zero-Bloat Foundation & 57 Native Icons | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Fluid Motion Physics & Multimodal Haptics | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 3 | Specular Dark Tokens & Glassmorphic Surfaces | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 4 | WCAG 2.2 AAA Accessibility | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 5 | 9-Language i18n & Real-Time RTL | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 6 | Login with OCR Auto-Solve & PoW Challenge | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 7 | Shell Navigation (Desktop Collapsible & Mobile Dock) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 8 | 11 Dashboard Module Routes | ORIGINAL_REQUEST §R4 | 11 | 11 | ✓ | ✓ |
| 9 | SVG Charts (Attendance, GPA Trend, Fee Donut) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 10 | AI Copilot Drawer & Shortcut Triggers | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 11 | Interactive Tool Execution Cards | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 12 | Edge Proxy Security & WebCrypto AES-GCM | AGENTS.md §2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Unit & Integration Test Runner**: `npx tsx --test src/**/*.test.ts` (328 tests across 54 suites)
- **4-Tier E2E Suites**:
  - `src/e2e/tier1-feature-coverage.test.ts` (16 tests)
  - `src/e2e/tier2-boundary-corner-cases.test.ts` (12 tests)
  - `src/e2e/tier3-cross-feature-combinations.test.ts` (6 tests)
  - `src/e2e/tier4-real-world-scenarios.test.ts` (4 tests)
- **Agent-as-Judge AI Evaluation**: `npx tsx scripts/agent-as-judge.ts` (9 tests)
- **Icon Engine Verification**: `npx tsx scripts/challenger-icon-stress.ts` (13 checks)
- **Pass/Fail Semantics**: All suites must pass with exit code 0, 0 failures, 0 errors.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Student Login, Prefetch, & Dashboard Navigation | Login, PoW, Prefetch, Shell, 11 Modules | High |
| 2 | Attendance Bunk Forecasting & Course Target Calculation | Attendance Scraper, LTPS Rollup, Calculator, AI Tool | High |
| 3 | Fee Payment Breakdown & Clearance Verification | Fee Scraper, SVG Donut, StatCards, AI Copilot | Medium |
| 4 | Multilingual Switching & Bidirectional RTL Layout | i18n Engine, LanguageSelector, RTL Layout, Navigation | High |

## Coverage Thresholds
- Tier 1: >=5 per feature area
- Tier 2: >=5 per feature area (edge values, zero values, overflow, malformed params)
- Tier 3: Pairwise coverage across major feature intersections
- Tier 4: >=4 realistic end-to-end user journeys
- Total: 328 unit/integration tests + 38 Tier 1-4 tests + 9 Agent-as-Judge tests = 375+ total automated checks.
