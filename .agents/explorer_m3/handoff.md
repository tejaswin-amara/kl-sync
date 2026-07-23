# Handoff Report — Milestone M3 (R3. Accurate & Flexible Fee Due Calculation)

**Agent**: Explorer M3  
**Working Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m3`  
**Project Root**: `C:\Users\speed\Documents\antigravity\optimistic-pascal`  
**Date**: 2026-07-24  

---

## 1. Observation

### Current Implementation & Code Locations

1. **Dashboard Fee Due Calculation**: `src/app/dashboard/page.tsx` (Lines 253–298)
   ```typescript
   // Fetch Fee Data independently with flexible column key matching
   fetch('/api/erp-proxy/fee')
     .then((res) => res.json())
     .then((resData) => {
       if (resData.success && resData.data && resData.data.length > 0) {
         const pending = resData.data
           .filter((row: any) => {
             const statusKey = Object.keys(row).find(
               (k) =>
                 k.toLowerCase().includes('status') ||
                 k.toLowerCase().includes('pay')
             );
             const status = statusKey
               ? String(row[statusKey]).toLowerCase()
               : '';
             const isUnpaid =
               status.includes('not paid') ||
               status.includes('waiting') ||
               status.includes('pending') ||
               status.includes('due') ||
               status.includes('unpaid');
             return isUnpaid || (!statusKey && true);
           })
           .reduce((sum: number, row: any) => {
             const dueKey = Object.keys(row).find(
               (k) =>
                 k.toLowerCase().includes('due') ||
                 k.toLowerCase().includes('balance') ||
                 k.toLowerCase().includes('pending')
             );
             const amountKey =
               dueKey ||
               Object.keys(row).find(
                 (k) =>
                   k.toLowerCase().includes('amount') ||
                   k.toLowerCase().includes('fee') ||
                   k.toLowerCase().includes('total')
               );
             const amt = amountKey ? parseFloat(String(row[amountKey])) || 0 : 0;
             return sum + amt;
           }, 0);
         setPendingFee(pending);
         localStorage.setItem('kl_dashboard_fee', pending.toString());
       }
     })
     .catch(console.error);
   ```

2. **Fee Details Page**: `src/app/dashboard/fee/page.tsx` (Lines 106–191)
   ```typescript
   // Determine status for styling
   let status = 'Unknown';
   const statusKey = Object.keys(row).find(
     (k) =>
       k.toLowerCase().includes('status') ||
       k.toLowerCase().includes('pay')
   );
   if (statusKey) status = String(row[statusKey]).toLowerCase();

   const isPaid = status.includes('paid') && !status.includes('not');
   const isPending =
     status.includes('pending') ||
     status.includes('not paid') ||
     status.includes('waiting');

   // ...
   // Amount regex check in column iteration:
   if (
     typeof val === 'string' &&
     /^-?\d+(\.\d+)?$/.test(val.trim()) &&
     (colName.includes('amount') ||
       colName.includes('fee') ||
       colName.includes('scholarship') ||
       colName.includes('concession') ||
       colName.includes('balance'))
   ) {
     const numVal = parseFloat(val.trim());
     displayVal = numVal < 0 ? `-₹${Math.abs(numVal)}` : `₹${val.trim()}`;
   }
   ```

3. **ERP Scraper Generic Table Parser**: `src/lib/scraper.ts` (Lines 379–454)
   - `parseGenericTable(html)` extracts headers from `table.find('thead tr').last()` or `table.find('tr').first()`.
   - Handles duplicate headers by appending `_1`, `_2` (e.g. `Amount`, `Amount_1`).
   - Returns array of key-value objects `Record<string, string>[]`.

---

## 2. Logic Chain

From direct code observation, the current Fee Due calculation fails under several real-world ERP table variations:

### Flaw 1: Flawed Status Column Key Detection
- **Observation**: `statusKey = Object.keys(row).find((k) => k.toLowerCase().includes('status') || k.toLowerCase().includes('pay'))`.
- **Reasoning**:
  - `k.toLowerCase().includes('pay')` matches non-status columns such as `"Payment Date"`, `"Payment Mode"`, `"Payer Name"`, or `"Payee ID"` before matching `"Status"` or `"Fee Status"`.
  - If a row has keys `["Fee Head", "Payment Date", "Amount", "Balance", "Payment Status"]`, `Object.keys(row).find` matches `"Payment Date"`, whose value is a date string like `"2025-01-15"`.
  - `status = String(row["Payment Date"]).toLowerCase()` evaluates to `"2025-01-15"`, which matches neither paid nor unpaid keywords.
  - Furthermore, status column names like `"State"`, `"Fee Status"`, `"Due Status"`, or `"Payment State"` are missed or misidentified.

### Flaw 2: Flawed Amount Column Priority (Gross Fee vs. Balance Due)
- **Observation**:
  ```typescript
  const dueKey = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes('due') ||
      k.toLowerCase().includes('balance') ||
      k.toLowerCase().includes('pending')
  );
  const amountKey =
    dueKey ||
    Object.keys(row).find(
      (k) =>
        k.toLowerCase().includes('amount') ||
        k.toLowerCase().includes('fee') ||
        k.toLowerCase().includes('total')
    );
  ```
- **Reasoning**:
  - If `dueKey` is not found, `amountKey` falls back to matching `"amount"`, `"fee"`, or `"total"`.
  - `"fee"` or `"total"` matches `"Total Fee"`, `"Fee Amount"`, `"Gross Fee"`, `"Fee Head"`, or `"Fee Description"`.
  - Matching gross fee columns (e.g. Total Fee = ₹50,000 when Paid = ₹50,000 and Balance = ₹0) results in counting fully paid fees as pending due!
  - Matching string description columns like `"Fee Head"` (`"Tuition Fee"`) causes `parseFloat("Tuition Fee")` to return `NaN` -> `0`.

### Flaw 3: Brittle Currency Parsing
- **Observation**: `parseFloat(String(row[amountKey])) || 0` and `/^-?\d+(\.\d+)?$/.test(val.trim())`.
- **Reasoning**:
  - Raw ERP values often include currency symbols (`₹ 5,000`, `$1,200`), thousands separators (`12,500.00`), text prefixes (`INR 5000`, `Rs. 5000`), or trailing spaces.
  - `parseFloat("₹ 5,000.00")` returns `NaN` (due to leading `₹`), which defaults to `0`.
  - `parseFloat("12,500.00")` stops parsing at the comma and returns `12` instead of `12500`!
  - Regex `/^-?\d+(\.\d+)?$/` fails on `"12,500"`, `"₹5000"`, or `"5000.00 "` in `fee/page.tsx`.

### Flaw 4: Missing Status Value Keywords & Fallbacks
- **Observation**: `isUnpaid = status.includes('not paid') || status.includes('waiting') || status.includes('pending') || status.includes('due') || status.includes('unpaid')`.
- **Reasoning**:
  - ERP tables use alternative status values such as `"Partial"`, `"Partially Paid"`, `"Overdue"`, `"Un-Paid"`, `"Awaiting Payment"`.
  - If the status column is absent or blank (common in summary rows or simplified ERP views), `(!statusKey && true)` includes every single row indiscriminately.
  - Does not evaluate explicit non-zero balance (`dueAmount > 0`) when status text is ambiguous or blank.

### Flaw 5: Double Counting from Summary / Total Rows
- **Observation**: The reducer iterates over all elements of `resData.data`.
- **Reasoning**:
  - ERP HTML tables frequently include a summary footer row (e.g. `{ "Fee Type": "Total", "Balance": "15,000" }`).
  - If row-by-row items sum to 15,000 and the summary row is also included, the total pending fee is calculated as 30,000 (double counting).

---

## 3. Caveats

1. **ERP Structural Variations**:
   - ERP tables may format totals in `<tfoot>` or as the last `<tr>` in `<tbody>`.
   - Different semesters or student profiles may have single-table vs multi-table outputs.
2. **Read-Only Scope**:
   - As an Explorer agent, code changes are proposed in this report and ready for implementation by the Implementer agent.

---

## 4. Conclusion & Recommended Code Changes

To achieve accurate, flexible Fee Due calculation across all ERP table variations, we recommend creating a centralized, pure helper module `src/lib/fee-utils.ts` and refactoring `src/app/dashboard/page.tsx` and `src/app/dashboard/fee/page.tsx` to consume it.

### Proposed Module: `src/lib/fee-utils.ts`

```typescript
/**
 * Fee calculation and parsing utilities for ERP fee tables.
 */

