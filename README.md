<div align="center">
<img src="assets/header.svg" width="100%" alt="KL Sync Header" />
  <img src="public/logo.png" alt="KL Sync Logo" width="220" />
  <h1>KL Sync</h1>
  <p><strong>An exhaustive, unofficial, minimalist ERP client for KL University.</strong></p>

  <p>
    <a href="https://klhb.vercel.app"><img alt="Live Demo" src="https://img.shields.io/badge/Live-klhb.vercel.app-10B981?style=flat-square&logo=vercel&logoColor=white" /></a>
    <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" /></a>
    <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" /></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
    <a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" /></a>
    <a href="DESIGN.md"><img alt="WCAG 2.2 AAA" src="https://img.shields.io/badge/Accessibility-WCAG%202.2%20AAA-818CF8?style=flat-square" /></a>
  </p>
</div>

---

## 🌐 Live Production Deployment

Access the live production instance deployed on Vercel:
👉 **[https://klhb.vercel.app](https://klhb.vercel.app)**

---

## ✨ Project Overview

KL University's official ERP system handles student data, including attendance, marks, timetables, and fee receipts. However, the legacy interface lacks modern mobile responsiveness and performance optimization.

**KL Sync** serves as a high-performance proxy and modern web client built with Next.js 16, React 19, and Tailwind CSS v4. User sessions are authenticated-encrypted server-side using **AES-256-GCM** without persisting user credentials in a database.

The HTML responses from the ERP are parsed intelligently via Cheerio and transformed into clean JSON payloads rendered onto a dark cyber minimalist dashboard following strict WCAG 2.2 AAA accessibility standards.

Detailed architectural blueprints can be found in **[ARCHITECTURE.md](ARCHITECTURE.md)**, and the design system specification is documented in **[DESIGN.md](DESIGN.md)**.

> **Note**: This is an independent open-source project built by students. It is **not** endorsed by or affiliated with KL University. See the [Disclaimer](#-disclaimer).

---

## 🏗️ Modular Scraper Architecture (`src/lib/scrapers/`)

The core scraper engine was recently refactored from a monolithic file into modular sub-scrapers under `src/lib/scrapers/`:

```text
src/lib/
├── scraper.ts               # Barrel file / facade re-exporting all sub-scrapers
└── scrapers/
    ├── http-jar.ts          # Cookie jar management, fetch wrapper, timeout signal & table parsing
    ├── attendance.ts        # Captcha retrieval, authentication, and attendance data scraper
    ├── timetable.ts         # Timetable matrix scraper & heuristic matrix validator
    ├── marks.ts             # Internal marks, semester end exam results & CGPA scraper
    ├── fee.ts               # Fee receipts and generic module data proxy
    └── profile.ts           # Student profile and multi-tab demographics parser
```

### Key Architectural Improvements
* **Decoupled Responsibilities:** Cookie jar handling and network logic live in `http-jar.ts`, isolating HTTP transport from page-specific Cheerio selector logic.
* **Backward Compatibility:** `src/lib/scraper.ts` functions as a facade, ensuring existing imports across API routes and components remain unaffected.
* **Resilient Fetch Timeout:** All HTTP calls wrap fetching with `AbortSignal.timeout(25000)` to ensure Next.js worker threads never hang indefinitely when university servers lag.

---

## 🔐 Configuration & Security

KL Sync uses environment variables to secure sessions and configure backend behaviors. Configure these in your `.env.local` file.

| Variable | Requirement | Description |
|---|---|---|
| `SESSION_SECRET` | **Strictly Required in Production** | A 32+ character random secret string used to derive a fixed 32-byte key for **AES-256-GCM** session encryption. **In production (`NODE_ENV=production`), omitting `SESSION_SECRET` triggers a fatal runtime exception (`[SECURITY FATAL]`), preventing unencrypted session tokens from circulating.** |
| `NODE_ENV` | Optional | Set to `development` locally or `production` when deployed. |

---

## 🚀 Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tejaswin-amara/kl-sync.git
   cd kl-sync
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Add a secure `SESSION_SECRET` in `.env.local`.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

---

## 🛠️ Quality Gates & Testing Commands

To run all automated verification checks locally:

```bash
# 1. Run ESLint code quality check
npm run lint

# 2. Run TypeScript strict type-checking
npx tsc --noEmit

# 3. Run unit test suite (18 timetable/scraper tests)
npx tsx --test src/lib/scraper.test.ts

# 4. Run Next.js production build verification
npm run build
```

---

## ⚖️ Disclaimer

KL Sync is an independent project built by a student, for KLU students. It has no affiliation with, endorsement from, or support from KL University. Your ERP credentials are used strictly to authenticate against the official ERP and are never saved or stored.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/tejaswin-amara">Tejaswin</a> for KLU students.
</p>
