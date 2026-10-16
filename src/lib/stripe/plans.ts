import { env } from '@/lib/env';

/**
 * Single source of truth for the billable products and how they map onto Stripe
 * Prices. Amounts are mirrored here only for a human-readable order summary and
 * must be kept in sync with the Stripe dashboard. See STRIPE_SETUP.md.
 *
 * Billing model (all-in monthly subscription; from CLAUDE.md):
 *  Base plans (customer picks one):
 *   - Starter   discontinued 2026-06 (legacy scaffolding, no new sign ups)
 *   - Business  79 CHF / month   recurring
 *   - Webshop   99 CHF / month   recurring
 *  Add-ons (optional, on top of a base plan):
 *   - Google Ads   ab 195 CHF / month   recurring (quote-based starting price)
 *   - Logo + brand guidelines   750 CHF   one-time
 *  Software & Applications = quote-based (routes to /kontakt, not checkout).
 */
export type PlanId = 'starter' | 'business' | 'webshop';

export const PLAN_IDS: readonly PlanId[] = ['starter', 'business', 'webshop'] as const;

/** Monthly recurring amount per base plan, in CHF (display/record only). */
export const PLAN_AMOUNT_CHF: Record<PlanId, number> = {
  starter: 35,
  business: 79,
  webshop: 99,
};

/**
 * Add-on amounts in CHF (display/record only). The Logo + Markenrichtlinien
 * amount lives in `src/lib/promo.ts` (single source of truth, promo-aware).
 */
export const GOOGLE_ADS_ADDON_CHF = 195; // Google Ads management, monthly (from)

/** Resolve the recurring Stripe Price id for a base plan. Throws if env is missing. */
export function planPriceId(plan: PlanId): string {
  switch (plan) {
    case 'starter':
      return env.stripePriceStarter;
    case 'business':
      return env.stripePriceBusiness;
    case 'webshop':
      return env.stripePriceWebshop;
  }
}

/** Stripe Checkout locale codes for the three site locales. */
export function stripeLocale(locale: string): 'de' | 'fr' | 'en' {
  return locale === 'fr' ? 'fr' : locale === 'en' ? 'en' : 'de';
}
