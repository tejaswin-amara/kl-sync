# Nexus Pro Max ✦ KL ERP Overlay

<div align="center">
  <img src="public/favicon.ico" alt="Nexus Pro Max Logo" width="100"/>
  <h3>A breathtakingly beautiful, ultra-modern Next.js 14 overlay for the KL University ERP.</h3>
</div>

<br/>

Nexus Pro Max fundamentally reimagines the student experience for KL University. Built entirely on top of the existing ERP backend, this overlay extracts your academic data in real-time and presents it through a stunning, glassmorphic, dark-mode-first user interface.

No more broken tables, missing mobile support, or clunky navigation. Just pure, fluid, state-of-the-art web design.

---

## ✨ Features

- 🌓 **Pure Dark Mode Aesthetics**: A fully bespoke, glassmorphic UI built with Tailwind CSS that feels premium and responsive.
- 🚀 **Blazing Fast Next.js Architecture**: Server-rendered and cached for instantaneous page loads.
- 🤖 **Auto-Solving CAPTCHA**: Built-in client-side OCR using `tesseract.js` automatically solves ERP login CAPTCHAs so you can login friction-free.
- 📊 **Unified Dashboard**: Instantly view Attendance, CGPA, Marks, Timetable, Circulars, and Fee details in beautiful, readable cards.
- 📱 **Mobile First**: 100% responsive design that works flawlessly on your phone.
- 🔐 **Privacy First**: Your credentials are never stored. The app acts as a direct, stateless proxy to the official ERP servers.

## 🛠️ Technology Stack

- **Core**: [Next.js 16](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `clsx`, `tailwind-merge`
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Scraping Engine**: [Cheerio](https://cheerio.js.org/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)

## 🚀 Getting Started

First, ensure you have Node.js 20+ installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tejaswin-amara/kl-sync.git
   cd kl-sync
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏛️ Architecture

Nexus Pro Max operates as a headless frontend to the KL ERP.
1. The user logs in via the overlay.
2. The overlay solves the CAPTCHA and proxies the authentication request to the actual ERP.
3. The ERP returns a session cookie (`PHPSESSID`), which is securely encrypted and stored on the client side.
4. For all data requests (Timetable, Marks, etc.), the overlay's unified `/api/erp-proxy/[module]` endpoint securely decrypts the session, requests the raw HTML from the ERP, parses it into JSON using Cheerio, and returns it to the beautiful frontend components.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues page](https://github.com/tejaswin-amara/kl-sync/issues).

## 📝 License

This project is not affiliated with, endorsed by, or sponsored by KL University. It is an independent open-source overlay built for students, by students. Use responsibly.
