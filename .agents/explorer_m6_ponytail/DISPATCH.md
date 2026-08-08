## 2026-08-08T06:11:41Z
You are the Ponytail Audit Explorer for KL Sync ERP client project.

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m6_ponytail
Project root: C:\Users\speed\Documents\antigravity\optimistic-pascal

MANDATORY Context: Read ORIGINAL_REQUEST.md (at C:\Users\speed\Documents\antigravity\optimistic-pascal\ORIGINAL_REQUEST.md) and PROJECT.md (at C:\Users\speed\Documents\antigravity\optimistic-pascal\PROJECT.md) first.

Your objective:
Perform a comprehensive repo-wide audit for over-engineering following /ponytail protocols (see ponytail-audit skill).
Scan the entire codebase (`src/lib/`, `src/hooks/`, `src/components/`, `src/app/`, `scripts/`) for over-engineering, dead code, unused abstractions, single-implementation interfaces, single-caller wrappers, and hand-rolled logic that standard library or Next.js 16 / React 19 native features already provide.

Categorize findings using standard tags:
- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

Formulate a ranked list of findings (biggest cut first) with at least the top 5 areas of bloat or over-engineering (or explicitly confirming perfection if lean).

Create the artifact `ponytail_audit_detailed.md` at project root `C:\Users\speed\Documents\antigravity\optimistic-pascal\ponytail_audit_detailed.md` containing the detailed ranked audit report following the `/ponytail` format:
`<tag> <what to cut>. <replacement>. [path]`
Ending with: `net: -<N> lines, -<M> deps possible.` (or `Lean already. Ship.`).

Also output your report to `handoff.md` in your working directory (`C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m6_ponytail\handoff.md`) and notify the parent orchestrator via send_message.
