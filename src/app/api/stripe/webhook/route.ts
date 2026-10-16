import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';
import { brandedEmailHtml } from '@/lib/email/branded';
import { CONFIRMATION, greet } from '@/lib/email/copy';
import { signatureAttachment } from '@/lib/email/signature-photo';
import { logEvent } from '@/lib/audit/log';
import { captureError } from '@/lib/observability';
import { reconcileRegistryFromStripeSubscription } from '@/modules/subscriptions/sync';
import type { PlanId } from '@/lib/types/database';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook — Stripe event sink.
 *
 * Verifies the signature against STRIPE_WEBHOOK_SECRET, then keeps Supabase in
 * sync with Stripe:
 *  - checkout.session.completed → mark the order paid, upsert the customer,
 *    send confirmation + admin notification emails
 *  - customer.subscription.*    → mirror subscription status
 *
 * Always returns 200 on a handled (or intentionally ignored) event so Stripe
 * does not retry; returns 400 only when the signature itself is invalid.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await handleSubscriptionEvent(event.data.object, supabase);
        await reconcileSubscriptionRegistry(event, supabase); // P12C (flag-gated, isolated, after legacy)
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    captureError(err, { scope: 'stripe/webhook', eventType: event.type });
    return NextResponse.json({ error: 'handler_error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type Admin = ReturnType<typeof createAdminClient>;

/** Find or create the customer row for a Stripe customer id. Returns its uuid. */
async function upsertCustomer(
  supabase: Admin,
  stripeCustomerId: string,
  email: string,
  name: string | null,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert({ stripe_customer_id: stripeCustomerId, email, name })
    .select('id')
    .single();

  if (error) {
    console.error('[stripe/webhook] customer upsert failed:', error);
    return null;
  }
  return inserted.id;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: Admin,
) {
  const orderId = session.client_reference_id ?? session.metadata?.order_id ?? null;

  // P11 defensive guard: invoice-payment sessions (or any session without a legacy order id) must NOT
  // run the legacy order/subscription/customer/email logic. Full invoice-payment webhook processing is
  // deferred (P11-D12); paid invoice links are confirmed manually via the P10 payments flow. This only
  // narrows the legacy handler to actual orders — it does not change behaviour for real order sessions.
  if (!orderId || session.metadata?.kind === 'invoice_payment') return;

  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  const email = session.customer_details?.email ?? session.customer_email ?? '';
  const name = session.customer_details?.name ?? null;

  let customerId: string | null = null;
  if (stripeCustomerId) {
    customerId = await upsertCustomer(supabase, stripeCustomerId, email, name);
  }

  if (orderId) {
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        customer_id: customerId,
      })
      .eq('id', orderId);
  }

  // Read back order details for the confirmation email + admin notification.
  const { data: order } = orderId
    ? await supabase
        .from('orders')
        .select('plan, addon, firstname, email, locale, amount_plan_chf, amount_addon_chf')
        .eq('id', orderId)
        .maybeSingle()
    : { data: null };

  const locale = (order?.locale ?? 'de') as 'de' | 'fr' | 'en';
  const to = order?.email ?? email;

  if (to) {
    const c = CONFIRMATION[locale];
    const planLabel = order?.plan ? PLAN_LABEL_EMAIL[order.plan] : '';
    await sendEmail({
      to,
      subject: c.subject,
      html: brandedEmailHtml({
        locale,
        greeting: greet(locale, order?.firstname ?? null),
        paragraphs: c.paragraphs,
        infoBox: planLabel
          ? { value: `${c.aboLabel}: ${planLabel}`, sub: order?.addon ? c.addonSub : undefined }
          : undefined,
        paragraphsAfter: [c.questions],
      }),
      attachments: [signatureAttachment()],
    });
  }

  // Admin notification (best-effort).
  await sendEmail({
    to: env.notificationTo,
    subject: `Neue Bestellung · ${order?.plan ?? 'unbekannt'}${order?.addon ? ' + Add-on' : ''}`,
    html: `<p>Neue Bestellung über amai.ch</p>
<ul>
  <li>Plan: ${order?.plan ?? '-'}</li>
  <li>Add-on: ${order?.addon ? 'ja' : 'nein'}</li>
  <li>Email: ${to || '-'}</li>
  <li>Stripe Customer: ${stripeCustomerId ?? '-'}</li>
  <li>Stripe Subscription: ${stripeSubscriptionId ?? '-'}</li>
</ul>`,
  });
}

/**
 * P12C: additive, FLAG-GATED registry reconciliation. Runs AFTER `handleSubscriptionEvent` (the legacy
 * `subscriptions` mirror upsert), in its OWN swallow-everything try/catch so a registry failure can never
 * affect the legacy path or the HTTP response. Deduped via `stripe_events` (registry branch ONLY — the
 * legacy mirror stays ungated/unchanged). No extra Stripe API call (maps the event's subscription object).
 */
async function reconcileSubscriptionRegistry(event: Stripe.Event, supabase: Admin): Promise<void> {
  if (!env.enableSubscriptionWebhookSync) return; // default off → legacy webhook behaves exactly as before
  try {
    // Dedup: insert the event id. A unique violation (23505) means we already reconciled it → skip.
    // `stripe_events` is an existing table not present in the hand-maintained database types (no schema
    // change here), so this one insert is typed locally rather than editing database.ts.
    const events = supabase.from('stripe_events') as unknown as {
      insert: (v: { id: string; type: string }) => Promise<{ error: { code?: string } | null }>;
    };
    const { error: insErr } = await events.insert({ id: event.id, type: event.type });
    if (insErr && insErr.code === '23505') return; // already reconciled this event

    const sub = event.data.object as Stripe.Subscription;
    const res = await reconcileRegistryFromStripeSubscription(sub, { eventId: event.id, eventType: event.type });
    if (!res.ok) {
      await logEvent({
        action: 'subscription.webhook_sync_failed',
        actorId: null,
        actorType: 'system',
        severity: 'warning',
        source: 'webhook',
        entityType: 'subscription',
        metadata: { stripe_subscription_id: sub.id, event_type: event.type, source: 'webhook' },
      });
    }
  } catch (err) {
    // Swallow — never affect the legacy path or the HTTP status. Manual P12A sync is the fallback.
    console.error('[stripe/webhook] registry reconciliation failed (legacy path unaffected):', err instanceof Error ? err.message : 'unknown');
  }
}

async function handleSubscriptionEvent(sub: Stripe.Subscription, supabase: Admin) {
  const stripeCustomerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // Need our customer uuid; the customer row should already exist from checkout.
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (!customer) {
    console.warn('[stripe/webhook] subscription event before customer exists:', sub.id);
    return;
  }

  const plan = (sub.metadata?.plan as PlanId | undefined) ?? null;
  const periodEnd = periodEndIso(sub);

  await supabase.from('subscriptions').upsert(
    {
      id: sub.id,
      customer_id: customer.id,
      status: sub.status,
      plan,
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: 'id' },
  );
}

/**
 * `current_period_end` lived on the Subscription in older API versions and moved
 * onto subscription items in newer ones. Read whichever is present so this keeps
 * working across Stripe API upgrades.
 */
function periodEndIso(sub: Stripe.Subscription): string | null {
  const onSub = (sub as unknown as { current_period_end?: number }).current_period_end;
  const onItem = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const ts = onSub ?? onItem?.current_period_end;
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null;
}

const PLAN_LABEL_EMAIL: Record<PlanId, string> = {
  starter: 'Starter Website',
  business: 'Business Website',
  webshop: 'Webshop',
};
