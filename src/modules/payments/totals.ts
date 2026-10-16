/**
 * Pure payment / invoice-payment-state math (client-safe, unit-tested). CHF,
 * 2-decimal rounding. Only `succeeded`, non-archived payments count toward the
 * invoice's amount_paid (P10-D5/D13). The server-side
 * `recalculateInvoicePaymentState` (in actions) uses these helpers — this file is
 * the single source of the math. No partial-refund math in P10.
 */

/** Round to 2 decimals (half-up, EPSILON-corrected). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** amount_paid = round2(Σ amount of succeeded, non-archived payments). */
export function computeAmountPaid(
  payments: ReadonlyArray<{ status: string; archivedAt: string | null; amount: number }>,
): number {
  const sum = payments
    .filter((p) => p.status === 'succeeded' && !p.archivedAt)
    .reduce((acc, p) => acc + p.amount, 0);
  return round2(sum);
}

/** balance_due = max(0, total − amount_paid) (overpayment clamps at 0). */
export function computeBalanceDue(total: number, amountPaid: number): number {
  return round2(Math.max(0, total - amountPaid));
}

/** Whether the invoice is overpaid (amount_paid strictly above total). */
export function isOverpaid(total: number, amountPaid: number): boolean {
  return round2(amountPaid) > round2(total);
}

/** Client-safe money label, e.g. "CHF 1'234.50" (2 decimals). */
export function formatMoney(amount: number, currency = 'CHF'): string {
  return `${currency} ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
