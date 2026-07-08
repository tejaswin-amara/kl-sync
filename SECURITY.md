# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in KL Sync, **please report it responsibly.** Do not open a public GitHub issue.

### How to report

Email `tejaswinamara@klh.edu.in` with:

1. **What the vulnerability is** — a clear description of the issue
2. **Where it is** — which file, function, or feature is affected
3. **How to reproduce it** — step-by-step instructions or a code example
4. **What the impact is** — what could an attacker do? (e.g., steal credentials, access another student's data)
5. **Suggested fix** (optional) — if you have an idea for how to fix it

### Timeline

- **Day 0:** You send the report
- **Days 1–3:** I'll acknowledge receipt and ask clarifying questions if needed
- **Days 4–14:** I'll work on a fix
- **Day 15:** Fix is released as a new version; you're credited in the release notes (optional)

### What happens next

Once a fix is released, you're welcome to:
- Publish a detailed writeup of the vulnerability
- Disclose it publicly on social media
- Request credit in the release notes

**Before** a fix is released, keep it quiet. Public disclosure before a patch puts users at risk.

## Known security limitations

### Session storage

Your ERP session (cookies + CSRF token) is encrypted with AES-256-GCM *if* you set `SESSION_SECRET` as an environment variable. If you don't:

- The session falls back to base64 encoding, which is not secure
- Anyone with access to your browser's cookies can impersonate your ERP login
- **Fix:** always set `SESSION_SECRET` if you deploy this publicly

### Credentials in memory

Your username and password are used once during login, then discarded. They're never written to disk or logged.

However, if someone has access to your running server's memory (e.g., a compromised cloud provider or shared hosting), they *could* theoretically recover credentials during the login request. This is an inherent limitation of client-server authentication — it's not specific to KL Sync.

### Privacy in transit

KL Sync communicates with `newerp.kluniversity.in` over HTTPS (encrypted). Your session stays encrypted locally. But:

- If you're using someone else's deployment of KL Sync (not self-hosting), your session passes through their server
- If their server is compromised, your session is at risk
- **Safe option:** self-host KL Sync or run it locally on your machine

### Third-party dependencies

KL Sync uses several npm packages (React, Next.js, etc.). While we keep them up to date, there's always a risk that a dependency has a bug. If you discover one:

1. Report it to the package maintainers first
2. Then let us know so we can upgrade
3. If it's specific to KL Sync's use of that package, report it here

## What we do NOT cover

- Social engineering (e.g., someone tricks you into giving them your password)
- Physical access (someone with your laptop can do anything)
- Network-level attacks (e.g., someone intercepts HTTPS traffic on your WiFi with a rogue certificate)

These are risks you should address separately.

## Questions?

If you're unsure whether something is a security issue, ask. It's better to report something that turns out to be fine than to miss an actual vulnerability.

Email: `tejaswinamara@klh.edu.in`

---

**Thank you for helping keep KL Sync secure.**
