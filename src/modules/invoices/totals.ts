/**
 * Pure invoice-totals math (client-safe, unit-tested). Net (ex-VAT) line prices,
 * CHF, 2-decimal rounding. The server-side `recalculateInvoiceTotals` (in actions)
 * reads the lines and rewrites the stored totals using these helpers — this file
 * is the single source of the math. No tax engine: `tax_amount` is a stored value
 * (the 8.1% helper only suggests one). `discount_amount` is flat, invoice-level.
 */

/** Round to 2 decimals (half-up, EPSILON-corrected). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** One line: line_subtotal = round(quantity * unit_price); line_total = line_subtotal. */
export function computeLine(quantity: number, unitPrice: number): { lineSubtotal: number; lineTotal: number } {
  const lineSubtotal = round2(quantity * unitPrice);
  return { lineSubtotal, lineTotal: lineSubtotal };
}

/** Invoice: subtotal = Σ lineTotal; total = max(0, subtotal − discount + tax). */
export function computeInvoiceTotals(
  lines: ReadonlyArray<{ lineTotal: number }>,
  discountAmount: number,
  taxAmount: number,
): { subtotal: number; total: number } {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const total = round2(Math.max(0, subtotal - discountAmount + taxAmount));
  return { subtotal, total };
}

/** Balance due = max(0, total − amount_paid). */
export function computeBalanceDue(total: number, amountPaid: number): number {
  return round2(Math.max(0, total - amountPaid));
}

/** Suggested Swiss VAT (8.1%) on (subtotal − discount), for the optional UI helper only. */
export function suggestedTax(subtotal: number, discountAmount: number): number {
  return round2(Math.max(0, subtotal - discountAmount) * 0.081);
}

/** Client-safe money label, e.g. "CHF 1'234.50" (2 decimals). */
export function formatMoney(amount: number, currency = 'CHF'): string {
  return `${currency} ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
