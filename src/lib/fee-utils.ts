/**
 * Fee calculation and parsing utilities for ERP fee tables.
 */

/**
 * Safely parses currency values into clean float numbers.
 * Handles ₹, $, €, £, ¥, commas, spaces, currency text ('INR', 'Rs', 'USD', etc.),
 * and accounting parens: (1,500.00) -> -1500.
 */
export function parseCurrency(val: any): number {
  if (val === null || val === undefined || typeof val === 'boolean') {
    return 0;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }

  let str = String(val).trim();
  if (
    !str ||
    str === '-' ||
    str.toLowerCase() === 'n/a' ||
    str.toLowerCase() === 'nil' ||
    str.toLowerCase() === 'none'
  ) {
    return 0;
  }

  let isNegative = false;

  // Handle accounting parens: (1,500.00) or (₹1,500)
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  }

  // Check for leading minus
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  }

  // Strip currency symbols and common currency text
  str = str
    .replace(/[₹$€£¥]/g, '')
    .replace(/\b(inr|rs\.?|usd|eur|gbp|cr|dr)\b/gi, '')
    .replace(/,/g, '')
    .trim();

  // If after stripping currency symbols it starts with minus
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  }

  // Match standard number with optional decimal
  const match = str.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;

  const parsed = parseFloat(match[0]);
  if (isNaN(parsed)) return 0;

  return isNegative ? -parsed : parsed;
}

/**
 * Normalizes header keys by lowercasing, stripping duplicate suffix (_1, _2), and trimming.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_\d+$/, '').trim();
}

/**
 * Dynamically finds the status column key using priority fuzzy matching
 * while excluding payment date/method/mode/ref/receipt/txn columns.
 */
export function findStatusKey(row: Record<string, any>): string | undefined {
  if (!row || typeof row !== 'object') return undefined;

  const keys = Object.keys(row);

  const nonStatusPayKeywords = [
    'date',
    'method',
    'mode',
    'id',
    'ref',
    'type',
    'name',
    'number',
    'txn',
    'transaction',
    'receipt',
    'bank',
    'gateway',
    'time',
    'by',
    'to',
    'from',
    'chq',
    'cheque',
    'dd',
    'upi',
  ];

  // Priority 1: Explicit status/state columns
  const p1 = keys.find((k) => {
    const norm = normalizeKey(k);
    return (
      norm.includes('payment status') ||
      norm.includes('pay status') ||
      norm.includes('fee status') ||
      norm.includes('due status') ||
      norm.includes('payment state') ||
      norm.includes('fee state')
    );
  });
  if (p1) return p1;

  // Priority 2: Generic status or state
  const p2 = keys.find((k) => {
    const norm = normalizeKey(k);
    if (
      norm === 'status' ||
      norm === 'state' ||
      norm.includes('status') ||
      norm.includes('state')
    ) {
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
 * Dynamically finds the due/balance amount column key using priority fuzzy matching
 * while excluding paid/concession/scholarship/date/id columns.
 */
export function findDueAmountKey(row: Record<string, any>): string | undefined {
  if (!row || typeof row !== 'object') return undefined;

  const keys = Object.keys(row);

  const exclusionKeywords = [
    'paid',
    'received',
    'concession',
    'scholarship',
    'discount',
    'waived',
    'waiver',
    'refund',
    'date',
    'id',
    'type',
    'name',
    'head',
    'desc',
    'description',
    'sl',
    'no',
    'code',
    's.no',
    'sn',
    'remarks',
    'status',
    'mode',
    'method',
    'receipt',
    'ref',
    'txn',
  ];

  // Priority Tier 1: Explicit Due / Balance / Pending / Payable Amount headers
  const tier1Patterns = [
    'amount due',
    'due amount',
    'balance due',
    'balance amount',
    'unpaid amount',
    'payable amount',
    'pending amount',
    'balance',
    'due',
    'pending',
    'unpaid',
    'payable',
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
  const tier2Patterns = [
    'total due',
    'net due',
    'net amount',
    'amount',
    'fee amount',
    'total amount',
    'fee',
  ];

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
 * Detects summary or total rows (e.g. "Total", "Grand Total", "Subtotal").
 */
export function isSummaryRow(row: Record<string, any>): boolean {
  if (!row || typeof row !== 'object') return false;

  const summaryKeywords = [
    'total',
    'grand total',
    'subtotal',
    'sub-total',
    'sub total',
    'sum',
    'overall',
    'net total',
  ];

  return Object.values(row).some((val) => {
    if (typeof val === 'string') {
      const vNorm = val.toLowerCase().trim();
      if (summaryKeywords.includes(vNorm)) return true;
      return summaryKeywords.some(
        (k) => vNorm.startsWith(`${k} `) || vNorm.startsWith(`${k}:`)
      );
    }
    return false;
  });
}

/**
 * Determines whether a row represents an unpaid or pending fee item.
 */
export function isRowUnpaid(row: Record<string, any>): boolean {
  if (!row || typeof row !== 'object') return false;

  const statusKey = findStatusKey(row);
  const dueKey = findDueAmountKey(row);
  const dueAmount = dueKey ? parseCurrency(row[dueKey]) : 0;

  const unpaidStatusKeywords = [
    'unpaid',
    'pending',
    'due',
    'partial',
    'partially paid',
    'partially',
    'not paid',
    'not-paid',
    'waiting',
    'overdue',
    'awaiting',
    'un-paid',
    'un paid',
  ];

  const paidStatusKeywords = [
    'paid',
    'completed',
    'cleared',
    'settled',
    'nil',
    'full',
    'fully paid',
  ];

  if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null) {
    const statusVal = String(row[statusKey]).toLowerCase().trim();

    const matchesUnpaid = unpaidStatusKeywords.some((kw) =>
      statusVal.includes(kw)
    );
    if (matchesUnpaid) return true;

    const matchesPaid =
      paidStatusKeywords.some((kw) => statusVal.includes(kw)) &&
      !statusVal.includes('partially') &&
      !statusVal.includes('partial') &&
      !statusVal.includes('not') &&
      !statusVal.includes('un');

    if (matchesPaid) {
      return dueAmount > 0;
    }
  }

  // If status key is absent/blank, check if balance due > 0
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
