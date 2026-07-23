## 2026-07-23T19:20:09Z
You are Implementation Worker M3 for Milestone M3 (R3. Accurate & Flexible Fee Due Calculation).
Your working directory is C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m3.
Project root is C:\Users\speed\Documents\antigravity\optimistic-pascal.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task Scope (Requirement R3):
Update Fee Due calculation in `src/app/dashboard/page.tsx` and `src/app/dashboard/fee/page.tsx` to dynamically detect status columns (status, pay status, payment status) and due/balance amount columns (balance, due, pending, amount) instead of hardcoding exact string keys.

Specific Instructions:
1. Read the design and specifications in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3\handoff.md`.
2. Create `src/lib/fee-utils.ts`:
   - `parseCurrency(val)`: handles currency symbols (₹, $, €, £), text ('INR', 'Rs'), commas, spaces, and accounting parentheses.
   - `findStatusKey(row)`: priority fuzzy matching for status/state columns while excluding payment date/method/mode/ref columns.
   - `findDueAmountKey(row)`: priority fuzzy matching for due/balance/pending/payable headers while excluding paid/concession/scholarship columns.
   - `isSummaryRow(row)`: detects and filters out total/grand total summary footer rows to prevent double counting.
   - `isRowUnpaid(row)`: evaluates status keywords ('unpaid', 'pending', 'due', 'partial', 'overdue', 'not paid') and non-zero balance due.
   - `calculatePendingFee(data)`: sums unpaid fee due amounts across detail rows.
3. Refactor `src/app/dashboard/page.tsx` and `src/app/dashboard/fee/page.tsx` to consume `src/lib/fee-utils.ts` for Fee Due calculations and formatting.
4. Run `npm run build` and ensure 0 TypeScript and Next.js build errors.
5. Document all changes and build output in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m3\handoff.md`.
6. Send a completion message back to parent orchestrator.
