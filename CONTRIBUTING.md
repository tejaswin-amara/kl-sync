# Contributing to KL Sync

Thanks for your interest in improving KL Sync! This document outlines how to contribute effectively.

## Before you start

KL Sync is an independent student project with no affiliation to KL University. Contributions are welcome, but keep in mind:

- This is a best-effort project maintained in spare time
- Breaking changes to the ERP scraper happen when the university updates their system
- We prioritize stability and privacy over feature velocity

## How to contribute

### Reporting bugs

If you find a bug, [open an issue](https://github.com/tejaswin-amara/kl-sync/issues) with:

1. **What you expected** — the behavior you were trying to achieve
2. **What actually happened** — what went wrong, including error messages or screenshots
3. **How to reproduce it** — step-by-step instructions so we can see it ourselves
4. **Your environment** — browser, OS, whether you're using the PWA or web version

If it's a security issue (e.g., credentials being logged or sent over plaintext), please email instead of opening a public issue. See [Security](#security) below.

### Suggesting features

New features are welcome, but understand the scope:

- **In scope:** improving the UI/UX, fixing parser bugs, adding new ERP modules, optimizing performance
- **Out of scope:** features that require storing student data on our server, changing how the ERP itself works

Before investing time, [open an issue](https://github.com/tejaswin-amara/kl-sync/issues) to discuss the feature first. That way you won't spend hours on something we can't merge.

### Writing code

1. **Fork** the repo and clone your fork locally.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a branch** with a clear name:
   ```bash
   git checkout -b fix/captcha-ocr-timeout
   git checkout -b feat/exam-seating-alerts
   ```

4. **Make your changes.** If you're touching the ERP scraper:
   - Test against a real ERP login (use your own credentials, don't commit them)
   - Document any new modules or fields you extract
   - Update `src/lib/scraper.ts` comments if the HTML structure changes

5. **Keep commits clean:**
   - One logical change per commit
   - Write clear commit messages: `fix: captcha solver timeout on slow networks`
   - Don't mix formatting fixes with feature changes

6. **Test your work:**
   ```bash
   npm run dev       # start dev server
   npm run build     # check production build
   npx tsc --noEmit # type-check
   ```

7. **Push to your fork** and [open a pull request](https://github.com/tejaswin-amara/kl-sync/pulls).

### Pull request guidelines

- **Link the issue:** if your PR fixes or addresses an open issue, reference it in the description (`Closes #42`)
- **Keep it focused:** one feature or fix per PR. If you're touching multiple unrelated things, split them
- **Write a clear description:** explain *why* the change is needed, not just *what* changed
- **Be patient:** maintainer availability is limited; it may take a few days to review

## Code style

- **TypeScript:** use strict mode. Run `npx tsc --noEmit` to check for errors.
- **React:** use functional components and hooks. Follow the patterns in existing components.
- **Formatting:** we don't enforce a formatter, but keep code readable — use clear variable names and comment non-obvious logic.
- **Secrets:** never commit API keys, passwords, or session tokens. Use environment variables.

## ERP scraper changes

If you're updating the parser because KL University changed their ERP HTML:

1. Document what changed (in the commit message or a comment)
2. Update the parsing logic in `src/lib/scraper.ts`
3. Test it with a real login
4. Note the change in the PR description so users know why they should update

## Security

If you discover a security vulnerability:

- **Do not open a public issue**
- Email `tejaswinamara@klh.edu.in` with details
- Include steps to reproduce, the severity, and any potential workarounds
- Allow a few days for a response before disclosing publicly

## License

By contributing, you agree that your code will be released under the same terms as the project (see [`LICENSE`](LICENSE)).

## Questions?

Open an issue or ask in the PR discussion. We're here to help.

---

**Thank you for contributing!** Even small fixes and improvements make KL Sync better for everyone.
