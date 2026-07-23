# BRIEFING — 2026-07-24T00:48:30Z

## Mission
Analyze current Fee Due calculation in dashboard/fee pages and propose flexible dynamic column matching and currency parsing recommendations for Milestone M3.

## 🔒 My Identity
- Archetype: Teamwork Explorer
- Roles: Read-only investigator
- Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3
- Original parent: c877f3ab-7cf2-4e66-83ce-2783c400be36
- Milestone: M3 (R3. Accurate & Flexible Fee Due Calculation)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement changes in src/
- Deliver complete handoff.md in working directory
- Send completion message to parent when done

## Current Parent
- Conversation ID: c877f3ab-7cf2-4e66-83ce-2783c400be36
- Updated: 2026-07-24T00:48:30Z

## Investigation State
- **Explored paths**:
  - `src/app/dashboard/page.tsx` (lines 253-298)
  - `src/app/dashboard/fee/page.tsx` (lines 22-198)
  - `src/lib/scraper.ts` (lines 379-455: parseGenericTable)
  - `src/lib/constants.ts`, `src/lib/utils.ts`
- **Key findings**:
  - Current Fee Due calculation uses crude `.includes('pay')` for status and `.includes('fee')` / `.includes('total')` for amount keys, causing misidentification of payment method/date as status and gross fee amount as balance due.
  - Currency values are parsed using plain `parseFloat()` or strict regex `/^-?\d+(\.\d+)?$/`, which fails on `₹`, `$`, commas (e.g. `12,500`), spaces, or `INR`.
  - Status value matching misses `'partial'`, `'partially paid'`, `'overdue'`, `'unpaid'`, `'un-paid'`, and ignores explicit balance amount fallback when status is missing/ambiguous.
  - No handling of Summary / Total rows, leading to potential double-counting.
- **Unexplored areas**: None.

## Key Decisions Made
- Formulated centralized helper design `src/lib/fee-utils.ts` for dynamic column detection, status evaluation, safe currency parsing, and total calculation.

## Artifact Index
- ORIGINAL_REQUEST.md — task description
- BRIEFING.md — working memory index
- handoff.md — complete 5-component handoff report (to be created)
