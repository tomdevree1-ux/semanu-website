import 'server-only';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { PLAN_IDS, planPriceId } from '@/lib/stripe/plans';
import type { Json } from '@/lib/types/database';

/**
 * SERVER ONLY Stripe reads for P12A (the secret key never leaves the server). P12A is
 * read/link/sync ONLY — this module calls Stripe to RETRIEVE and LIST subscriptions and
 * normalizes them into a registry snapshot. It performs NO Stripe writes (no update, cancel,
 * pause/resume, price/quantity change, checkout, refund). Those are P12B and are intentionally
 * absent here.
 */

/** Normalized subscription snapshot written into customer_subscriptions. */
export type SubscriptionSnapshot = {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  planKey: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  quantity: number | null;
  currency: string | null;
  amount: number | null;
  interval: string | null;
  metadata: Json;
};

function tsToIso(ts: number | null | undefined): string | null {
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null;
}

/**
 * `current_period_*` lived on the Subscription in older API versions and moved onto the
 * subscription item in newer ones. Read whichever is present (mirrors the legacy webhook).
 */
function periodIso(sub: Stripe.Subscription, key: 'current_period_start' | 'current_period_end'): string | null {
  const onSub = (sub as unknown as Record<string, number | undefined>)[key];
  const item = sub.items?.data?.[0] as unknown as Record<string, number | undefined> | undefined;
  return tsToIso(onSub ?? item?.[key]);
}

/** Resolve our internal plan key (starter/business/webshop) from a Stripe price id, if it maps. */
function planKeyForPrice(priceId: string | null, metadataPlan: string | null): string | null {
  if (priceId) {
    try {
      for (const plan of PLAN_IDS) {
        if (planPriceId(plan) === priceId) return plan;
      }
    } catch {
      // Stripe Price env ids are not configured in this environment — fall through to metadata.
    }
  }
  return metadataPlan ?? null;
}

/** Map a Stripe Subscription object into our registry snapshot. */
export function snapshotFromStripe(sub: Stripe.Subscription): SubscriptionSnapshot {
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const item = sub.items?.data?.[0];
  const price = item?.price ?? null;
  const stripePriceId = price?.id ?? null;
  const stripeProductId = price
    ? typeof price.product === 'string'
      ? price.product
      : price.product?.id ?? null
    : null;

  const unitAmount = price && typeof price.unit_amount === 'number' ? price.unit_amount / 100 : null;
  const interval = price?.recurring?.interval ?? null; // 'day' | 'week' | 'month' | 'year' | null
  const currency = (price?.currency ?? sub.currency ?? null)?.toUpperCase() ?? null;
  const q = item?.quantity;
  const quantity = typeof q === 'number' && q > 0 ? q : null;

  const metadataPlan = (sub.metadata?.plan as string | undefined) ?? null;

  return {
    stripeSubscriptionId: sub.id,
    stripeCustomerId,
    stripeProductId,
    stripePriceId,
    planKey: planKeyForPrice(stripePriceId, metadataPlan),
    status: sub.status,
    currentPeriodStart: periodIso(sub, 'current_period_start'),
    currentPeriodEnd: periodIso(sub, 'current_period_end'),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    cancelledAt: tsToIso(sub.canceled_at),
    trialStart: tsToIso(sub.trial_start),
    trialEnd: tsToIso(sub.trial_end),
    quantity,
    currency,
    amount: unitAmount,
    interval,
    metadata: (sub.metadata ?? {}) as Json,
  };
}

/** Retrieve one subscription from Stripe and normalize it. Throws on a Stripe error. */
export async function retrieveSubscriptionSnapshot(stripeSubscriptionId: string): Promise<SubscriptionSnapshot> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price.product'],
  });
  return snapshotFromStripe(sub as Stripe.Subscription);
}

/**
 * List a customer's subscriptions from Stripe (all statuses) and normalize them. Handles
 * pagination defensively with a hard page cap. Throws on a Stripe error.
 */
export async function listCustomerSubscriptionSnapshots(stripeCustomerId: string): Promise<SubscriptionSnapshot[]> {
  const stripe = getStripe();
  const out: SubscriptionSnapshot[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 20; page++) {
    const res = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.items.data.price.product'],
    });
    for (const sub of res.data) out.push(snapshotFromStripe(sub as Stripe.Subscription));
    if (!res.has_more || res.data.length === 0) break;
    startingAfter = res.data[res.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return out;
}
