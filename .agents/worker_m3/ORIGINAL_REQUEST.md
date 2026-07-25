## 2026-07-24T04:24:01Z
<USER_REQUEST>
You are Worker M3 (teamwork_preview_worker).
Your task is to implement Milestone M3 (R3. Accurate & Flexible Fee Due Calculation) in kl-sync.
Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m3

Key input files:
- Read analysis report in:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3\handoff.md
- Code target files:
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\lib\fee-utils.ts
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\page.tsx
  - C:\Users\speed\Documents\antigravity\optimistic-pascal\src\app\dashboard\fee\page.tsx

Requirements for Fee Due calculation:
1. Update `src/lib/fee-utils.ts` to implement `parseCurrency`, `findStatusKey`, `findDueAmountKey`, `isSummaryRow`, `isRowUnpaid`, and `calculatePendingFee`.
2. Safe Currency Parsing: Handle currency symbols (₹, $, €), commas ("12,500.00"), text prefixes ("INR", "Rs."), and accounting parentheses.
3. Status Column Matching: Dynamically detect status columns (`payment status`, `pay status`, `fee status`, `status`, `state`). Exclude non-status columns like `Payment Date` or `Payment Mode`.
4. Due Amount Key Priority: Prioritize due/balance columns (`amount due`, `due amount`, `balance due`, `balance`, `due`, `pending`, `unpaid`) over gross fee columns (`total fee`, `gross fee`).
5. Exclude Paid Fees: Ensure paid rows (`status.includes('paid')`) with zero balance due are NOT counted as pending due.
6. Summary Row Filtering: Detect and exclude summary/footer total rows ("Total", "Grand Total") to avoid double-counting.
7. Refactor `src/app/dashboard/page.tsx` and `src/app/dashboard/fee/page.tsx` to consume `src/lib/fee-utils.ts`.

Run `npm run build` after making changes to verify TypeScript and Next.js build compilation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m3\handoff.md detailing your changes, build results, and send a message back to parent.
</USER_REQUEST>
