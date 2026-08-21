# Governance

## Decision-Making Model

KL Sync operates under a **BDFL (Benevolent Dictator For Life)** governance model.

The BDFL is **Tejaswin Amara** (tejaswinamara@gmail.com).

## Maintainer Roles

- **Owner / BDFL**: Final authority on all architectural decisions, merges, releases, and project direction.
- **Contributor**: Anyone who has successfully submitted a Pull Request that was merged into the repository.
- **Reviewer**: Trusted, long-term contributors who are invited by the BDFL to triage issues and review Pull Requests.

## Request for Comments (RFC) Process

For significant architectural changes, new dashboard modules, or major workflow alterations, we use an RFC process:

1. **Draft an RFC**: Open a new GitHub Issue with the `[RFC]` prefix in the title.
2. **Community Discussion**: The RFC must remain open for a minimum of **7 days** to allow contributors and reviewers to discuss the proposal, critique the implementation, and suggest alternatives.
3. **Final Decision**: After the discussion period, the BDFL will review the arguments and make a final decision (Accept, Reject, or Request Revisions) along with a documented rationale.

## Architectural Principles

All decisions, RFCs, and code contributions must align with the core architectural principles of KL Sync:

1. **The Ponytail Philosophy**: YAGNI, zero bloat, and standard libraries over third-party dependencies.
2. **Security-First**: AES-256-GCM session encryption, SSRF protection, and stateless operation.
3. **Accessibility-First**: Strict adherence to WCAG 2.2 AAA standards (contrast ≥ 7.1:1, touch targets ≥ 44px).
4. **Stateless Edge Architecture**: No databases, no persistent user storage, deploying directly to serverless edge functions.
