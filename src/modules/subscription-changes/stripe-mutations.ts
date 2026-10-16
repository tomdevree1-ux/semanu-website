import 'server-only';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';

/**
 * SERVER ONLY Stripe helper for P12B1. **Despite the file name, P12B1 contains READ/PREVIEW LOGIC
 * ONLY — no Stripe writes.** It calls `subscriptions.retrieve` (read) and the upcoming-invoice
 * **preview** endpoint (`invoices.retrieveUpcoming` or `invoices.createPreview`, detected at runtime —
 * both are non-persisting reads). It NEVER calls `subscriptions.update`/`.cancel`/`.resume`,
 * `pause_collection`, `checkout.sessions.create`, refunds, or any product/price/coupon creation. Live
 * execution (P12B2) is intentionally absent. The secret key never leaves the server.
 */

export type PreviewResult = {
  currency: string | null;
  amountDue: number | null;
  subtotal: number | null;
  total: number | null;
  lineCount: number;
  periodStart: string | null;
  periodEnd: string | null;
  /** Raw, billing-sensitive subset (stored in preview_payload — gated by audit.read_technical). */
  raw: Record<string, unknown>;
};

export type SubscriptionItemInfo = { id: string; priceId: string | null; quantity: number | null };

function tsToIso(ts: unknown): string | null {
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null;
}
function centsToAmount(v: unknown): number | null {
  return typeof v === 'number' ? v / 100 : null;
}

/** Retrieve the subscription's items for selection/validation (read only). */
export async function retrieveSubscriptionItems(
  stripeSubscriptionId: string,
): Promise<{ status: string; items: SubscriptionItemInfo[] }> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['items.data.price'] });
  const items: SubscriptionItemInfo[] = (sub.items?.data ?? []).map((it) => {
    const price = it.price as Stripe.Price | null;
    return { id: it.id, priceId: price?.id ?? null, quantity: typeof it.quantity === 'number' ? it.quantity : null };
  });
  return { status: sub.status, items };
}

/**
 * Build an upcoming-invoice **preview** for a proposed plan/quantity change (READ ONLY). Returns a
 * blocked result for multi-item subscriptions with no explicit item (never guesses). Stripe API errors
 * propagate to the caller (which records a `failed` request).
 */
export async function buildChangePreview(params: {
  stripeSubscriptionId: string;
  action: 'change_plan' | 'change_quantity';
  targetPriceId?: string | null;
  targetQuantity?: number | null;
  subscriptionItemId?: string | null;
  prorationBehavior?: string | null;
}): Promise<{ ok: true; preview: PreviewResult } | { ok: false; blocked: string }> {
  const stripe = getStripe();
  const { items } = await retrieveSubscriptionItems(params.stripeSubscriptionId);

  // Item selection — never guess for multi-item subscriptions.
  let itemId = params.subscriptionItemId ?? null;
  if (!itemId) {
    if (items.length === 1) itemId = items[0].id;
    else if (items.length === 0) return { ok: false, blocked: 'This subscription has no items to change.' };
    else return { ok: false, blocked: 'This subscription has multiple items. Select a subscription item to preview.' };
  } else if (!items.some((i) => i.id === itemId)) {
    return { ok: false, blocked: 'The selected subscription item does not belong to this subscription.' };
  }

  const subscription_items =
    params.action === 'change_plan'
      ? [{ id: itemId, price: params.targetPriceId ?? undefined }]
      : [{ id: itemId, quantity: params.targetQuantity ?? undefined }];

  const invoice = await previewUpcomingInvoice(stripe, {
    subscription: params.stripeSubscriptionId,
    subscription_items,
    subscription_proration_behavior: params.prorationBehavior ?? 'create_prorations',
  });

  const inv = invoice as Record<string, unknown>;
  const lines = ((inv.lines as { data?: unknown[] } | undefined)?.data ?? []) as Array<Record<string, unknown>>;
  return {
    ok: true,
    preview: {
      currency: (inv.currency as string | undefined) ?? null,
      amountDue: centsToAmount(inv.amount_due),
      subtotal: centsToAmount(inv.subtotal),
      total: centsToAmount(inv.total),
      lineCount: lines.length,
      periodStart: tsToIso(inv.period_start),
      periodEnd: tsToIso(inv.period_end),
      raw: {
        currency: inv.currency ?? null,
        amount_due: inv.amount_due ?? null,
        subtotal: inv.subtotal ?? null,
        total: inv.total ?? null,
        lines: lines.map((l) => ({ description: l.description ?? null, amount: l.amount ?? null, proration: l.proration ?? null })),
      },
    },
  };
}

/**
 * Call the installed SDK's upcoming-invoice preview. Newer Stripe API versions replace
 * `invoices.retrieveUpcoming` with `invoices.createPreview` (different param shape). Both are
 * non-persisting reads. Loosely typed to survive SDK/API-version drift; verified in test mode.
 */
async function previewUpcomingInvoice(
  stripe: Stripe,
  params: { subscription: string; subscription_items: Array<{ id: string; price?: string; quantity?: number }>; subscription_proration_behavior: string },
): Promise<unknown> {
  const invoices = stripe.invoices as unknown as {
    retrieveUpcoming?: (p: unknown) => Promise<unknown>;
    createPreview?: (p: unknown) => Promise<unknown>;
  };
  if (typeof invoices.retrieveUpcoming === 'function') {
    return invoices.retrieveUpcoming({
      subscription: params.subscription,
      subscription_items: params.subscription_items,
      subscription_proration_behavior: params.subscription_proration_behavior,
    });
  }
  if (typeof invoices.createPreview === 'function') {
    return invoices.createPreview({
      subscription: params.subscription,
      subscription_details: {
        items: params.subscription_items,
        proration_behavior: params.subscription_proration_behavior,
      },
    });
  }
  throw new Error('No upcoming-invoice preview method available in the installed Stripe SDK');
}
