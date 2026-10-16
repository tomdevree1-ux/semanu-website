/**
 * Client-safe display helpers for subscription money/intervals (P12A). Amounts are SNAPSHOTS
 * from Stripe (Stripe is authoritative); currency may be any Stripe currency, not only CHF.
 */
export function formatSubAmount(amount: number | null, currency: string | null, interval: string | null): string {
  if (amount == null) return '—';
  const cur = (currency || 'CHF').toUpperCase();
  let base: string;
  try {
    base = new Intl.NumberFormat('de-CH', { style: 'currency', currency: cur }).format(amount);
  } catch {
    base = `${cur} ${amount.toFixed(2)}`;
  }
  return interval ? `${base} / ${interval}` : base;
}

/** Short, human plan label: the internal plan key when known, else the Stripe price id. */
export function planLabel(planKey: string | null, stripePriceId: string | null): string {
  if (planKey) return planKey.charAt(0).toUpperCase() + planKey.slice(1);
  return stripePriceId || '—';
}