/**
 * Safely parses currency values into clean float numbers.
 * Handles ₹, $, €, £, ¥, commas, spaces, currency text ('INR', 'Rs'), and accounting parens (1,500) -> -1500.
 */
export function parseCurrency(val: any): number {
  if (val === null || val === undefined || typeof val === 'boolean') {
    return 0;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }

  let str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'nil') {
    return 0;
  }

  // Handle accounting negative format (1,234.50) -> -1234.50
  let isNegative = false;
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.slice(1, -1);
  }

  // Strip currency symbols and text
  str = str
    .replace(/[₹$€£¥]/g, '')
    .replace(/\b(inr|rs\.?|usd|eur|gbp|cr|dr)\b/gi, '')
    .replace(/,/g, '')
    .trim();

  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1);
  }

  const cleanStr = str.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanStr);

  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

/**
 * Normalizes header keys by lowercasing and stripping duplicate suffix (_1, _2).
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_\d+$/, '').trim();
}

/**
 * Dynamically finds the status column key using priority fuzzy matching.
 */
export function findStatusKey(row: Record<string, any>): string | undefined {
  const keys = Object.keys(row);
  const nonStatusPayKeywords = [
    'date', 'method', 'mode', 'id', 'ref', 'type',
    'name', 'number', 'txn', 'receipt', 'bank', 'gateway'
  ];

  // Priority 1: Explicit status/state columns
  const p1 = keys.find((k) => {
    const norm = normalizeKey(k);
    return (
      norm.includes('payment status') ||
      norm.includes('pay status') ||
      norm.includes('fee status') ||
      norm.includes('due status')
    );
  });
  if (p1) return p1;

  // Priority 2: Generic status or state
  const p2 = keys.find((k) => {
    const norm = normalizeKey(k);
    if (norm === 'status' || norm === 'state' || norm.includes('status') || norm.includes('state')) {
      return true;
    }
    if (norm.includes('pay')) {
      return !nonStatusPayKeywords.some((ex) => norm.includes(ex));
    }
    return false;
  });
  if (p2) return p2;

  // Priority 3: Fallback to remarks or condition
  return keys.find((k) => {
    const norm = normalizeKey(k);
    return norm.includes('remark') || norm.includes('condition');
  });
}

