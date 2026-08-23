# Awesome Dev Pipeline — AI Agent Operational Manifesto (`CLAUDE.md`)

> **Autonomous AI Coding Agent Execution Standard**  
> This document defines the authoritative, deterministic operational defaults, tech stacks, deviation thresholds, and licensing compliance guardrails for AI coding agents and human engineers working within the **Awesome Dev Pipeline** ecosystem.

---

## Table of Contents

- [1. Executive Agent Directive & Operational Rules](#1-executive-agent-directive--operational-rules)
- [2. Operational Tabular Quick-Reference Defaults](#2-operational-tabular-quick-reference-defaults)
  - [2.1 Universal Developer Environment Defaults](#21-universal-developer-environment-defaults)
  - [2.2 Full-Stack Web Pipeline Defaults](#22-full-stack-web-pipeline-defaults)
  - [2.3 Situational & Specialized Tooling Defaults](#23-situational--specialized-tooling-defaults)
  - [2.4 AI Agent Tooling & Architectures Defaults](#24-ai-agent-tooling--architectures-defaults)
- [3. Concrete Default Stacks & Architectural Rationale](#3-concrete-default-stacks--architectural-rationale)
  - [Stack A: Modern Production Web & SaaS (The Golden Baseline)](#stack-a-modern-production-web--saas-the-golden-baseline)
  - [Stack B: High-Throughput / Distributed Microservices](#stack-b-high-throughput--distributed-microservices)
  - [Stack C: Real-Time, Collaborative & Local-First](#stack-c-real-time-collaborative--local-first)
  - [Stack D: Edge-First & Serverless Architecture](#stack-d-edge-first--serverless-architecture)
  - [Stack E: Production AI Agent & Copilot Architecture](#stack-e-production-ai-agent--copilot-architecture)
- [4. Explicit Deviation Rules & Quantitative Scale Triggers](#4-explicit-deviation-rules--quantitative-scale-triggers)
- [5. Comprehensive License Alert & Legal Constraint Matrix](#5-comprehensive-license-alert--legal-constraint-matrix)
- [6. Verification & Quality Gates](#6-verification--quality-gates)

---

## 1. Executive Agent Directive & Operational Rules

When executing any code generation, architectural scaffolding, or package installation task:

1. **Default Bias**: Always select the **Recommended Default** from the operational tables below unless a specific constraint or deviation rule is explicitly triggered.
2. **Minimal Dependency Principle (Ponytail Philosophy)**: Prefer zero-dependency native standard library primitives and compile-time type inference over bloated runtime libraries.
3. **Type Strictness**: Enforce strict TypeScript (`"strict": true`, `"noImplicitAny": true`) or strict Python type annotations (`mypy` / `pyright` strict mode).
4. **License Compliance**: Never introduce dependencies with restrictive copyleft (AGPLv3) or source-available (BSL 1.1, RSALv2, SSPL, Sustainable Use) licenses into closed-source or SaaS product paths without explicit human architecture review.
5. **Deterministic Verification**: Verify all changes by executing local typecheck, unit tests, and lint commands before reporting completion.

---

## 2. Operational Tabular Quick-Reference Defaults

### 2.1 Universal Developer Environment Defaults

| Category | Recommended Default | Alternatives Considered | AI Agent Action / Standard Tooling | Primary Selection Rationale |
|---|---|---|---|---|
| **Terminal Emulator** | **Ghostty** | Alacritty, WezTerm, Kitty, Windows Terminal | Config: `~/.config/ghostty/config` | Fast Zig GPU rendering, native OS window tabs, sub-millisecond input latency. |
| **Terminal Multiplexer**| **Zellij** (Local) / **Tmux** (Server) | Screen | `zellij` for desktop; `tmux` on remote servers | WASM plugin architecture, modern UI layouts, zero-config terminal sessions. |
| **Interactive Shell** | **Zsh** (macOS) / **Fish** (Linux) / **Nushell** (Data) | Bash | Set POSIX fallback for automated CI scripts | Native autocomplete, fast syntax highlighting, structured table pipelines (Nushell). |
| **Prompt Engine** | **Starship** | Powerlevel10k, Oh My Posh | Config: `starship.toml` | Single Rust binary, <5ms prompt render time, cross-shell consistency. |
| **VCS Client** | **Git CLI** + **LazyGit** | GitUI, Jujutsu (jj), GitHub CLI | Use `lazygit` for staging & interactive rebase | High-speed keyboard navigation, interactive hunk staging, standard Git plumbing. |
| **Git Diff Engine** | **Difftastic** + **Delta** | Standard `git diff` | Git config `core.pager = delta` | AST-level syntax-aware diffing with Tree-sitter, preventing whitespace noise. |
| **Code Editor / IDE** | **VS Code** / **Cursor** / **Neovim** | Zed, Helix | LSP + Tree-sitter + Dev Containers | Massive ecosystem, remote containers, native AI tool integration. |
| **Node.js Package Mgr**| **pnpm** (v9+) | Bun, npm, Yarn | `pnpm install --frozen-lockfile` | Strict non-flat `node_modules`, content-addressable storage, disk deduplication. |
| **Python Package Mgr** | **uv** | Poetry, pip, Conda, Pipenv | `uv sync`, `uv run <cmd>` | 10–100x faster Rust package resolver and virtualenv manager. |
| **Rust Build & Test** | **Cargo** + **cargo-nextest** | Standard `cargo test` | `cargo nextest run` | Multi-threaded test runner with 3x faster execution and clean TUI diagnostics. |
| **JS/TS Linter & Formatter**| **Biome** (v1.9+) | ESLint + Prettier, Oxlint | `biome check --write` | Single Rust binary, 25x faster than ESLint+Prettier, unified linter/formatter. |
| **Python Linter & Formatter**| **Ruff** | Black + Flake8 + isort | `ruff check --fix . && ruff format .` | Instantaneous sub-second linting & formatting, replaces 5 legacy tools. |
| **Runtime Version Mgr**| **Mise (mise-en-place)** | asdf, nvm, pyenv | `.mise.toml` for polyglot runtimes | Fast Rust runtime manager, environment variable manager, and task runner. |
| **Dotfiles & Secrets** | **Chezmoi** + **Direnv** | GNU Stow, Dotbot, Infisical | `.chezmoi.toml`, `.envrc` | Encrypted multi-machine dotfiles and automated directory-level env loading. |

---

### 2.2 Full-Stack Web Pipeline Defaults

| Category | Recommended Default | Alternatives Considered | AI Agent Action / Standard Stack | Primary Selection Rationale |
|---|---|---|---|---|
| **Frontend Framework** | **Next.js (App Router)** | Vite + React 19, Astro, SvelteKit, Remix | React 19 RSC, Server Actions, Route Handlers | Unified full-stack model, streaming SSR, edge rendering, enterprise ecosystem. |
| **SPA / Client App** | **Vite + React 19** | Next.js SPA, Astro, SPA mode | `vite.config.ts` with `@vitejs/plugin-react` | Instant HMR, zero SSR overhead, ideal for authenticated B2B dashboards. |
| **Content / Docs Site** | **Astro** | Next.js SSG, Docusaurus, Nuxt | Island architecture (`client:load`) | Zero JavaScript runtime by default, multi-framework component islands. |
| **Backend Framework (TS)**| **Hono** | Fastify, Express, NestJS, Nitro | Hono with typed RPC (`hc`) | Multi-runtime (Node, Workers, Bun, Deno), zero dependencies, <15KB footprint. |
| **Backend Framework (Py)**| **FastAPI** | Litestar, Django Ninja, Flask | FastAPI with Pydantic v2 schemas | Async native, automatic OpenAPI docs generation, strict type validation. |
| **Relational Database** | **PostgreSQL (v16+)** | MySQL, MariaDB, CockroachDB | Neon / Supabase / AWS RDS Aurora | ACID compliance, JSONB documents, pgvector embeddings, PostGIS, extensions. |
| **Embedded Database** | **SQLite / libSQL (Turso)** | PGLite, DuckDB | Single-file embedded DB or Turso edge client | Zero ops, sub-millisecond local reads, embedded durability for desktop & edge. |
| **Analytical OLAP DB** | **ClickHouse** / **DuckDB** | Snowflake, BigQuery, StarRocks | ClickHouse for server OLAP; DuckDB for local | Columnar storage, 100x–1000x faster aggregations over billions of rows. |
| **ORM / Query Builder**| **Drizzle ORM** | Prisma, Kysely, TypeORM, MikroORM | `drizzle-orm` + `drizzle-kit` | Direct SQL mapping, zero runtime binary, compile-time type safety, edge-ready. |
| **Type-Safe SQL Builder**| **Kysely** | Knex, pgTyped, raw pg | `Kysely<Database>` with dialect driver | Zero codegen, type-safe SQL query builder, handles complex recursive CTEs. |
| **Auth & Identity** | **Better-Auth** | Auth.js (NextAuth v5), Clerk, Supabase | `better-auth` with PostgreSQL adapter | Modern TS-first auth, passkeys, 2FA, multi-tenant orgs, self-hosted session control. |
| **Cache & Key-Value** | **Valkey (v8+)** | Redis 7.4+, Dragonfly, KeyDB | `ioredis` / `@upstash/redis` | Fully open-source BSD-3-Clause fork, prevents BSL/RSALv2 license lock-in. |
| **Data Validation** | **Zod** (TS) / **Pydantic** (Py) | Valibot, ArkType, Typia | `z.object({...})` / `pydantic.BaseModel` | Universal ecosystem adoption, seamless OpenAPI / tRPC / Drizzle integration. |
| **Client State Management**| **Zustand** + **TanStack Query** | Redux Toolkit, Jotai, Recoil | Zustand for client UI, Query for server sync | Clear separation between client ephemeral state and asynchronous server state. |
| **CSS Engine** | **Tailwind CSS v4** | Panda CSS, CSS Modules, Emotion | `@theme` directives in CSS | Instant Rust compilation engine (LightningCSS), zero runtime overhead. |
| **UI Primitives** | **shadcn/ui** (Radix UI) | MUI, Chakra UI, Ant Design | Copy-paste accessible Radix UI primitives | Full source ownership, zero npm package lock-in, WCAG 2.2 AAA adaptable. |
| **Icon Library** | **Lucide** / Native SVG Engine | Heroicons, FontAwesome, React Icons | Tree-shakeable SVG icon imports | Consistent visual geometry, zero runtime bundle bloat, zero dependencies. |

---

### 2.3 Situational & Specialized Tooling Defaults

| Category | Recommended Default | Alternatives Considered | AI Agent Action / Standard Stack | Primary Selection Rationale |
|---|---|---|---|---|
| **Real-Time / Multiplayer**| **PartyKit** / **LiveKit** | Socket.IO, WS, ElectricSQL | PartyKit rooms or LiveKit SFU | Stateful edge WebSocket rooms, CRDT synchronization, low-latency audio/video. |
| **Full-Text App Search** | **Meilisearch** | Typesense, Elasticsearch, OpenSearch | Self-hosted Docker or Meilisearch Cloud | Typo-tolerant, instant search-as-you-type, zero-config indexing in Rust. |
| **Vector Similarity Search**| **pgvector** (<10M) / **Qdrant** (>10M)| Milvus, Pinecone, Chroma, Weaviate | Postgres pgvector or Qdrant Rust engine | pgvector eliminates dual-DB sync; Qdrant scales to 50M+ vectors with filtering. |
| **Object & Blob Storage** | **Cloudflare R2** / **MinIO** | AWS S3, SeaweedFS, Garage | `@aws-sdk/client-s3` | Zero egress fees on R2; high-performance local S3 on MinIO (AGPL caveat). |
| **Background Job Queues** | **BullMQ** (Node) / **Celery** (Py) | Inngest, Trigger.dev, Hatchet | Redis/Valkey backed queue workers | Low-latency job scheduling, retries, parent-child job DAG workflows. |
| **Durable Execution** | **Temporal** | Inngest, Trigger.dev, Camunda | Temporal polyglot SDK (TS/Go/Python) | Guaranteed stateful workflow execution, automatic step recovery across crashes. |
| **Product Analytics** | **PostHog** / **Umami** | Google Analytics, Mixpanel, Plausible | PostHog SDK or Umami lightweight tracker | Self-hostable, session replay, funnels, feature flags, privacy compliant. |
| **Feature Flags** | **Unleash** / **Flagsmith** | LaunchDarkly, Statsig | Unleash Node/React SDK | Open-source feature flag engine with gradual canary rollouts and audit logs. |
| **Transactional Email** | **Resend** + **React Email** | SendGrid, Postmark, Nodemailer | `resend` SDK + `@react-email/components` | Declarative React components for responsive HTML emails with high deliverability. |
| **Reverse Proxy & TLS** | **Caddy** / **Traefik** | NGINX, HAProxy, Envoy | Declarative `Caddyfile` | Automatic Let's Encrypt TLS issuance, HTTP/3 support, zero manual cron setup. |

---

### 2.4 AI Agent Tooling & Architectures Defaults

| Category | Recommended Default | Alternatives Considered | AI Agent Action / Standard Stack | Primary Selection Rationale |
|---|---|---|---|---|
| **AI Coding Agents** | **Claude Code** / **Cursor** | Aider, OpenHands, Roo Code, SWE-agent | Subagent dispatch, CLI automation | Unrivaled reasoning, native tool execution, multi-turn context retention. |
| **Tool Protocol** | **Model Context Protocol (MCP)**| Custom REST tools, OpenAPI specs | `@modelcontextprotocol/sdk` / FastMCP | Anthropic open industry standard for secure client-server tool integration. |
| **Agent Orchestrator** | **LangGraph** / **Smolagents** | LangChain classic, CrewAI, AutoGen | Cyclic stateful graph workflows | Deterministic state-machine routing, explicit memory checkpoints, code actions. |
| **RAG & Indexing** | **LlamaIndex** | LangChain RAG, Haystack | Advanced chunking, hybrid vector retrieval | Specialized hierarchical index structures, structured metadata extractors. |
| **Local LLM Execution** | **Ollama** (Dev) / **vLLM** (Prod) | llama.cpp, LocalAI, TGI | Ollama CLI or vLLM PagedAttention | One-command local LLM runner (Ollama) / high-throughput batch serving (vLLM). |
| **LLM Observability** | **Langfuse** | Arize Phoenix, Helicone, LangSmith | Open-source tracing SDK (`langfuse`) | Self-hostable, full token/latency/cost tracking, prompt versioning. |
| **Agent Evaluations** | **Agent-as-Judge (Custom)** + **Promptfoo** | DeepEval, Ragas | Deterministic unit tests + LLM judges | Combines exact unit assertions with LLM-evaluated task completion rubrics. |

---

## 3. Concrete Default Stacks & Architectural Rationale

### Stack A: Modern Production Web & SaaS (The Golden Baseline)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser Layer                     │
│  Next.js 15/16 (React 19 RSC) + Tailwind v4 + shadcn/ui     │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Server Actions / Route API    │ Client RPC
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   Full-Stack Next.js Node    │ │   Standalone Microservice   │
│   Drizzle ORM + Better-Auth  │ │   Hono (TypeScript)         │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Data & Storage Infrastructure                │
│  PostgreSQL 16 (Neon / Supabase) + Valkey Cache (BSD-3)     │
│  BullMQ Task Queue + Cloudflare R2 Object Storage           │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend & Meta-Framework**: Next.js 15/16 (App Router, React 19, Server Components)
- **UI & Design System**: Tailwind CSS v4 + shadcn/ui (Radix UI primitives) + Native SVG icons
- **Core Language**: TypeScript 5.8 (Strict mode enabled across monorepo)
- **API Layer**: Next.js Server Actions & Route Handlers + Hono (for edge microservices)
- **Primary Relational Store**: PostgreSQL 16 (Neon / Supabase / AWS RDS Aurora)
- **ORM & Data Layer**: Drizzle ORM + Drizzle Kit
- **Validation Engine**: Zod (shared full-stack schemas)
- **Authentication**: Better-Auth (with PostgreSQL adapter)
- **State Management**: Zustand (client UI) + TanStack Query (server cache)
- **Caching & Ephemeral Store**: Valkey (BSD-3-Clause) or Upstash Redis
- **Background Task Queue**: BullMQ (Valkey-backed) or Inngest (serverless)
- **Linter & Formatter**: Biome (single Rust binary)
- **Package Manager**: pnpm (content-addressable storage)

**Architectural Rationale**:  
This stack provides maximum developer velocity with zero architectural friction. Pure TypeScript spans database schemas (Drizzle), runtime validation (Zod), API route contracts, and React 19 UI components. Drizzle compiles direct SQL without heavy runtime binaries or cold-start penalties. Better-Auth eliminates vendor lock-in with self-hosted passkeys, OAuth, and multi-tenant orgs. Tailwind v4 and Biome ensure sub-second builds and instant CI quality gates.

---

### Stack B: High-Throughput / Distributed Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                API Gateway & Ingress Layer                  │
│       Caddy / Traefik / Envoy (HTTP/3 + TLS Termination)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Connect-RPC (Protobuf / HTTP/2)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Microservices Backend Fleet                  │
│       Go 1.23+ (`sqlc`)  /  Rust Tokio (`sqlx`)             │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Transactional Reads/Writes    │ Event Streaming
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   PostgreSQL 16 + PgBouncer  │ │   Redpanda / Apache Kafka   │
│   Valkey / Dragonfly Cache   │ │   ClickHouse Columnar OLAP  │
└──────────────────────────────┘ └─────────────────────────────┘
```

- **Core Languages**: Go 1.23+ or Rust (Tokio async runtime)
- **Transport Protocol**: Connect-RPC (gRPC + HTTP/JSON over Protocol Buffers)
- **API Gateway & Routing**: Caddy / Traefik / Envoy
- **Primary Relational Store**: PostgreSQL (Connection pooled via PgBouncer / Supavisor)
- **High-Throughput Analytics**: ClickHouse
- **Event Streaming**: Redpanda / Apache Kafka
- **In-Memory Cache**: Valkey (clustered) or Dragonfly
- **Database Access**: `sqlc` (Go - compile-time generated SQL) or `sqlx` (Rust)
- **Serialization**: Protocol Buffers via Buf CLI
- **Durable Orchestration**: Temporal
- **Observability**: OpenTelemetry + Prometheus + Grafana + SigNoz

**Architectural Rationale**:  
Engineered for systems handling >20,000 requests/sec with strict sub-10ms P99 latency requirements. Connect-RPC enforces strict cross-service typing with minimal payload serialization overhead. `sqlc` and `sqlx` eliminate ORM abstraction penalties by compiling pure SQL into zero-allocation native structs. ClickHouse isolates analytical aggregation queries from primary OLTP transactional databases.

---

### Stack C: Real-Time, Collaborative & Local-First

```
┌─────────────────────────────────────────────────────────────┐
│               Client Application (Local-First)              │
│   Vite + React 19 / SvelteKit + SQLite / PGLite (Local DB)   │
│   Yjs / Automerge CRDT State Container                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Delta Sync over WebSockets
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Edge Real-Time Sync Server                  │
│   PartyKit (Cloudflare Durable Objects) / Liveblocks        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Active-Active Postgres Sync
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Centralized Backend Store                   │
│   PostgreSQL 16 + ElectricSQL Sync Engine                   │
└─────────────────────────────────────────────────────────────┘
```

- **Client Framework**: Vite + React 19 or SvelteKit (Svelte 5)
- **Local Embedded Database**: SQLite / PGLite / RxDB
- **Conflict Resolution**: Yjs / Automerge (CRDT state sync)
- **Edge Real-Time Server**: PartyKit (Cloudflare Durable Objects) or Liveblocks
- **Central Storage**: PostgreSQL 16 + ElectricSQL (active-active sync engine)
- **Data Validation**: Valibot or ArkType (ultra-lightweight client bundle)
- **Styling**: Tailwind CSS v4

**Architectural Rationale**:  
Eliminates perceived network latency by executing all reads and writes against local client storage (SQLite/PGLite/IndexedDB) and synchronizing state deltas in the background via CRDTs. PartyKit provides distributed, stateful edge rooms with zero server provisioning overhead.

---

### Stack D: Edge-First & Serverless Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Global Edge Network (300+ PoPs)               │
│   Cloudflare Workers / Fastly Compute / Vercel Edge         │
│   Hono Web Framework (Zero Node.js Dependencies)            │
└──────────────┬───────────────────────────────┬──────────────┘
               │ WebSocket / HTTP Queries      │ S3 API
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  Turso (libSQL Edge DB) or   │ │  Cloudflare R2 Storage      │
│  Neon Serverless Postgres    │ │  (Zero Egress Cost)         │
│  Drizzle ORM (Edge Driver)   │ │  Cloudflare KV / Upstash    │
└──────────────────────────────┘ └─────────────────────────────┘
```

- **Execution Runtime**: Cloudflare Workers / Fastly Compute / Vercel Edge
- **Web Framework**: Hono (Lightweight web standards framework, <15KB)
- **Edge Database**: Turso (libSQL/SQLite over WebSockets) or Neon (Serverless Postgres)
- **ORM & Data Layer**: Drizzle ORM (Edge-compatible driver)
- **KV & Rate Limiting**: Cloudflare KV / Upstash Redis
- **Object Storage**: Cloudflare R2 (S3-compatible, zero egress fees)
- **Testing & Emulation**: Vitest + Miniflare (Cloudflare Worker simulator)

**Architectural Rationale**:  
Achieves <50ms global time-to-first-byte (TTFB) without provisioning central virtual machines. The entire application runs inside lightweight V8 isolates deployed in hundreds of global points of presence. Hono leverages standard Web APIs (`Request`, `Response`, `fetch`) for portable execution across all edge providers.

---

### Stack E: Production AI Agent & Copilot Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Autonomous AI Agent Core                   │
│   Python 3.12+ (uv) or TypeScript / Node.js 22+             │
│   LangGraph (Cyclic State Machine) / Smolagents             │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Model Context Protocol (MCP)  │ Tracing & Evals
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   MCP Tool Servers (FastMCP) │ │   Langfuse (Tracing & Evals)│
│   • Postgres / File / Git    │ │   Agent-as-Judge Harness    │
│   • Browser / Terminal MCP   │ │   Promptfoo Red-Teaming     │
└──────────────┬───────────────┘ └─────────────────────────────┘
               │ Vector Embeddings & Context
               ▼
┌─────────────────────────────────────────────────────────────┐
│             Vector & Retrieval Infrastructure               │
│   Qdrant (Large-Scale) / pgvector + LlamaIndex Indexing    │
│   Ollama (Local Testing) / vLLM (Production GPU Serving)    │
└─────────────────────────────────────────────────────────────┘
```

- **Core Runtime**: Python 3.12+ (managed via `uv`) or TypeScript (Node.js 22+)
- **Agent Orchestrator**: LangGraph (cyclic stateful graphs) or Smolagents (code-executing agents)
- **Tool Protocol**: Model Context Protocol (MCP - Anthropic open standard)
- **MCP Server Toolkit**: FastMCP (`fastmcp` Python / TypeScript SDK)
- **Vector Storage**: Qdrant (large-scale dedicated) or pgvector (unified PostgreSQL)
- **Document Chunking & RAG**: LlamaIndex
- **LLM Tracing & Observability**: Langfuse
- **Eval Harness**: Agent-as-Judge (custom unit tests + golden dataset assertions) + Promptfoo
- **Model Execution**: Ollama (local development) / vLLM (production GPU cluster)

**Architectural Rationale**:  
Provides a resilient, production-grade foundation for autonomous AI agents. LangGraph enables cyclic state machines with human-in-the-loop approvals, checkpoints, and deterministic fallback routes. The Model Context Protocol (MCP) standardizes tool discovery and execution across external databases, APIs, and sandboxed runtimes.

---

## 4. Explicit Deviation Rules & Quantitative Scale Triggers

Autonomous AI agents must follow deterministic heuristics when deciding whether to deviate from standard default tools.

```
                    ┌─────────────────────────┐
                    │ Standard Default Stack  │
                    │ (Next.js + Postgres +   │
                    │  Drizzle + Tailwind v4) │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[Trigger 1: Scale/Traffic]  [Trigger 2: Data Shape]    [Trigger 3: Latency/Edge]
• QPS > 20,000             • Aggregations > 5M rows   • TTFB < 50ms Globally
  -> Go/Rust + Connect-RPC    -> ClickHouse / DuckDB     -> Hono + Cloudflare R2/Turso
• Cache ops > 1M/sec       • Polymorphic Telemetry    • Collaborative Sync
  -> Dragonfly / Clustered    -> MongoDB / DynamoDB      -> PartyKit + Yjs CRDTs
```

| # | Area / Component | Standard Default | Deviate To (Alternative) | Exact Quantitative Trigger / Technical Criteria |
|---|---|---|---|---|
| **1** | **Database Architecture** | **PostgreSQL** | **ClickHouse** | When query workloads scan **>5,000,000 rows/sec** for analytical aggregations, metrics, or time-series reports, or when OLAP queries degrade OLTP transaction latency by **>20%**. |
| **2** | **Database Architecture** | **PostgreSQL** | **MongoDB / DynamoDB** | When data model consists of highly polymorphic, non-relational document trees with **>50,000 write ops/sec** and strictly zero multi-table relational join requirements. |
| **3** | **Database Architecture** | **PostgreSQL** | **SQLite / libSQL (Turso)** | When building embedded desktop applications (Tauri), CLI utilities, edge serverless workers (Turso), or local-first client caches requiring single-file zero-ops durability. |
| **4** | **Frontend Framework** | **Next.js (App Router)** | **Vite + React 19 SPA** | When building authenticated, private B2B enterprise dashboards with zero SEO requirements, heavy client-side canvas/WebGL rendering, or deployments to pure static S3/CDN infrastructure. |
| **5** | **Frontend Framework** | **Next.js (App Router)** | **Astro** | When building content-driven public websites, blogs, documentation portals, or marketing sites where JS payload must be near zero and multi-framework island hydration is needed. |
| **6** | **Backend & Transport** | **Hono / REST** | **Connect-RPC / gRPC** | When east-west internal microservice traffic exceeds **5,000 requests/sec**, requires strict protobuf binary schemas, bi-directional streaming, or polyglot Go/Rust/Java type safety. |
| **7** | **ORM / Data Access** | **Drizzle ORM** | **Kysely / Raw SQL (sqlx/sqlc)**| When queries require complex recursive CTEs, dynamic multi-pivot aggregations, window functions with custom framing, or bulk `COPY FROM` streaming that exceeds ORM abstraction models. |
| **8** | **ORM / Data Access** | **Drizzle ORM** | **Prisma** | Only when maintaining legacy codebases already deeply committed to the Prisma schema DSL, or when rapid prototyping requires Prisma Studio GUI and serverless cold-start latency is non-critical. |
| **9** | **Caching Engine** | **Valkey** | **Dragonfly** | When single-instance cache throughput requires **>1,000,000 ops/sec** on multi-core vertical hardware without managing Redis cluster partitioning overhead. |
| **10** | **Authentication** | **Better-Auth** | **Keycloak / Ory Kratos** | When the application requires enterprise Single Sign-On (SAML 2.0 / Enterprise OIDC), federated LDAP/Active Directory directory synchronization, or external regulatory IAM compliance. |
| **11** | **Task Queue** | **BullMQ** | **Temporal** | When workflows require multi-step distributed sagas, stateful long-running execution across hours/days, guaranteed step retries, and cross-language execution guarantees. |
| **12** | **Search Engine** | **pgvector** | **Qdrant / Milvus** | When vector collection size exceeds **10,000,000 vectors** (768d+), or when payload filtering latency in PostgreSQL exceeds **50ms at P95**. |
| **13** | **Validation Engine** | **Zod** | **Typia / ArkType** | When high-throughput JSON API validation bottlenecks Node.js event loop processing (**>10,000 validations/sec**) and compile-time code generation is required for 10x–50x speedups. |
| **14** | **Desktop / Native** | **Electron** | **Tauri v2** | When bundle size must remain **<15MB**, RAM footprint must remain **<50MB**, or native Rust system integration is preferred over bundling a full Chromium instance. |

---

## 5. Comprehensive License Alert & Legal Constraint Matrix

```
                    ┌──────────────────────────────────────────────┐
                    │      Open Source & Source-Available          │
                    │             License Matrix                   │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [Permissive]                     [Copyleft]                     [Source-Available / BSL]
• MIT / Apache-2.0 / BSD        • AGPLv3 (Network Copyleft)      • BSL 1.1 / BUSL (HashiCorp/Sentry)
• Unrestricted commercial use     MUST open-source SaaS backend     Non-compete; bans managed hosting
• Free to redistribute & embed    if modified over network!       • Sustainable Use / Fair-Code (n8n)
• Standard for libraries        • GPLv3 / LGPLv3                   Bans reselling as cloud service
                                  Derivative works must open-src  • SSPL (MongoDB) / Elastic v2
```

| License Type | Representative Tools | Commercial SaaS Use Allowed? | Modifications Must Be Disclosed? | Critical Legal Nuances & AI Agent Guardrails |
|---|---|---|---|---|
| **MIT / BSD-2 / BSD-3** | React, Next.js, Hono, Drizzle, Valkey, Express, Vite | **YES** (Fully Permissive) | **NO** (Keep copyright notice) | Standard gold standard for open-source software. Free commercial embedding, modification, and closed-source redistribution. |
| **Apache 2.0** | Apache Kafka, Rust crates, Polars, Supabase, Arrow | **YES** (Permissive + Patents) | **NO** (Keep notice & attribution)| Includes explicit patent grants from contributors to users and trademark protection. Safest license for enterprise corporate adoption. |
| **MPL 2.0 (Mozilla)** | OpenTofu, Syncthing, Terraform (pre-BSL) | **YES** (File-level Weak Copyleft) | **YES** (Only if modifying MPL files) | Modifications to existing MPL-licensed files must remain open source under MPL. Combining with proprietary code in separate files is permitted. |
| **AGPLv3 (Affero GPL)**| **MinIO**, **Grafana (v8+)**, Mastodon | **HIGH RISK** (Network Copyleft) | **YES (Over Network)** | **CRITICAL**: Section 13 mandates that anyone interacting with the software over a network must be provided access to the complete modified source code. Do NOT link or modify in closed-source proprietary SaaS backends unless using unmodified binaries via external API or purchasing commercial enterprise licenses. |
| **BSL 1.1 / BUSL** | **Terraform 1.6+**, **Redis 7.4+**, CockroachDB, Sentry | **CONDITIONAL** (Non-Compete) | Depends on vendor terms | **Source-Available (NOT OSI Open Source)**. Permits internal usage and production deployment, but strictly prohibits offering the software as a competing commercial managed service. Automatically converts to open source (Apache 2.0/GPL) after 3–4 years. |
| **Sustainable Use / Fair-Code** | **n8n** | **CONDITIONAL** (Internal only) | **NO** | Permits self-hosting for internal company automation. Strictly forbids embedding in a multi-tenant commercial product sold to third-party end users without an enterprise commercial license. |
| **SSPL (Server Side Public License)** | **MongoDB (v4.0+)** | **CONDITIONAL** (Non-Hosting) | **YES (Complete Infrastructure)**| Created by MongoDB to prevent cloud providers from selling managed MongoDB without contributing back. If offering MongoDB as a service, you must open-source your entire management stack, orchestration code, and APIs. |
| **Elastic License 2.0 (ELv2)** | Elasticsearch 7.11+, Kibana | **CONDITIONAL** (Non-Managed) | **NO** | Forbids providing Elasticsearch as a managed service to third parties and circumvention of licensing keys. Permitted for internal application search. |
| **FSL-1.1-Apache** | **Sentry** | **CONDITIONAL** (Non-Compete) | **NO** | Functional Source License; permits free internal use and SaaS embedding so long as it does not compete directly with Sentry; converts to Apache-2.0 after 2 years. |

---

## 6. Verification & Quality Gates

AI coding agents MUST execute the following verification steps before finalizing any code modification:

```bash
# 1. Validate markdown link health, anchor validity, and license warnings
npm run verify

# 2. Run TypeScript strict typecheck across codebase
npx tsc --noEmit

# 3. Execute unit and verification test suites
npm test

# 4. Run native single-binary linter & formatter
npx biome check --write
```
