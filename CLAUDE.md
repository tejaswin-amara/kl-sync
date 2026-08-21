# KL Sync (kl-sync) - Claude/Anthropic AI Agent Manifesto

## 1. PROJECT IDENTITY
- **Project Name**: KL Sync (`kl-sync`)
- **Version**: 2.4.0
- **Author**: Tejaswin Amara (tejaswinamara@gmail.com)
- **License**: Strict Proprietary & Source-Available (NOT MIT, NOT open source)
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript 5.8
- **Architecture**: Edge Proxy (Stateless, no DB). Session tokens encrypted with AES-256-GCM.
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens
- **Icon Engine**: Native zero-runtime SVG library (57 primitives)
- **Testing**: Native Node.js Test Runner (node:test) + Playwright E2E + Agent-as-Judge AI suite
- **Deployment**: Vercel (serverless edge functions)

## 2. PRIME DIRECTIVES
- **Ponytail Philosophy**: YAGNI, zero bloat, stdlib over deps, deletion over addition. Shortest working diff wins. If stdlib can do it, use stdlib.
- **Security**: Never store plaintext passwords. Always use `encodeSession`/`decodeSession` for session management. Validate SSRF origins. `SESSION_SECRET` is required in prod.
- **Accessibility**: WCAG 2.2 AAA compliance. Contrast ratio must be >= 7.1:1. Touch targets must be >= 44px.

## 3. BANNED DEPENDENCIES
DO NOT USE OR IMPORT ANY OF THE FOLLOWING:
- Icons: `lucide-react`, `heroicons`, `react-icons`
- Data Fetching: `swr`, `tanstack-query`, `axios`
- Styling/Animation: `clsx`, `classnames`, `tailwind-merge`, `framer-motion`, `motion`, CSS-in-JS
- Date/Time: `moment`, `dayjs`, `date-fns`
- Testing: `jest`, `vitest`, `mocha`
- Crypto: `crypto-js`, `bcrypt`
- Backend/DB: `express`, `fastify`, `prisma`, `drizzle`, `mongoose`
- Utils: `lodash`, `underscore`

## 4. CODING STANDARDS
- **Icons**: Use `@/components/ui/icons` for ALL icon needs.
- **Styling**: Use Tailwind CSS v4 utility classes. NEVER use inline styles.
- **TypeScript**: Strict TypeScript only. No `any` (prefer `unknown`).
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Naming Conventions**: 
  - Files/directories: `kebab-case`
  - React Components: `PascalCase`
  - Functions/variables: `camelCase`
- **Exports**: No default exports for non-page components.
- **Logging**: No `console.log` in production. Use proper error boundaries.

## 5. TESTING REQUIREMENTS
- All unit tests use the native `node:test` runner.
- Required checks before committing:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm test` (320+ tests must pass)
  - `npm run build` (verify production build)

## 6. ARCHITECTURE RULES
- **Storage**: No database, no ORM, no persistent storage.
- **State**: Session state is managed via AES-256-GCM encrypted cookies.
- **Scrapers**: Located in `src/lib/scrapers/`. Use Cheerio for HTML -> JSON parsing.
- **API Routes**: Located in `src/app/api/`. Must be edge proxy endpoints.
- **Dashboard Pages**: Located in `src/app/dashboard/`. These are client components.

## 7. FILE STRUCTURE
- `src/app/api/`: Edge proxy endpoints
- `src/app/dashboard/`: Client-side dashboard pages (11 modules)
- `src/components/ui/`: Reusable UI components
- `src/components/ui/icons.tsx`: Native zero-runtime SVG library
- `src/lib/scrapers/`: HTML to JSON scraper functions
- `globals.css`: Tailwind directives + Vanilla CSS tokens

## 8. PROMPT WORKFLOWS
- **Add icon**: Add a new SVG primitive to `src/components/ui/icons.tsx` following the existing structure. No external deps.
- **Add dashboard module**: Create the route in `src/app/dashboard/`. Build client components using Tailwind CSS and native icons.
- **Fix scraper**: Update the Cheerio logic in the respective `src/lib/scrapers/` file. Ensure output matches the expected JSON structure.
- **Update test**: Use `node:test`. No Jest/Vitest matchers. Run `npm test` to verify.
