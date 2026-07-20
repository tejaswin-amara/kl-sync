# 🔒 Security Policy

Security is a top priority for KL Sync, especially given that it handles sensitive student ERP credentials and data. We take vulnerabilities seriously and appreciate the community's help in keeping the project safe.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in KL Sync, **please report it responsibly**.  
**Do NOT open a public GitHub issue.**

### How to Report

Please email **`tejaswinamara@gmail.com`** with the following details:

1. **What the vulnerability is** — A clear, concise description of the issue.
2. **Where it is located** — The specific file, function, or feature that is affected.
3. **How to reproduce it** — Step-by-step instructions or a minimal code example.
4. **What the impact is** — What could an attacker potentially do? (e.g., steal credentials, access another student's data, manipulate server state).
5. **Suggested fix (Optional)** — If you have an idea on how to resolve it, we'd love to hear it.

### Resolution Timeline

- **Day 0**: You send the report.
- **Days 1–3**: I will acknowledge receipt and ask clarifying questions if needed.
- **Days 4–14**: I will work on and test a fix.
- **Day 15**: The fix is merged and released as a new version. You will be credited in the release notes (if you opt-in).

### What Happens Next

Once a fix is officially released, you are absolutely welcome to:
- Publish a detailed writeup of the vulnerability.
- Disclose it publicly on social media.
- Request credit in the release notes.

> **Warning**: **Before** a fix is released, please keep the vulnerability confidential. Public disclosure before a patch is available actively puts KL Sync users at risk.

---

## 🧠 Known Security Limitations

### 1. Session Storage
Your ERP session (cookies + CSRF token) is encrypted using **AES-256-GCM**, but *only if* you set the `SESSION_SECRET` environment variable. If you don't:
- The session falls back to basic base64 encoding, which provides **zero** security.
- Anyone with access to your browser's local cookies could potentially impersonate your ERP login.
- **Fix**: ALWAYS set a strong `SESSION_SECRET` if you deploy this anywhere publicly.

### 2. Credentials in Memory
Your ERP username and password are used exactly **once** during login and are then discarded. They are never written to disk or logged anywhere.
However, if an attacker gains access to your running server's RAM (e.g., a compromised cloud provider or a bad actor on shared hosting), they *could* theoretically recover credentials during the split-second login request. This is an inherent limitation of client-server authentication and is not specific to KL Sync.

### 3. Privacy in Transit
KL Sync communicates with `newerp.kluniversity.in` over secure HTTPS. Your session stays encrypted locally. However:
- If you are using someone else's deployed instance of KL Sync, your session **passes through their server**.
- If their server is compromised, your data is at risk.
- **Safest option**: Self-host KL Sync or run it locally on your own machine.

### 4. Third-party Dependencies
KL Sync uses several npm packages (Next.js, React, Tailwind, etc.). While we keep them updated, there is always a risk of an upstream bug. If you discover one:
1. Report it to the package maintainers first.
2. Let us know so we can quickly upgrade our dependencies.
3. If the vulnerability is specific to *how* KL Sync uses that package, please report it to us directly.

---

## 🛑 What We Do NOT Cover

The following are considered out of scope for our security policy:
- **Social Engineering**: Someone tricking you into giving them your password or session cookie.
- **Physical Access**: Someone accessing your unlocked laptop or phone.
- **Network-level Attacks**: Someone intercepting your local Wi-Fi traffic with a rogue certificate or executing Man-in-the-Middle (MITM) attacks.

These are operational risks that fall outside the scope of this application's code.

---

## ❓ Questions?

If you're ever unsure whether something qualifies as a security issue, please ask. It is **always** better to report something that turns out to be fine than to ignore an actual vulnerability.

**Contact**: `tejaswinamara@gmail.com`

---
*Thank you for helping keep KL Sync secure!*
