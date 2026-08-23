# Project: Awesome Dev Pipeline

## Architecture & System Overview
Awesome Dev Pipeline is a curated, production-ready, honestly-caveated developer tooling guide and AI agent operational reference repository with an automated markdown verification harness and GitHub Actions CI workflow.

```
├── .github/workflows/
│   ├── ci.yml                            # GitHub Actions CI matrix (offline + online link & license audit)
│   └── verify-links.yml                  # Dedicated matrix verification workflow
├── scripts/
│   └── verify-links.ts                   # Standalone zero-dependency TypeScript link, anchor, and license auditor
├── tests/
│   ├── verify-links.test.ts              # Unit test suite for verification script (slugifier, parser, assertions)
│   └── challenger-pipeline-adversarial.test.ts # Adversarial stress test suite
├── README.md                             # Comprehensive developer tools guide (Parts 1, 2, 3, Meta, Bonus)
├── CLAUDE.md                             # Operational condensed tabular quick-reference for AI coding agents
├── full-stack-dev-github-repos.md        # Deep architectural reference, trade-offs, and licensing rationale
├── CONTRIBUTING.md                       # Contribution standards, PR checklists, and licensing guidelines
└── LICENSE                               # MIT License
```

## Feature Inventory
Every feature from the Survey phase is enumerated below with its assigned milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Universal Developer Tooling (Part 1) | Terminal (Ghostty, Alacritty), Multiplexer (Tmux, Zellij), Shells (Zsh, Starship), Git/VCS (LazyGit, Jujutsu), Editors (VS Code, Neovim, Zed), Package Managers (pnpm, uv, Mise), Linters/Formatters (Biome, Ruff). | M1 | survey_1 |
| 2 | Full-Stack Web Pipeline (Part 2) | Frontend (Next.js, Astro, SvelteKit), Backend (Hono, Fastify, FastAPI), Database (PostgreSQL, SQLite, Turso, ClickHouse, DuckDB), ORM (Drizzle, Prisma, Kysely), Cache/Store (Valkey), Auth (Better Auth, Auth.js), API/RPC (tRPC, TanStack Query, Zod), Styling/UI (Tailwind v4, shadcn/ui, Radix, Lucide). | M1 | survey_1 |
| 3 | Situational Tools (Part 2 Situational) | Micro-frontends (Module Federation), WebSockets/Realtime (PartyKit, Socket.IO, LiveKit), Search/Vector (Meilisearch, Qdrant), File/Object Storage (Cloudflare R2, MinIO AGPLv3), Analytics/Telemetry (PostHog, Umami), Feature Flags (Unleash), Email (Resend, React Email). | M1 | survey_1 |
| 4 | Beyond a Web App (Part 3) | CLI Frameworks (Commander, Clap, Cobra, Ratatui, Bubbletea), Background Jobs/Workflows (BullMQ, Temporal, Trigger.dev, n8n), Cross-Platform (Expo, Flutter, Tauri, Electron), Data & ML (Polars, dbt), DevOps & Infra (Docker, Podman, K3s, OpenTofu, Pulumi, Coolify, Caddy, Sentry, OpenTelemetry). | M1 | survey_1 |
| 5 | Meta & Roadmap Decision Trees | Architecture Decision Trees (DB selection, Frontend framework selection, Cache selection, License risk triage matrix). | M1 | survey_1 |
| 6 | Bonus AI Agent Tooling & MCP Ecosystem | Coding Agents (Claude Code, Cursor, Aider, Roo Code, OpenHands), Agent Frameworks (LangGraph, LlamaIndex, DSPy, CrewAI), MCP Ecosystem (Model Context Protocol spec, FastMCP, official servers), Local LLM (Ollama, vLLM), LLM Observability (Langfuse, Promptfoo). | M1 | survey_1 |
| 7 | Repository Standards & MIT License | CONTRIBUTING.md (PR guidelines, tooling criteria, table schema rules) and LICENSE (MIT). | M1 | survey_1 |
| 8 | Operational Tabular AI Agent Defaults | CLAUDE.md quick-reference tables mapping Universal, Full-Stack, Situational, and Agent Tooling tiers to strict defaults. | M2 | survey_2 |
| 9 | Concrete Default Stacks & Rationale | 5 end-to-end default architecture stacks (Full-Stack TypeScript SaaS, High-Performance Python Microservice, Lightweight Edge/Embedded, CLI Utility, Cross-Platform Desktop/Mobile). | M2 | survey_2 |
| 10 | Explicit Deviation Rules & Scale Triggers | 14 quantitative & qualitative deviation triggers for AI agents (scale thresholds, latency, complex CTEs, analytics, offline-first). | M2 | survey_2 |
| 11 | License Alert & Constraint Matrix | In-depth legal risks and constraints: MinIO (AGPLv3 copyleft), Terraform/Redis/Sentry (BSL 1.1 non-compete), n8n (Sustainable Use fair-code), SSPL, Elastic, MIT/Apache tradeoffs. | M2 | survey_2 |
| 12 | Deep Architectural Trade-Offs Reference | In-depth reference in `full-stack-dev-github-repos.md` detailing technical trade-offs, DX vs performance, maintenance burdens, and ecosystem maturity matching README hierarchy. | M2 | survey_2 |
| 13 | Standalone Link & Anchor Auditor | `scripts/verify-links.ts` zero-bloat TypeScript script parsing markdown AST/regex, verifying relative paths, and computing GitHub GFM heading slugification with duplicate suffix tracking. | M3 | survey_3 |
| 14 | License Caveat Presence Scanner | Automated assertion in `scripts/verify-links.ts` validating that flagged copyleft/source-available tools (MinIO, Terraform, Redis, n8n, Sentry) contain explicit license warnings across all docs. | M3 | survey_3 |
| 15 | Dual Mode Network Engine (Offline + Online) | Deterministic fast offline mode (<200ms) for CI PRs and concurrent HTTP reachability auditing for scheduled releases. | M3 | survey_3 |
| 16 | Star Metric & Badge Schema Validator | Verification of star metric formatting and badge syntax integrity across markdown tables. | M3 | survey_3 |
| 17 | GitHub Actions CI/CD Pipeline | `.github/workflows/ci.yml` running typecheck, lint, unit tests, offline link/license verification, and Next.js build. | M3 | survey_3 |
| 18 | Verification Unit Test Suite | `tests/verify-links.test.ts` providing unit tests for slugification, anchor extraction, relative path resolution, and license audit assertions. | M3 | survey_3 |
| 19 | Full Suite 100% Pass & E2E Hardening | Execution of complete verification pipeline across all markdown files with 0 errors and zero warnings, backed by adversarial challenger testing and forensic integrity audit. | M4 | orchestrator |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Repository & Documentation Foundation | Generate `README.md`, `CONTRIBUTING.md`, `LICENSE` | none | DONE |
| M2 | Agent Integration & Deep Architectural Reference Suite | Generate `CLAUDE.md` and `full-stack-dev-github-repos.md` | M1 (contracts defined) | DONE |
| M3 | Automated Verification & CI Suite | Implement `scripts/verify-links.ts`, `tests/verify-links.test.ts`, `.github/workflows/ci.yml` | none | DONE |
| M4 | Final Acceptance & Adversarial Hardening | End-to-end execution of verification suite, reviewer approval, adversarial stress tests, forensic audit clean verdict | M1, M2, M3 | DONE |

