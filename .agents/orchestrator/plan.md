# Plan: Vercel Production Deployment & SESSION_SECRET Hardening

## Objective
Fix the live CAPTCHA endpoint 500 error on Vercel (`https://klhb.vercel.app/api/captcha`) by generating a secure random 32-byte secret, configuring it as `SESSION_SECRET` in Vercel production environment via Vercel CLI, re-deploying to Vercel production (`vercel --prod`), and verifying that `https://klhb.vercel.app/api/captcha` returns HTTP 200 with `captchaImage`.

## Milestones & Work Items
1. **M5: Vercel Secret Configuration & Production Deployment**
   - Step 1: Generate a secure 32+ byte random secret.
   - Step 2: Configure `SESSION_SECRET` in Vercel production environment (`vercel env add SESSION_SECRET production`).
   - Step 3: Re-deploy the application to production (`vercel --prod`).
   - Step 4: Verify `vercel env ls production` shows `SESSION_SECRET`.
   - Step 5: Verify live endpoint `https://klhb.vercel.app/api/captcha` returns HTTP 200 with `captchaImage` JSON response.
   - Step 6: Ensure no secret is hardcoded in codebase or committed to git repository.

2. **M6: Final Review & Forensic Audit Verification**
   - Independent verification of live endpoint and Vercel environment listing.
   - Verify code integrity (no hardcoded secrets or dummy implementations).

## Execution Strategy
- Dispatch `teamwork_preview_worker` to execute Vercel CLI commands, deployment, and live endpoint verification.
- Dispatch `teamwork_preview_auditor` to audit integrity and confirm live endpoint 200 response & Vercel env listing.
- Synthesize findings into final handoff and report to user.