/**
 * Dynamically finds the due/balance amount column key using priority fuzzy matching.
 */
export function findDueAmountKey(row: Record<string, any>): string | undefined {
  const keys = Object.keys(row);

  const exclusionKeywords = [
    'paid', 'received', 'concession', 'scholarship', 'discount',
    'waived', 'refund', 'date', 'id', 'type', 'name', 'head',
    'desc', 'description', 'sl', 'no', 'code', 's.no'
  ];

  // Priority Tier 1: Explicit Due / Balance / Pending / Payable Amount headers
  const tier1Patterns = [
    'amount due', 'due amount', 'balance due', 'balance amount',
    'unpaid amount', 'payable amount', 'pending amount',
    'balance', 'due', 'pending', 'unpaid', 'payable'
  ];

  for (const pattern of tier1Patterns) {
    const match = keys.find((k) => {
      const norm = normalizeKey(k);
      if (exclusionKeywords.some((ex) => norm.includes(ex))) return false;
      return norm.includes(pattern);
    });
    if (match) return match;
  }

  // Priority Tier 2: Fallback to generic amount / fee / total (only if Tier 1 is absent)
  const tier2Patterns = ['total due', 'net amount', 'amount', 'fee amount', 'total amount', 'fee'];
  for (const pattern of tier2Patterns) {
    const match = keys.find((k) => {
      const norm = normalizeKey(k);
      if (exclusionKeywords.some((ex) => norm.includes(ex))) return false;
      return norm.includes(pattern);
    });
    if (match) return match;
  }

  return undefined;
}

