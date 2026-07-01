<div align="center">

<img src="https://raw.githubusercontent.com/tejaswin-amara/kl-sync/master/public/attendance_preview.png" alt="KL Sync – Attendance Analytics Dashboard" width="640" />

<h1>⚡ KL Sync</h1>

<p><strong>The unofficial attendance tracker for KL University students.</strong><br />
Real-time data from the ERP · Zero manual input · Installable PWA</p>

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel Edge](https://img.shields.io/badge/Vercel-Edge_Runtime-black?style=flat-square&logo=vercel)](https://vercel.com/docs/functions/edge-functions)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Vitest](https://img.shields.io/badge/Vitest-39_passing-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

**[Live Demo →](https://kl-sync.vercel.app)**

</div>

---

## What is KL Sync?

KL Sync is a student-built Progressive Web App that gives **KL University (KLEF) students** a clean, fast alternative to the official ERP portal for tracking attendance. It scrapes live data from `newerp.kluniversity.in` using your own ERP credentials — nothing is stored server-side.

Built for the **Bachupally campus** but works across all KLU campuses that use the same ERP.

> **Disclaimer:** This is an unofficial, community project and is not affiliated with KL University. Your credentials are never stored — they are used only to authenticate your session directly with the KLU ERP.

---

## ✨ Features

### 📊 Live Attendance Dashboard
- Fetches real-time attendance from the KLU ERP for any academic year and semester
- Weighted percentage calculation across all four components: **Lecture · Tutorial · Practical · Skilling** (LTPS)
- Color-coded eligibility status:
  - 🟢 **≥ 85%** — Eligible
  - 🟡 **75 – 84%** — Condonation zone
  - 🔴 **< 75%** — Detained

### 🔢 Attendance Calculator
- Per-course simulator: see how many more classes you need to attend to cross **75%** or **85%**
- Adjustable sliders let you model "what if I attend/miss X classes" before the next session

### 🤖 Opt-in OCR CAPTCHA Solver
- One-click **Magic Wand** button auto-fills the ERP login CAPTCHA using [OCR.space](https://ocr.space/) (dual-engine, parallel)
- Manual entry always available as a fallback — OCR is never forced on you

### 📷 Screenshot Attendance Parser
- Can't log in? Upload a screenshot of your KLU attendance table and KL Sync will extract the data using OCR and render the same dashboard

### ⌘ Command Palette
- Press `⌘K` / `Ctrl+K` anywhere to jump between semesters, search courses, and trigger actions

### 📱 Installable PWA
- Works offline after first load via Service Worker
- Add to Home Screen on iOS and Android for a native app feel
- `standalone` display mode with `black-translucent` status bar on iOS

### 🎨 Glassmorphism UI
- Animated with [Framer Motion](https://www.framer.com/motion/) (v12)
- Dot-matrix background with radial gradient overlay
- Dark mode by default, system theme respect via `next-themes`
- `Fira Sans` + `Fira Code` typography

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router, React Compiler |
| UI | [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/), `tailwind-merge`, `clsx` |
| Scraping | [Cheerio](https://cheerio.js.org/) — server-side HTML parsing against KLU ERP |
| OCR | [OCR.space API](https://ocr.space/ocrapi) (captcha), [Tesseract.js](https://tesseract.projectnaptha.com/) (client screenshot) |
| Command Palette | [cmdk](https://cmdk.paco.me/) |
| Auth / Session | Cookie jar + CSRF token, `httpOnly` device cookie, base64-encoded session token |
| Caching | Next.js `unstable_cache` (1-hour revalidation per session) |
| Runtime | Vercel Edge Runtime — zero cold starts |
| Testing | [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/), jsdom |
| Language | TypeScript 5 throughout |

---

## 🏗️ Architecture

```
Browser (PWA)
    │
    ├── /login          → Login page (CAPTCHA fetch, auto-solve opt-in, ERP auth)
    └── /              → Dashboard (attendance, calculator, command palette)
           │
           ▼
      Next.js Edge API Routes
           │
           ├── GET  /api/erp/captcha      → Fetch live CAPTCHA image from KLU ERP
           ├── POST /api/erp/captcha      → Auto-solve CAPTCHA via OCR.space
           ├── POST /api/login            → Authenticate with KLU ERP, return session token
           ├── POST /api/erp/data         → Fetch profile / timetable / attendance (1hr cache)
           └── POST /api/parse-ocr        → Parse uploaded attendance screenshot via OCR
                    │
                    ▼
              newerp.kluniversity.in
              (cheerio scraper, cookie jar, sticky SERVERID handling)
```

**Session flow:** The scraper maintains a faithful cookie jar across the load-balancer's sticky `SERVERID` redirects, accumulates `PHPSESSID` + `_csrf` on the final hop, and serialises the whole session as a base64 token that rides in the `x-session-id` header — no database, no server-side storage.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm / pnpm / yarn

### 1. Clone
```bash
git clone https://github.com/tejaswin-amara/kl-sync.git
cd kl-sync
```

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```
Open `.env.local` and set your OCR key (see [Environment Variables](#-environment-variables) below).

### 4. Run locally
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) and log in with your KLU ERP credentials.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OCR_SPACE_API_KEY` | Optional | API key from [ocr.space/ocrapi](https://ocr.space/ocrapi) for CAPTCHA auto-solve. Falls back to the free `helloworld` key if unset (rate-limited). |

That's it. No database. No auth service. No other secrets.

---

## 🧪 Tests

```bash
npm test          # Vitest (unit + component tests)
npm run test:jest # Jest runner
```

The test suite covers the ERP scraper, OCR pipeline, session encode/decode, login API route, and the OCR parse route.

---

## 📦 Deployment

The recommended deployment target is **Vercel** — all API routes run on the Edge Runtime and deploy automatically.

1. Fork or import this repo into Vercel
2. Add `OCR_SPACE_API_KEY` in **Settings → Environment Variables**
3. Deploy — done

---

## 🤝 Contributing

Pull requests are welcome! For significant changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Tejaswin Amara](https://github.com/tejaswin-amara)
