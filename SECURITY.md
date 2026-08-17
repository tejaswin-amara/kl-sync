# 🔒 Security Policy & Threat Model

Security is a foundational pillar of **KL Sync**. Because the application acts as an intermediary for highly sensitive student ERP credentials, academic records, and financial fee data, we maintain a strict, uncompromising security posture. 

This document exhaustively details our threat model, known limitations, and the mandated process for responsibly reporting vulnerabilities.

---

## 🚨 Reporting a Vulnerability (Responsible Disclosure)

If you discover a security vulnerability, flaw in the session encryption, or any exploit that could compromise student data, **you must report it responsibly**.  

**Do NOT open a public GitHub issue, Pull Request, or GitHub Discussion regarding the vulnerability.** Public disclosure before a patch is available actively puts KL Sync users at risk.

### How to Report

Please send a detailed email directly to **`tejaswinamara@gmail.com`**. Your report must be exhaustive and include the following details:

1. **Vulnerability Type** — A clear, concise description of the issue (e.g., Cross-Site Scripting (XSS), AES-256-GCM encryption bypass, CSRF token leakage).
2. **Location** — The exact file path, function, or API endpoint that is affected (e.g., `src/lib/session.ts` line 42).
3. **Reproduction Steps** — Exhaustive, step-by-step instructions or a minimal Proof of Concept (PoC) code example to reproduce the exploit.
4. **Threat Impact** — What could an attacker realistically accomplish? (e.g., impersonate another student's session, manipulate server state, decrypt raw cookies).
5. **Suggested Remediation (Optional)** — If you are familiar with the codebase, provide a suggested fix or architectural mitigation.

### Resolution Timeline & SLA

We adhere to the following Service Level Agreement (SLA) for security reports:
- **Day 0**: You submit the report via email.
- **Days 1–3 (Triage)**: The maintainer will acknowledge receipt, verify the exploit, and ask clarifying questions if needed.
- **Days 4–14 (Remediation)**: The maintainer will develop, test, and verify a patch locally to ensure it does not break upstream ERP proxying.
- **Day 15 (Release)**: The patch is merged into the `master` branch and released. You will be credited in the GitHub Release notes (if you explicitly opt-in to public acknowledgment).

### Post-Release Disclosure

Once a fix is officially released and deployed, you are entirely welcome and encouraged to:
- Publish a detailed technical write-up of the vulnerability on your blog.
- Disclose the CVE or bug details publicly on social media.
- Request explicit credit in the repository's release notes.

---

## 🧠 Threat Model & Known Architectural Limitations

Due to the nature of proxying a legacy ERP, KL Sync has specific inherent architectural limitations. These are documented heavily here so contributors and deployers understand the risk surface.

### 1. Client-Side Session Storage & Encryption
**The Flow**: Upon successful authentication at `/api/login`, the ERP returns raw `PHPSESSID` and CSRF tokens. KL Sync bundles these strings and stores them in the user's browser as the `kl_erp_session` cookie.

**The Risk**: If this cookie is stored as plaintext, anyone with access to the user's browser or network intercept could steal the cookie and impersonate the student on the actual ERP.

**The Mitigation**: KL Sync uses **AES-256-GCM** encryption to encrypt the cookie payload before sending it to the browser.
- **Mandate**: In production (`NODE_ENV=production`), omitting `SESSION_SECRET` triggers an explicit `[SECURITY FATAL]` exception at startup/invocation, preventing insecure deployments. You MUST set a strong 32+ character `SESSION_SECRET` in your environment. In development mode, a local fallback key is used with console warnings.

### 2. Ephemeral Credentials in Memory
**The Flow**: Your ERP username and password are submitted to `/api/login`, used exactly **once** to authenticate against `newerp.kluniversity.in`, and immediately discarded.

**The Risk**: The credentials are never written to disk or database. However, during the split-second HTTP POST request, the credentials exist in the server's RAM. If an attacker gains root access to the hosting server (e.g., a compromised Vercel account or a malicious server admin), they could theoretically execute a memory dump and recover credentials mid-flight.
- **Mandate**: This is an inherent limitation of server-side proxy authentication. If you require absolute zero-trust privacy, you must self-host the application locally.

### 3. Privacy in Transit (Man-in-the-Middle)
**The Flow**: KL Sync communicates with `newerp.kluniversity.in` exclusively over secure HTTPS. 

**The Risk**: If you are using a public, third-party hosted instance of KL Sync, your encrypted session passes through *their* server. If that server is compromised, the operator has access to the decryption keys (`SESSION_SECRET`).
- **Mandate**: We do not guarantee the security of third-party hosted instances. Use them at your own risk.

### 4. Supply Chain Vulnerabilities (Third-Party Dependencies)
KL Sync minimizes dependencies to reduce supply-chain risks (the "Ponytail Philosophy"). However, we still rely on Next.js, React, Tailwind CSS, and Cheerio.
If you discover a vulnerability in an upstream dependency:
1. Report it to the upstream package maintainers first.
2. Notify us via email so we can expedite a dependency version bump.
3. If the vulnerability is specific to *how* KL Sync implements the package, report it directly to us following the disclosure rules above.

---

## 🛑 Out of Scope

The following vectors are explicitly considered out of scope for our security policy and should not be reported as vulnerabilities:
- **Social Engineering**: Phishing attempts tricking a user into handing over their ERP password or `kl_erp_session` cookie.
- **Physical Device Access**: An attacker accessing a student's unlocked laptop or mobile phone.
- **Local Network Attacks**: An attacker executing Man-in-the-Middle (MITM) attacks on a compromised public Wi-Fi network (bypassing SSL).
- **Upstream ERP Vulnerabilities**: Any vulnerabilities that exist on the official `newerp.kluniversity.in` servers (e.g., SQL injections on the ERP itself). You must report those directly to KL University IT.

---

## ❓ Questions or Ambiguities?

If you are ever unsure whether a behavior qualifies as a security vulnerability or a standard bug, **assume it is a security issue**. It is always better to report something privately that turns out to be harmless than to publicly expose an actual exploit.

**Contact**: `tejaswinamara@gmail.com`

---
*Thank you for helping keep the KL Sync community secure!*
