# Contributing to KL Sync

First off, thank you for considering contributing to KL Sync. It's people like you that make this tool better for everyone.

## The Ponytail Philosophy

KL Sync strictly adheres to the "Ponytail Philosophy":

- **YAGNI (You Aren't Gonna Need It)**: Do not add features or complexity anticipating future needs.
- **Stdlib over dependencies**: We prefer native web APIs, Node.js built-ins, and vanilla CSS over third-party libraries.
- **Deletion over addition**: Removing code is better than adding code.
- **Zero bloat**: Keep bundle sizes minimal.

## Banned Dependencies

Do **NOT** add the following dependencies. PRs introducing them will be rejected.

- `lucide-react`, `@heroicons/react` (Use the native zero-runtime SVG library)
- `swr`, `@tanstack/react-query` (Use native React features and Next.js data fetching)
- `clsx`, `tailwind-merge` (Use template literals)
- `framer-motion` (Use CSS transitions/animations)
- `axios` (Use native `fetch`)
- `lodash`, `underscore` (Use native ES6+ methods)
- `moment`, `dayjs`, `date-fns` (Use native `Intl.DateTimeFormat`)

## Step-by-Step Contribution Lifecycle

1. **Discuss Before Building**: Always check [Issues](https://github.com/tejaswin-amara/kl-sync/issues) first. If your idea isn't there, open an issue to discuss it before writing code.
2. **Fork & Clone**: Fork the repository and clone it locally.
3. **Branch Naming**: Use the format `<type>/<description>`. Valid types:
   - `feat/`: New features
   - `fix/`: Bug fixes
   - `docs/`: Documentation updates
   - `refactor/`: Code refactoring (no functional changes)
   - `test/`: Adding or updating tests
   - `chore/`: Maintenance tasks
4. **Local Environment Setup**:
   - Ensure you are running Node 20+.
   - Run `npm install`.
   - Run `cp .env.example .env.local` and configure your local variables.
5. **Code Changes**: Ensure your changes comply with our stack (Next.js 16 App Router, Tailwind CSS v4, TypeScript 5.8). Use strict typing.
6. **Pre-commit Verification**: Before committing, ensure all checks pass:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test`
   - `npm run build`
7. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - Examples: `feat: add library module`, `fix: resolve attendance parsing issue`
8. **PR Submission**: Submit a Pull Request. Link the relevant issue, describe your changes, and confirm tests pass.
9. **Review Process**: The maintainer will review your PR for compliance with the Ponytail Philosophy and project architecture.

## Security

If you find a security vulnerability, do **NOT** open an issue. See [SECURITY.md](SECURITY.md) for instructions on how to privately report it.

## License Agreement

By contributing to KL Sync, you agree that your contributions will be licensed under its strict proprietary, source-available license. KL Sync is **not** MIT licensed or open source.
