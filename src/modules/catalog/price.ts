/**
 * Client-safe price formatting for the catalog. No dashes (project copy rule):
 * "one time", "per month", "per year". Net (ex-VAT) amounts.
 */
export function formatCatalogPrice(p: {
  basePrice: number | null;
  currency: string;
  priceIsFrom: boolean;
  billingInterval: string;
}): string {
  if (p.basePrice == null) return 'Price on request';
  const amount = `${p.currency} ${p.basePrice.toLocaleString('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
  const interval =
    p.billingInterval === 'one_time' ? 'one time' : p.billingInterval === 'yearly' ? 'per year' : 'per month';
  return `${p.priceIsFrom ? 'From ' : ''}${amount} ${interval}`;
}

/** Optional setup-fee label, or null when there is none. */
export function formatSetupFee(setupFee: number | null, currency: string): string | null {
  if (setupFee == null) return null;
  return `${currency} ${setupFee.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} setup`;
}
