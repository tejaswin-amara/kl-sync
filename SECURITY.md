# Security Policy

## Supported Versions

We take security seriously. Please note which versions of KL Sync are currently supported with security updates.

| Version | Supported          | Notes                                  |
| ------- | ------------------ | -------------------------------------- |
| 2.4.x   | :white_check_mark: | Active development & security updates. |
| 2.3.x   | :white_check_mark: | Security fixes only.                   |
| 2.2.x   | :x:                | End of life.                           |
| 2.1.x   | :x:                | End of life.                           |
| 2.0.x   | :x:                | End of life.                           |
| < 2.0   | :x:                | End of life.                           |

## Vulnerability Disclosure Policy

If you discover a security vulnerability within KL Sync, please do **NOT** open a public issue.

Instead, report it privately via email to **tejaswinamara@gmail.com**. You may optionally use PGP encryption if preferred.

## SLA Timeline

We aim to adhere to the following timeline for security vulnerabilities:

- **Day 0**: Vulnerability submitted.
- **Days 1-3**: Triage and acknowledgment of the report.
- **Days 4-14**: Remediation and patch development.
- **Day 15**: Coordinated release of the security patch.

## Threat Model

KL Sync operates as a stateless edge proxy. Our threat model focuses on:

- **Session Encryption**: Protecting ephemeral credentials via AES-256-GCM.
- **MITM (Man-in-the-Middle)**: Ensuring secure transit between the client, edge proxy, and upstream ERP.
- **Supply Chain**: Maintaining zero-bloat, strict dependency minimization to reduce supply chain risks.
- **Compliance**: Adhering to GDPR, CCPA/CPRA, HIPAA, PIPEDA/CPPA, LGPD, DPDPA, PIPL, and 152-FZ regarding data handling.

## Out of Scope

The following are considered out of scope for our bug bounty and vulnerability disclosure:

- Social engineering (phishing, vishing, etc.) against KL Sync users or maintainers.
- Physical access to user devices or servers.
- Vulnerabilities in the upstream university ERP system itself (report those to the university).
- Denial of Service (DoS/DDoS) attacks against the hosted proxy.

## Security Architecture

KL Sync is built with a security-first architecture:

- **Stateless Edge**: No databases. No user data is stored persistently.
- **AES-256-GCM**: Used via the Web Crypto API to securely encrypt session tokens.
- **SSRF Protection**: Hardened fetch wrappers to prevent Server-Side Request Forgery against internal networks.
- **`SESSION_SECRET`**: A cryptographically secure 32-byte hex string is strictly required in production environments to seed the encryption algorithm.

## Post-Release Disclosure Policy

After a patch is released, a public security advisory will be published in the GitHub repository detailing the vulnerability, its impact, and the steps taken to resolve it. Contributors who reported the vulnerability will receive appropriate credit unless they request to remain anonymous.
