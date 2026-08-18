# 🤝 Contributing to KL Sync

First of all, thank you for your interest in contributing to **KL Sync**! Whether you are fixing a minor styling bug, updating the Cheerio scraper logic to match a new ERP HTML layout, or adding a new logistical feature to the dashboard, your help is incredibly valuable to the student community.

This project is built by students, for students. To ensure the codebase remains maintainable, lightweight, and fast, we adhere strictly to the **Ponytail Philosophy** (detailed below). 

Please read this exhaustive guide before writing any code or submitting a Pull Request.

---

## 🎨 The Ponytail Philosophy (Code Style & Architecture)

KL Sync is built on the principle that **the best code is the code never written.** We prioritize extreme minimalism and actively reject over-engineering.

Before opening a PR, ensure your contribution adheres to these core tenets:
1. **YAGNI (You Aren't Gonna Need It)**: Do not add speculative features or abstractions that *might* be useful later. 
2. **Standard Library & Native Platform Over Dependencies**: Do not introduce new heavy npm packages if the browser or Next.js can do it natively. (For example, we use standard CSS `@keyframes` instead of `framer-motion`, and standard `fetch` instead of `axios`).
3. **Flat UI Components**: Avoid deeply nested React component wrappers (e.g., nesting `<Card>` inside `<CardWrapper>`). Use semantic HTML elements (`<div>`, `<section>`) combined with Tailwind CSS v4 utility classes.
4. **TypeScript**: Use strict TypeScript. Avoid `any` types for new features, but do not waste time overly typing legacy scraper DOM parsing if it works predictably.
5. **Security**: NEVER commit `.env` files, API keys, or raw `PHPSESSID` / `kl_erp_session` strings to the repository.

---

## 🛠️ Step-by-Step Contribution Workflow

### 1. Discuss Before You Build
To avoid wasting your time on a feature that might be rejected for adding bloat:
- Check the [Issues tracker](https://github.com/tejaswin-amara/kl-sync/issues) for open tasks.
- If you want to build a new feature or perform a large refactor, **open a new issue** to discuss the architectural approach first. Wait for a maintainer to approve the concept.

### 2. Local Environment Setup
1. **Fork** the repository to your own personal GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/kl-sync.git
   cd kl-sync
   ```
3. **Install Dependencies**:
   Ensure you are using **Node.js 20+**.
   ```bash
   npm install
   ```
4. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and set a 32+ character `SESSION_SECRET` for testing local session encryption.

### 3. Make Your Changes
1. **Create a Dedicated Branch**:
   Use descriptive, hyphenated names.
   ```bash
   git checkout -b fix/attendance-layout-overflow
   # or
   git checkout -b feat/exam-seating-alerts
   ```
2. **Write the Code**: 
   - Keep it minimal.
   - If modifying `src/lib/scraper.ts`, thoroughly test the Cheerio DOM selectors against a live ERP HTML response.
   - Document any new JSON structures you are extracting from the ERP.
3. **Respect the Stack**: Stick exclusively to Next.js App Router paradigms (Client vs. Server components) and Tailwind CSS v4.

### 4. Exhaustive Local Verification
Before committing, you **must** verify that your changes do not break the build or introduce regressions.

1. **Test the UI**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and verify your feature visually on both desktop and mobile viewports.
2. **Run TypeScript Check & Linter**:
   Ensure zero type errors and zero ESLint warnings:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
3. **Run Automated Test Suites**:
   Run the 320-test unit/integration suite and 9-test AI benchmark:
   ```bash
   npm test
   npx tsx scripts/agent-as-judge.ts
   ```
4. **Verify the Production Build**:
   Next.js Turbopack compilation and static generation MUST pass:
   ```bash
   npm run build
   ```

### 5. Commit & Push
- Write clear, imperative commit messages (e.g., `fix: correct attendance calculation edge case` or `feat: add hostel fee parser`).
- Push the branch to your fork:
  ```bash
  git push -u origin your-branch-name
  ```

### 6. Open a Pull Request (PR)
- Navigate to the original `tejaswin-amara/kl-sync` repository on GitHub.
- Click **"Compare & pull request"**.
- **Link the Issue**: Mention the issue number your PR resolves (e.g., `Closes #42`).
- **Explain Your Changes**: Detail exactly *what* you changed, *why* it was necessary, and *how* you tested it.
- **Review**: A maintainer will review your code. You may be asked to simplify logic or remove abstractions to align with the Ponytail philosophy.

---

## 🔒 Security Vulnerabilities

If you discover a vulnerability while reading the codebase (e.g., a CSRF flaw or an encryption bypass), **do not open a public issue or PR**. 

Please follow our strict disclosure guidelines detailed in [SECURITY.md](SECURITY.md) and report it privately via email to `tejaswinamara@gmail.com`.

---

## 📄 License Agreement

By contributing to KL Sync, you agree that your contributions will be licensed under the project's strict proprietary and source-available license. See the [`LICENSE`](LICENSE) file for complete legal details.

---

**Thank you for contributing!** KL Sync thrives because of students like you taking the time to improve the ecosystem.
