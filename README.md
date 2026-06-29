<div align="center">
  <br />
  <h1>🎓 KL Sync</h1>
  <p>
    <strong>A fast, modern, and reliable attendance tracking portal for KL University.</strong>
  </p>
  <br />
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftejaswin-amara%2Fkl-attendance-v2&env=OCR_SPACE_API_KEY)
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vitest](https://img.shields.io/badge/Vitest-Passing-brightgreen?style=flat-square&logo=vitest)](https://vitest.dev/)
</div>

<hr />

## ✨ Features

- 🚀 **Next.js 16 App Router** - Blazing fast server-side rendering and static generation via Turbopack.
- 🎨 **Modern Interface** - Responsive, clean, and beautiful UI built with **Tailwind CSS v4** and `lucide-react` icons.
- 🤖 **Frictionless Login** - Automated captcha bypassing using OCR.space integration and sharp image preprocessing.
- 🛡️ **Robust Security** - Strict `zod` validation, secure session management, and comprehensive error handling.
- ✅ **High Test Coverage** - Fully unified end-to-end and unit testing powered by **Vitest** and Testing Library.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Parsing/Scraping**: [Cheerio](https://cheerio.js.org/), [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/)

---

## 🚀 One-Click Deploy (Vercel)

The easiest way to deploy this application is using the Vercel Platform. 

Click the button below to fork and deploy the repository directly to your Vercel account:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftejaswin-amara%2Fkl-attendance-v2&env=OCR_SPACE_API_KEY)

> **Note**: You will be prompted to enter the `OCR_SPACE_API_KEY` environment variable during deployment. You can get a free API key from [OCR.space](https://ocr.space/ocrapi).

---

## 💻 Local Development

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, yarn, pnpm, or bun

### 1. Clone the repository
```bash
git clone https://github.com/tejaswin-amara/kl-attendance-v2.git
cd kl-attendance-v2
```

### 2. Install dependencies
```bash
npm install
# or yarn install / pnpm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your OCR API key:
```env
OCR_SPACE_API_KEY=your_free_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🧪 Testing

The repository utilizes Vitest for fast, reliable unit and integration tests.

```bash
# Run the test suite
npm run test

# Run tests in watch mode
npx vitest watch
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
