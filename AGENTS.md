# AGENTS.md

This file provides guidance and project context for AI coding agents operating in this repository, including **Jules by Google** (jules.google.com).

## 🚀 Project Overview

**KL-Sync** (`kl-sync`) is an unofficial, high-performance, minimalist ERP web client and proxy for KL University students.

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5.8
- **Architecture**: Edge Proxy (Stateless, no DB). Session tokens encrypted with AES-256-GCM.
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens (`globals.css`)
- **Testing**: Native Node.js Test Runner (`node:test`) + Playwright E2E

---

## 🛠️ Build & Test Commands

Before making PRs or committing changes, run the following verification sequence:

```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Unit & Integration Test Suite (219 tests)
npm test

# 4. Production Build
npm run build
```

---

## 📐 Architecture & Principles

1. **Ponytail Philosophy (YAGNI & Minimal Bloat)**:
   - Prefer standard library primitives over third-party dependencies.
   - Do not add state management libraries or data fetching wrappers when native `fetch` + React state works cleanly.
   - Deletion over addition. Shortest working diff wins.

2. **Security & Session Confidentiality**:
   - Never store plain text passwords in `localStorage` or `sessionStorage`.
   - All ERP sessions route through `encodeSession()` and `decodeSession()` using Web Crypto API (`AES-256-GCM`).
   - Route protection is managed by `src/middleware.ts` intercepting `/dashboard/*`.
   - Proxy URLs (e.g. `src/app/api/fetch-photo/route.ts`) must strictly validate target origins against `https://newerp.kluniversity.in` to prevent SSRF vulnerabilities.

3. **Accessibility & Design**:
   - Adhere to **WCAG 2.2 AAA** accessibility standards (contrast ≥ 7.1:1, interactive touch targets ≥ 44px).
   - Use high-visibility focus indicators (`:focus-visible`).

---

## 📁 Directory Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI Quality Gates
│       ├── codeql.yml        # CodeQL Security Analysis
│       └── jules.yml         # Jules Automation Workflow
├── src/
│   ├── app/                  # Next.js App Router (pages, API routes, layout)
│   │   ├── api/              # Proxy endpoints (login, captcha, erp-proxy, fetch-photo)
│   │   └── dashboard/        # Dashboard module pages (attendance, timetable, marks, etc.)
│   ├── components/           # React UI components & design system tokens
│   ├── hooks/                # Custom React data hooks (useAttendance, useTimetable, etc.)
│   ├── lib/                  # Core scrapers, session encryption, captcha OCR, fee utils
│   ├── middleware.ts         # Next.js Edge route guard middleware
│   └── types/                # TypeScript type definitions & Zod schemas
└── AGENTS.md                 # Agent guidance & project instructions
