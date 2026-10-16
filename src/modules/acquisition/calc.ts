/**
 * Acquisition economics — pure functions. Every ratio returns `number | null`,
 * where `null` means "n/a" (zero denominator / no data). Never throws, never
 * divides by zero. All amounts are in the dashboard base currency.
 */

/** Lifetime value = monthly price × expected retention months. */
export function ltv(price: number, retentionMonths: number): number {
  return price * retentionMonths;
}

/** Max CAC that still hits the target LTV:CAC ratio. */
export function maxHealthyCac(ltvValue: number, targetRatio: number): number | null {
  return targetRatio > 0 ? ltvValue / targetRatio : null;
}

/** Max CAC that still pays back within the target months. */
export function maxPaybackCac(price: number, paybackMonths: number): number {
  return price * paybackMonths;
}

/**
 * The CAC ceiling the guardrails use: the stricter of the LTV:CAC limit and the
 * payback limit. With amai defaults (80 × 24 = 1920 LTV, 3:1, 3-month payback)
 * that's min(640, 240) = 240 CHF.
 */
export function maxAllowedCac(
  price: number,
  retentionMonths: number,
  targetRatio: number,
  paybackMonths: number,
): number {
  const byRatio = maxHealthyCac(ltv(price, retentionMonths), targetRatio);
  const byPayback = maxPaybackCac(price, paybackMonths);
  return Math.min(byRatio ?? Infinity, byPayback);
}

export function cpl(spend: number, leads: number): number | null {
  return leads > 0 ? spend / leads : null;
}

export function cac(spend: number, customers: number): number | null {
  return customers > 0 ? spend / customers : null;
}

export function paybackMonths(cacValue: number | null, price: number): number | null {
  return cacValue != null && price > 0 ? cacValue / price : null;
}

export function ltvCacRatio(ltvValue: number, cacValue: number | null): number | null {
  return cacValue != null && cacValue > 0 ? ltvValue / cacValue : null;
}

export function leadToCustomer(customers: number, leads: number): number | null {
  return leads > 0 ? customers / leads : null;
}

/** Early-churn rate = early cancellations / customers old enough to evaluate. */
export function earlyChurnRate(churned: number, evaluable: number): number | null {
  return evaluable > 0 ? churned / evaluable : null;
}