## Interface Contracts & Layout
### Code Layout & File Boundaries
- `README.md`: Root documentation file (Created & Verified)
- `CONTRIBUTING.md`: Root contributor guidelines (Created & Verified)
- `LICENSE`: Root MIT license (Created & Verified)
- `CLAUDE.md`: Root AI agent operational reference (Created & Verified)
- `full-stack-dev-github-repos.md`: Root architectural reference (Created & Verified)
- `scripts/verify-links.ts`: Verification script (Created & Verified)
- `tests/verify-links.test.ts`: Verification unit tests (Created & Verified)
- `.github/workflows/ci.yml`: CI workflow (Configured & Verified)
- `.github/workflows/verify-links.yml`: Verification workflow (Configured & Verified)

### Verification Summary
- `scripts/verify-links.ts --offline --strict`: 351 links in 11 files verified with 0 errors, 0 warnings (100% pass).
- `tests/verify-links.test.ts`: 27/27 unit tests pass (100% pass).
- `tests/challenger-pipeline-adversarial.test.ts`: 6/6 adversarial stress tests pass (100% pass).
- `npx tsc --noEmit`: 0 TypeScript compiler errors.
- Reviewer 1 & 2: APPROVE.
- Challenger 1 & 2: APPROVE.
- Forensic Auditor: CLEAN (Zero integrity violations).
