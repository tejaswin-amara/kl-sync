# Contributing to Awesome Dev Pipeline

Thank you for your interest in contributing to the **Awesome Dev Pipeline**! This project aims to provide a curated, production-ready, and honestly-caveated guide to modern developer tooling, frameworks, infrastructure, and AI agent workflows.

To maintain the highest editorial and technical quality, all contributions must adhere to the standards, inclusion criteria, and formatting rules described below.

---

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Tool Inclusion Criteria](#tool-inclusion-criteria)
- [Table Schema & Formatting Rules](#table-schema--formatting-rules)
- [License Caveat Guidelines](#license-caveat-guidelines)
- [Step-by-Step Contribution Workflow](#step-by-step-contribution-workflow)
- [Pull Request Checklist](#pull-request-checklist)
- [Verification & Automated CI](#verification--automated-ci)
- [Code of Conduct](#code-of-conduct)

---

## Core Philosophy

1. **Battle-Tested over Hype**: We prioritize tools with proven production track records, active maintenance, and tangible developer velocity benefits.
2. **Brutal Honesty**: Every technology has trade-offs. We mandate real-world caveats (memory overhead, license restrictions, migration friction, scaling bottlenecks) for every single entry.
3. **Actionable Defaults for AI Agents**: Each category features an explicit "Agent Default" recommendation to guide human developers and autonomous coding agents toward battle-tested defaults without decision fatigue.
4. **Zero Fluff & Zero Marketing**: Descriptions must be technical, precise, and concise.

---

## Tool Inclusion Criteria

Before proposing a new tool, ensure it meets all of the following requirements:

1. **Active Maintenance**:
   - The repository must have active development with commits, releases, or issue triage within the last **3 months**.
   - Deprecated, unmaintained, or abandoned projects will be rejected or pruned.
2. **Community Adoption & Track Record**:
   - Minimum threshold of **≥1,000 GitHub stars** or clear industry-standard consensus (e.g., standard tooling maintained by foundational organizations like the Linux Foundation, Apache Software Foundation, or major runtime vendors).
3. **Clear Licensing**:
   - The project must have a clear, publicly declared license (OSI-approved open source or well-defined source-available/commercial license).
   - Any restrictive terms (AGPL copyleft, BSL non-compete, Fair-Code Sustainable Use) must be explicitly disclosed.
4. **Mandatory Honest Caveat**:
   - Submissions lacking substantive, real-world caveats will be **rejected**.
   - Do not write marketing summaries like "No known downsides" or "Easy to use". Document real architectural trade-offs, bundle size costs, cold-start latency, or operational burdens.

---

## Table Schema & Formatting Rules

All tool tables in `README.md` must strictly conform to the 7-column Markdown schema:

| Column | Header | Description | Example |
|---|---|---|---|
| 1 | `Tool` | Bold tool name with link | `**Ghostty**` |
| 2 | `GitHub / URL` | GitHub repository slug (`owner/repo`) or official URL | `[ghostty-org/ghostty](https://github.com/ghostty-org/ghostty)` |
| 3 | `Stars` | Approximate GitHub star count formatted with `~` and `k` suffix | `~25k` |
| 4 | `License` | SPDX license identifier or short name | `MIT / Custom` |
| 5 | `Core Capabilities` | Concise, comma-separated strengths and key features | `Native GPU acceleration, Zig-powered, native tabs, cross-platform` |
| 6 | `Honest Caveats` | Critical trade-offs, limitations, or license warnings | `New ecosystem, Windows build in active development` |
| 7 | `Agent Default` | Operational default status or role designation | `Alt Default (macOS/Linux)` |

### Markdown Table Syntax Rules
- Escape pipe characters (`\|`) inside table cells if used in text.
- Maintain consistent column dividers.
- Do not omit columns; every row must have all 7 cells populated.

---

## License Caveat Guidelines

When submitting or updating tools with non-permissive or source-available licenses, you must include an explicit **LICENSE ALERT** in the Honest Caveats column and reference the corresponding open-source alternative:

- **AGPL-3.0** (e.g., MinIO): Must note copyleft network trigger requiring backend source disclosure if modified.
- **BSL 1.1 / FSL** (e.g., Terraform, Sentry, Dragonfly): Must disclose commercial hosting restrictions and timeline conversion dates.
- **RSALv2 / SSPLv1** (e.g., Redis, MongoDB): Must disclose source-available status and suggest open forks (e.g., Valkey).
- **Sustainable Use / Fair-Code** (e.g., n8n): Must disclose restrictions against commercial managed service offerings.

---

## Step-by-Step Contribution Workflow

1. **Check Existing Listings & Issues**:
   - Search `README.md`, `CLAUDE.md`, and open issues/PRs to avoid duplicate submissions.
2. **Fork and Create a Branch**:
   ```bash
   git checkout -b feat/add-valkey-cache-guide
   ```
3. **Update Documentation**:
   - Add the tool to the appropriate table in `README.md`.
   - Ensure the Table of Contents and GFM heading anchors remain synchronized.
   - If proposing a new agent default or updating trade-off notes, maintain cross-file consistency.
4. **Run Verification Locally**:
   ```bash
   # Run link, anchor, and schema audit
   npm run verify
   ```
5. **Commit with Conventional Commit Message**:
   ```bash
   git commit -m "docs: add Valkey to in-memory caching matrix with Redis comparison"
   ```
6. **Open a Pull Request**:
   - Provide a clear summary of why the tool was added or updated.
   - Attach the completed PR checklist.

---

## Pull Request Checklist

When submitting a PR, copy and check the following list in your description:

```markdown
### PR Checklist
- [ ] Tool meets active maintenance criteria (commits/releases within last 3 months).
- [ ] Tool has ≥1,000 GitHub stars or verifiable industry standard consensus.
- [ ] License is explicitly identified with SPDX identifier.
- [ ] Real-world "Honest Caveats" are thoroughly documented (no marketing fluff).
- [ ] Markdown table strictly follows the 7-column schema.
- [ ] Table of Contents anchor links in `README.md` are valid and resolve cleanly.
- [ ] Local verification suite passes with 0 errors (`npm run verify`).
```

---

## Verification & Automated CI

All pull requests trigger automated GitHub Actions CI (`.github/workflows/ci.yml`), which executes:
- Markdown link and local file target auditing.
- Heading anchor slug verification conforming to GitHub Flavored Markdown (GFM) specifications.
- License caveat validation for restricted/source-available packages.
- Strict Markdown table schema compliance.

PRs will only be merged once all CI quality gates pass.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment. All contributors and maintainers are expected to treat others with respect, empathy, and professional courtesy.
