import 'server-only';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';

/**
 * SERVER ONLY Stripe WRITE helper for P12B2 execution. The secret key never leaves the server. Every
 * write passes an idempotency key. Allowed writes: `subscriptions.update` (item price/quantity,
 * cancel_at_period_end) and `subscriptions.cancel` (immediate). FORBIDDEN and absent here:
 * `subscriptions.resume`, `pause_collection`, `checkout.sessions.create`, refunds, product/price/coupon
 * creation. Callers MUST gate on the admin execute permission + the ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS
 * flag before invoking these. Reads (retrieve) live here too for eligibility/item selection.
 */

export type LiveItem = { id: string; priceId: string | null; quantity: number | null };
export type LiveSubscription = { status: string; cancelAtPeriodEnd: boolean; items: LiveItem[] };

/** Read the live subscription for eligibility + item selection (no write). */
export async function retrieveForExecution(stripeSubscriptionId: string): Promise<LiveSubscription> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['items.data.price'] });
  const items: LiveItem[] = (sub.items?.data ?? []).map((it) => {
    const price = it.price as Stripe.Price | null;
    return { id: it.id, priceId: price?.id ?? null, quantity: typeof it.quantity === 'number' ? it.quantity : null };
  });
  return { status: sub.status, cancelAtPeriodEnd: !!sub.cancel_at_period_end, items };
}

type Proration = Stripe.SubscriptionUpdateParams.ProrationBehavior;

/** change_plan: set the item's price (billing_cycle_anchor unchanged). */
export async function updateItemPrice(p: {
  stripeSubscriptionId: string;
  itemId: string;
  priceId: string;
  prorationBehavior: string;
  idempotencyKey: string;
}): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(
    p.stripeSubscriptionId,
    { items: [{ id: p.itemId, price: p.priceId }], proration_behavior: p.prorationBehavior as Proration },
    { idempotencyKey: p.idempotencyKey },
  );
}

/** change_quantity: set the item's quantity (billing_cycle_anchor unchanged). */
export async function updateItemQuantity(p: {
  stripeSubscriptionId: string;
  itemId: string;
  quantity: number;
  prorationBehavior: string;
  idempotencyKey: string;
}): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(
    p.stripeSubscriptionId,
    { items: [{ id: p.itemId, quantity: p.quantity }], proration_behavior: p.prorationBehavior as Proration },
    { idempotencyKey: p.idempotencyKey },
  );
}

/** cancel_at_period_end / undo: toggle the flag (no immediate cancel). */
export async function setCancelAtPeriodEnd(p: {
  stripeSubscriptionId: string;
  value: boolean;
  idempotencyKey: string;
}): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.update(
    p.stripeSubscriptionId,
    { cancel_at_period_end: p.value },
    { idempotencyKey: p.idempotencyKey },
  );
}

/** cancel_immediately: end the subscription now (destructive; no auto-rollback). */
export async function cancelNow(p: { stripeSubscriptionId: string; idempotencyKey: string }): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.cancel(p.stripeSubscriptionId, {}, { idempotencyKey: p.idempotencyKey });
}

/** Non-secret summary of the resulting subscription for result_payload (no amounts/secrets). */
export function summarizeSubscription(sub: Stripe.Subscription): Record<string, unknown> {
  const item = sub.items?.data?.[0];
  const price = item?.price as Stripe.Price | undefined;
  const onSub = (sub as unknown as { current_period_end?: number }).current_period_end;
  return {
    status: sub.status,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    current_period_end: typeof onSub === 'number' ? new Date(onSub * 1000).toISOString() : null,
    item: { price_id: price?.id ?? null, quantity: typeof item?.quantity === 'number' ? item.quantity : null },
  };
}
