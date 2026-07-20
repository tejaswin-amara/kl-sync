# 🤝 Contributing to KL Sync

First of all, thank you for your interest in contributing to **KL Sync**! Whether you're fixing a small bug, updating the scraper logic, or adding a new feature to the dashboard, your help is incredibly valuable.

This project is built by students, for students. We want to keep it lightweight, fast, and easy to maintain.

---

## 🛠️ How to Contribute

### 1. Find an Issue
- Check the [Issues tracker](https://github.com/tejaswin-amara/kl-sync/issues) for open tasks.
- If you want to build a new feature, please **open a new issue** to discuss it first before writing code. This ensures your work aligns with the project's minimalist goals (the "Ponytail" philosophy).

### 2. Set Up Locally
1. **Fork** the repository to your own GitHub account.
2. **Clone** it locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/kl-sync.git
   cd kl-sync
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

### 3. Make Your Changes
1. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b fix/layout-overflow
   # or
   git checkout -b feat/exam-seating-alerts
   ```
2. **Write clean code.** Keep it minimal and avoid over-engineering.
3. If you are modifying the ERP scraper (`src/lib/scraper.ts`):
   - Test against a real ERP login locally.
   - Comment on any complex DOM traversal logic.
   - Document any new JSON structures you are extracting.

### 4. Test Your Work
Before committing, ensure everything builds cleanly without errors.
```bash
npm run dev       # Verify it looks right
npm run build     # Verify the production build succeeds
npx tsc --noEmit  # Check for TypeScript errors
```

### 5. Commit & Push
- Write clear, concise commit messages (e.g., `fix: dashboard attendance calculation bug`).
- Keep commits logical and focused on a single issue.
- Push to your fork:
  ```bash
  git push -u origin your-branch-name
  ```

### 6. Open a Pull Request (PR)
- Open a PR from your fork's branch to the `master` branch of `tejaswin-amara/kl-sync`.
- **Link the issue**: If your PR fixes an open issue, mention it (e.g., `Closes #42`).
- **Explain your changes**: Briefly describe *why* the change is needed and *what* it does.
- Maintainers will review your PR as soon as possible!

---

## 🎨 Code Style & Philosophy

> **The Ponytail Philosophy**: "The best code is the code never written." Keep it simple. Avoid bloated dependencies. 

- **TypeScript**: Use strict mode. Avoid `any` types wherever possible.
- **React/Next.js**: Use functional components, hooks, and App Router paradigms (`server` vs `client` components).
- **Styling**: We use **Tailwind CSS v4**. Stick to utility classes and avoid custom CSS unless absolutely necessary.
- **Secrets**: NEVER commit API keys, `.env` files, or session tokens.

---

## 🔒 Security

If you discover a security vulnerability in KL Sync, please **do not open a public issue**. Follow the guidelines in our [Security Policy](SECURITY.md) and report it privately.

## 📄 License Agreement

By contributing to KL Sync, you agree that your code will be released under the same terms as the project. See the [`LICENSE`](LICENSE) for details.

---

**Thank you for contributing!** Even small fixes and improvements make KL Sync better for everyone.