/**
 * Detects summary or total rows (e.g. "Total", "Grand Total").
 */
export function isSummaryRow(row: Record<string, any>): boolean {
  const summaryKeywords = ['total', 'grand total', 'subtotal', 'sum', 'overall', 'net total'];
  return Object.values(row).some((val) => {
    if (typeof val === 'string') {
      const vNorm = val.toLowerCase().trim();
      return summaryKeywords.includes(vNorm) || summaryKeywords.some((k) => vNorm === k || vNorm.startsWith(`${k} `));
    }
    return false;
  });
}

/**
 * Determines whether a row represents an unpaid or pending fee item.
 */
export function isRowUnpaid(row: Record<string, any>): boolean {
  const statusKey = findStatusKey(row);
  const dueKey = findDueAmountKey(row);
  const dueAmount = dueKey ? parseCurrency(row[dueKey]) : 0;

  const unpaidStatusKeywords = [
    'unpaid', 'pending', 'due', 'partial', 'partially paid',
    'not paid', 'not-paid', 'waiting', 'overdue', 'awaiting',
    'un-paid', 'un paid'
  ];

  const paidStatusKeywords = ['paid', 'completed', 'cleared', 'settled', 'nil', 'full', 'fully paid'];

  if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null) {
    const statusVal = String(row[statusKey]).toLowerCase().trim();

    const matchesUnpaid = unpaidStatusKeywords.some((kw) => statusVal.includes(kw));
    if (matchesUnpaid) return true;

    const matchesPaid = paidStatusKeywords.some((kw) => statusVal.includes(kw)) &&
                        !statusVal.includes('partially') &&
                        !statusVal.includes('not');
    if (matchesPaid) {
      return dueAmount > 0;
    }
  }

  // If status is absent/ambiguous, check if balance due > 0
  return dueAmount > 0;
}

/**
 * Calculates total pending fee due from array of ERP fee rows.
 */
export function calculatePendingFee(data: Record<string, any>[]): number {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }

  const detailRows = data.filter((row) => !isSummaryRow(row));
  const rowsToProcess = detailRows.length > 0 ? detailRows : data;

  return rowsToProcess.reduce((sum, row) => {
    if (isRowUnpaid(row)) {
      const dueKey = findDueAmountKey(row);
      if (dueKey) {
        const amt = parseCurrency(row[dueKey]);
        return sum + (amt > 0 ? amt : 0);
      }
    }
    return sum;
  }, 0);
}
```

---

## 5. Verification Method

To verify the proposed implementation once applied:

1. **Linting and Build Verification**:
   ```bash
   npm run lint
   npm run build
   ```
2. **Unit / Edge Case Testing**:
   Create a test suite (e.g. `src/lib/fee-utils.test.ts`) covering:
   - Currency strings: `"₹ 12,500.00"`, `"12,500"`, `"$ 500"`, `"INR 2,500"`, `"N/A"`, `"-"`, `null`.
   - Dynamic status keys: `"Payment Status"`, `"Pay Status"`, `"Fee Status"`, `"Status"`, `"State"`.
   - Key exclusions: `"Payment Date"` and `"Payment Mode"` must NOT be selected as status keys.
   - Balance vs Gross key priorities: `"Balance Due"` preferred over `"Total Fee Amount"`.
   - Summary row filtering: Table containing detail rows + Grand Total row must not double count.
   - Status values: `"Partially Paid"`, `"Overdue"`, `"Unpaid"`, `"Paid"` with non-zero balance.

---
