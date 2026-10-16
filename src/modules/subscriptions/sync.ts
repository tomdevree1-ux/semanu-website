import 'server-only';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/audit/log';
import { retrieveSubscriptionSnapshot, snapshotFromStripe, type SubscriptionSnapshot } from './stripe';

/**
 * SERVER ONLY registry resync (P12A logic, reusable). Retrieves the live Stripe subscription and
 * refreshes the `customer_subscriptions` snapshot — Stripe-authoritative fields only, so CRM links,
 * notes and `archived_at` are PRESERVED (not in the patch). Used by P12A's sync action and by P12B2
 * immediately after a successful execution. Never touches a legacy table.
 */

function snapshotColumns(s: SubscriptionSnapshot) {
  return {
    stripe_customer_id: s.stripeCustomerId,
    stripe_product_id: s.stripeProductId,
    stripe_price_id: s.stripePriceId,
    plan_key: s.planKey,
    status: s.status,
    current_period_start: s.currentPeriodStart,
    current_period_end: s.currentPeriodEnd,
    cancel_at_period_end: s.cancelAtPeriodEnd,
    cancelled_at: s.cancelledAt,
    trial_start: s.trialStart,
    trial_end: s.trialEnd,
    quantity: s.quantity,
    currency: s.currency,
    amount: s.amount,
    interval: s.interval,
    metadata: s.metadata,
  };
}

/** Refresh the registry snapshot for one row from Stripe. Returns ok/false (never throws). */
export async function syncRegistryFromStripe(
  customerSubscriptionId: string,
  actorId: string,
  via = 'execution',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from('customer_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('id', customerSubscriptionId)
    .maybeSingle();
  if (!row) return { ok: false, error: 'Subscription not found.' };

  try {
    const snapshot = await retrieveSubscriptionSnapshot(row.stripe_subscription_id);
    await admin
      .from('customer_subscriptions')
      .update({ ...snapshotColumns(snapshot), sync_status: 'synced', last_synced_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', row.id);
    await logEvent({
      action: 'subscription.synced',
      actorId,
      entityType: 'subscription',
      entityId: row.id,
      newStatus: snapshot.status,
      metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status, via },
      source: 'portal',
    });
    return { ok: true };
  } catch (err) {
    console.error('[subscriptions/sync] resync failed:', err instanceof Error ? err.message : 'unknown');
    await admin
      .from('customer_subscriptions')
      .update({ sync_status: 'failed', last_synced_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', row.id);
    return { ok: false, error: 'The change applied, but the registry resync failed. Sync the subscription manually.' };
  }
}

type Admin = ReturnType<typeof createAdminClient>;

/** Reliable company auto-link: exactly one customers row for this stripe_customer_id (else unlinked). */
async function suggestCompanyViaCustomersBridge(admin: Admin, stripeCustomerId: string): Promise<string | null> {
  const { data } = await admin.from('customers').select('company_id').eq('stripe_customer_id', stripeCustomerId);
  const rows = data ?? [];
  if (rows.length !== 1) return null; // 0 or multiple matches → leave unlinked (no guessing)
  return rows[0].company_id ?? null;
}

/**
 * SERVER ONLY P12C webhook reconciliation (no Stripe API call). Maps the subscription OBJECT carried by
 * a `customer.subscription.*` event into the `customer_subscriptions` registry. Updates Stripe-
 * authoritative snapshot fields only — CRM links, notes, archive and created_by are PRESERVED (not in the
 * patch). Creates an UNLINKED row for an unknown subscription (auto-linking a company only via the reliable
 * `customers.stripe_customer_id → company_id` bridge when exactly one match exists). Writes ONLY
 * `customer_subscriptions`; never the legacy mirror / orders / payments / P10 / P11; never mutates Stripe.
 * Never throws (returns a typed result) so the webhook branch stays isolated.
 */
export async function reconcileRegistryFromStripeSubscription(
  sub: Stripe.Subscription,
  opts: { eventId: string; eventType: string },
): Promise<{ ok: true; created: boolean } | { ok: false; error: string }> {
  const admin = createAdminClient();
  try {
    const snapshot = snapshotFromStripe(sub);
    const cols = snapshotColumns(snapshot);
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from('customer_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', snapshot.stripeSubscriptionId)
      .maybeSingle();

    if (existing) {
      // Stripe fields + sync stamps only; updated_by null (no user). CRM/notes/archive/created_by preserved.
      await admin
        .from('customer_subscriptions')
        .update({ ...cols, sync_status: 'synced', last_synced_at: now, updated_by: null })
        .eq('id', existing.id);
      const action = opts.eventType === 'customer.subscription.deleted' ? 'subscription.cancelled_from_webhook' : 'subscription.webhook_synced';
      await logEvent({
        action,
        actorId: null,
        actorType: 'system',
        source: 'webhook',
        entityType: 'subscription',
        entityId: existing.id,
        newStatus: snapshot.status,
        metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status, event_type: opts.eventType, source: 'webhook' },
      });
      return { ok: true, created: false };
    }

    // Unknown subscription → create unlinked (or reliably bridge-linked) registry row.
    const companyId = await suggestCompanyViaCustomersBridge(admin, snapshot.stripeCustomerId);
    const { data: created, error } = await admin
      .from('customer_subscriptions')
      .insert({ ...cols, stripe_subscription_id: snapshot.stripeSubscriptionId, company_id: companyId, sync_status: 'synced', last_synced_at: now })
      .select('id')
      .single();
    if (error || !created) return { ok: false, error: 'insert_failed' };
    await logEvent({
      action: 'subscription.created_from_webhook',
      actorId: null,
      actorType: 'system',
      source: 'webhook',
      entityType: 'subscription',
      entityId: created.id,
      metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status, event_type: opts.eventType, source: 'webhook', company_linked: !!companyId },
    });
    return { ok: true, created: true };
  } catch (err) {
    console.error('[subscriptions/sync] webhook reconcile failed:', err instanceof Error ? err.message : 'unknown');
    return { ok: false, error: 'reconcile_failed' };
  }
}
