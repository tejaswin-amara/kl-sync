## 2026-08-03T15:55:34Z
You are a Worker agent for KL Sync frontend redesign project (Milestone 2).
Your working directory is C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_worker_m2_1.
Read C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\ORIGINAL_REQUEST.md, C:\Users\speed\Documents\antigravity\optimistic-pascal\PROJECT.md, and C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_explorer_m2_1\handoff.md before starting work.
Project root: C:\Users\speed\Documents\antigravity\optimistic-pascal.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective for Milestone 2 (Landing Page, Login Modal & Dual CAPTCHA Integration - R2):
1. Update `src/components/Captcha.tsx` to provide visual status feedback badge (`PoW Bot Protection Active` / solving spinner) and maintain reliable `onVerify(token)` callback.
2. Refactor `src/app/page.tsx` using M1 UI primitives:
   - Use `Card` (`variant="glass"`), `Input` (with `User` and `Lock` icons), `Button` (with `isLoading`), `Badge` (`variant="emerald" dot={true}`), and `Dialog` (for security info modal).
   - Implement Asymmetric branding split view on desktop (`w-[45%] lg:flex`) and centered sign-in card on right.
   - Dual CAPTCHA & ERP Auto-OCR Refresh Flow: high-contrast captcha image, editable code input, 1-click refresh `<Button variant="outline" size="icon">`, submit button gated by `disabled={loading || !captchaToken}`.
   - Form state & error alerts: error alert banner (`AlertCircle`, `bg-red-500/10 border-red-500/20 text-red-400`) and status alert banner (`ShieldCheck`, `bg-blue-500/10 border-blue-500/20 text-blue-400`).
   - First-time device registration (`needsCaptchaRetry`) auto-retry UX with `deviceId` stored in `localStorage` and single-retry captcha refresh.
   - Credentials persistence (`rememberMe`) handling `remember_username` and `remember_password` in `localStorage`.
3. Execute and verify all 3 commands:
   - `npm run lint` (0 warnings/errors)
   - `npm run test` (All unit tests pass)
   - `npm run build` (0 TypeScript errors, exit code 0)
4. Document changes and command results in C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\teamwork_preview_worker_m2_1\handoff.md.

When done, send a message to parent orchestrator with your report location and summary.
