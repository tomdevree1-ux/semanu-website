'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/types/database';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import {
  linkSubscriptionSchema,
  syncSubscriptionSchema,
  syncForCustomerSchema,
  subscriptionNotesSchema,
  subscriptionCrmLinksSchema,
  type SubscriptionActionState,
} from './schema';
import { confirmMatches, subscriptionLinkIsArchivable } from './guards';
import {
  retrieveSubscriptionSnapshot,
  listCustomerSubscriptionSnapshots,
  type SubscriptionSnapshot,
} from './stripe';
import { findSubscriptionByStripeId, suggestCompanyForStripeCustomer } from './queries';

/**
 * SERVER actions for the Subscriptions registry (P12A — read / link / sync). Every action:
 * gates on the exact permission, calls Stripe READ-ONLY (retrieve/list) where needed, writes the
 * local registry via the service role, audits with safe metadata, and revalidates. P12A performs
 * NO Stripe mutations (no update/cancel/pause/price/quantity/checkout) and never touches the legacy
 * subscriptions/customers/orders/payments/payment_links/stripe_events tables or the checkout/webhook.
 * Registry rows are never hard-deleted (archive instead).
 */

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
const STRIPE_NOT_FOUND = 'Stripe could not load that subscription. Check the id and try again.';

type Admin = ReturnType<typeof createAdminClient>;

/** Map a Stripe snapshot to registry columns (Stripe-authoritative fields only; never CRM links). */
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

// ── link ───────────────────────────────────────────────────────────────────

export async function linkExistingStripeSubscription(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.link'))) return { error: NOT_ALLOWED };

  const parsed = linkSubscriptionSchema.safeParse({
    stripeSubscriptionId: formData.get('stripeSubscriptionId'),
    stripeCustomerId: formData.get('stripeCustomerId'),
    companyId: formData.get('companyId'),
    contactId: formData.get('contactId'),
    customerId: formData.get('customerId'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  // Validate the subscription exists in Stripe (read-only) before creating a registry row.
  let snapshot: SubscriptionSnapshot;
  try {
    snapshot = await retrieveSubscriptionSnapshot(parsed.data.stripeSubscriptionId);
  } catch (err) {
    console.error('[subscriptions] Stripe retrieve failed:', err instanceof Error ? err.message : 'unknown');
    return { error: STRIPE_NOT_FOUND };
  }

  const admin = createAdminClient();
  const cols = snapshotColumns(snapshot);
  const now = new Date().toISOString();

  const existing = await findSubscriptionByStripeId(parsed.data.stripeSubscriptionId);
  if (existing) {
    // Already linked: refresh the snapshot, fill any *currently empty* CRM links (never clobber).
    const { data: row } = await admin
      .from('customer_subscriptions')
      .select('company_id, contact_id, customer_id')
      .eq('id', existing.id)
      .maybeSingle();
    const patch: Database['public']['Tables']['customer_subscriptions']['Update'] = { ...cols, sync_status: 'synced', last_synced_at: now, updated_by: actor.id };
    if (row && !row.company_id && parsed.data.companyId) patch.company_id = parsed.data.companyId;
    if (row && !row.contact_id && parsed.data.contactId) patch.contact_id = parsed.data.contactId;
    if (row && !row.customer_id && parsed.data.customerId) patch.customer_id = parsed.data.customerId;
    await admin.from('customer_subscriptions').update(patch).eq('id', existing.id);
    await logEvent({
      action: 'subscription.synced',
      actorId: actor.id,
      entityType: 'subscription',
      entityId: existing.id,
      metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status, already_linked: true },
      source: 'portal',
    });
    revalidatePath('/app/subscriptions');
    revalidatePath(`/app/subscriptions/${existing.id}`);
    redirect(`/app/subscriptions/${existing.id}`);
  }

  // New link: suggest the company from the Stripe customer bridge when none was chosen.
  const companyId = parsed.data.companyId ?? (await suggestCompanyForStripeCustomer(snapshot.stripeCustomerId));
  const { data: created, error } = await admin
    .from('customer_subscriptions')
    .insert({
      ...cols,
      stripe_subscription_id: snapshot.stripeSubscriptionId,
      company_id: companyId,
      contact_id: parsed.data.contactId ?? null,
      customer_id: parsed.data.customerId ?? null,
      notes: parsed.data.notes ?? null,
      sync_status: 'synced',
      last_synced_at: now,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !created) return { error: GENERIC };

  await logEvent({
    action: 'subscription.linked',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: created.id,
    metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, stripe_customer_id: snapshot.stripeCustomerId, company_id: companyId },
    source: 'portal',
  });
  await logEvent({
    action: 'subscription.synced',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: created.id,
    metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status },
    source: 'portal',
  });

  revalidatePath('/app/subscriptions');
  if (companyId) revalidatePath(`/app/companies/${companyId}`);
  redirect(`/app/subscriptions/${created.id}`);
}

// ── sync ─────────────────────────────────────────────────────────────────────

export async function syncSubscriptionFromStripe(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.sync'))) return { error: NOT_ALLOWED };
  const parsed = syncSubscriptionSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid subscription.' };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('customer_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!row) return { error: 'Subscription not found.' };

  let snapshot: SubscriptionSnapshot;
  try {
    snapshot = await retrieveSubscriptionSnapshot(row.stripe_subscription_id);
  } catch (err) {
    console.error('[subscriptions] sync retrieve failed:', err instanceof Error ? err.message : 'unknown');
    await admin
      .from('customer_subscriptions')
      .update({ sync_status: 'failed', last_synced_at: new Date().toISOString(), updated_by: actor.id })
      .eq('id', row.id);
    await logEvent({
      action: 'subscription.sync_failed',
      actorId: actor.id,
      severity: 'warning',
      entityType: 'subscription',
      entityId: row.id,
      metadata: { stripe_subscription_id: row.stripe_subscription_id },
      source: 'portal',
    });
    return { error: STRIPE_NOT_FOUND };
  }

  // Refresh Stripe-authoritative fields only. CRM links, notes, and archived_at are preserved
  // (not included in the patch).
  await admin
    .from('customer_subscriptions')
    .update({ ...snapshotColumns(snapshot), sync_status: 'synced', last_synced_at: new Date().toISOString(), updated_by: actor.id })
    .eq('id', row.id);
  await logEvent({
    action: 'subscription.synced',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: row.id,
    newStatus: snapshot.status,
    metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status },
    source: 'portal',
  });

  revalidatePath('/app/subscriptions');
  revalidatePath(`/app/subscriptions/${row.id}`);
  return { ok: true };
}

export async function syncSubscriptionsForCustomer(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.sync'))) return { error: NOT_ALLOWED };
  const parsed = syncForCustomerSchema.safeParse({ stripeCustomerId: formData.get('stripeCustomerId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid Stripe customer id.' };

  let snapshots: SubscriptionSnapshot[];
  try {
    snapshots = await listCustomerSubscriptionSnapshots(parsed.data.stripeCustomerId);
  } catch (err) {
    console.error('[subscriptions] customer list failed:', err instanceof Error ? err.message : 'unknown');
    return { error: 'Stripe could not list subscriptions for that customer.' };
  }
  if (!snapshots.length) return { error: 'No subscriptions found for that Stripe customer.' };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const suggestedCompany = await suggestCompanyForStripeCustomer(parsed.data.stripeCustomerId);

  for (const snapshot of snapshots) {
    const cols = snapshotColumns(snapshot);
    const existing = await findSubscriptionByStripeId(snapshot.stripeSubscriptionId);
    if (existing) {
      // Preserve CRM links + notes + archived_at — refresh the snapshot only.
      await admin
        .from('customer_subscriptions')
        .update({ ...cols, sync_status: 'synced', last_synced_at: now, updated_by: actor.id })
        .eq('id', existing.id);
      await logEvent({
        action: 'subscription.synced',
        actorId: actor.id,
        entityType: 'subscription',
        entityId: existing.id,
        metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, status: snapshot.status },
        source: 'portal',
      });
    } else {
      const { data: created } = await admin
        .from('customer_subscriptions')
        .insert({
          ...cols,
          stripe_subscription_id: snapshot.stripeSubscriptionId,
          company_id: suggestedCompany,
          sync_status: 'synced',
          last_synced_at: now,
          created_by: actor.id,
          updated_by: actor.id,
        })
        .select('id')
        .single();
      if (created) {
        await logEvent({
          action: 'subscription.linked',
          actorId: actor.id,
          entityType: 'subscription',
          entityId: created.id,
          metadata: { stripe_subscription_id: snapshot.stripeSubscriptionId, stripe_customer_id: snapshot.stripeCustomerId, company_id: suggestedCompany, via: 'customer_sync' },
          source: 'portal',
        });
      }
    }
  }

  revalidatePath('/app/subscriptions');
  if (suggestedCompany) revalidatePath(`/app/companies/${suggestedCompany}`);
  return { ok: true };
}

// ── notes + CRM links ─────────────────────────────────────────────────────────

export async function updateSubscriptionNotes(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.link'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('customer_subscriptions')
    .select('notes, internal_notes')
    .eq('id', id)
    .maybeSingle();
  if (!row) return { error: 'Subscription not found.' };

  const parsed = subscriptionNotesSchema.safeParse({ notes: formData.get('notes'), internalNotes: formData.get('internalNotes') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const next = { notes: parsed.data.notes ?? null, internal_notes: parsed.data.internalNotes ?? null, updated_by: actor.id };
  const { error } = await admin.from('customer_subscriptions').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const changed = (['notes', 'internal_notes'] as const).filter(
    (k) => (row as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k],
  );
  await logEvent({
    action: 'subscription.updated',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: id,
    metadata: { fields: changed },
    source: 'portal',
  });

  revalidatePath(`/app/subscriptions/${id}`);
  return { ok: true };
}

export async function updateSubscriptionCrmLinks(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.link'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = subscriptionCrmLinksSchema.safeParse({
    companyId: formData.get('companyId'),
    contactId: formData.get('contactId'),
    customerId: formData.get('customerId'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: row } = await admin.from('customer_subscriptions').select('id, company_id').eq('id', id).maybeSingle();
  if (!row) return { error: 'Subscription not found.' };

  // Validate any provided ids exist (no Stripe involved).
  if (parsed.data.companyId) {
    const { data: c } = await admin.from('companies').select('id').eq('id', parsed.data.companyId).maybeSingle();
    if (!c) return { error: 'Selected company not found.' };
  }
  if (parsed.data.contactId) {
    const { data: c } = await admin.from('company_contacts').select('id').eq('id', parsed.data.contactId).maybeSingle();
    if (!c) return { error: 'Selected contact not found.' };
  }
  if (parsed.data.customerId) {
    const { data: c } = await admin.from('customers').select('id').eq('id', parsed.data.customerId).maybeSingle();
    if (!c) return { error: 'Selected customer not found.' };
  }

  const next = {
    company_id: parsed.data.companyId ?? null,
    contact_id: parsed.data.contactId ?? null,
    customer_id: parsed.data.customerId ?? null,
    updated_by: actor.id,
  };
  const { error } = await admin.from('customer_subscriptions').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'subscription.link_updated',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: id,
    metadata: { fields: ['company_id', 'contact_id', 'customer_id'], company_id: next.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/subscriptions/${id}`);
  revalidatePath('/app/subscriptions');
  if (next.company_id) revalidatePath(`/app/companies/${next.company_id}`);
  if (row.company_id && row.company_id !== next.company_id) revalidatePath(`/app/companies/${row.company_id}`);
  return { ok: true };
}

// ── archive / restore (LOCAL registry only — never touches Stripe) ─────────────

export async function archiveSubscriptionLink(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('customer_subscriptions')
    .select('archived_at, stripe_subscription_id, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!row) return { error: 'Subscription not found.' };
  if (!subscriptionLinkIsArchivable(row.archived_at)) return { ok: true }; // already archived
  if (!confirmMatches(typed, row.stripe_subscription_id)) return { error: 'The subscription id you typed does not match.' };

  // Local archive only — the Stripe subscription is unaffected (Stripe is authoritative).
  const { error } = await admin
    .from('customer_subscriptions')
    .update({ archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'subscription.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'subscription',
    entityId: id,
    metadata: { stripe_subscription_id: row.stripe_subscription_id, note: 'local registry link archived; Stripe subscription unchanged' },
    source: 'portal',
  });

  revalidatePath('/app/subscriptions');
  revalidatePath(`/app/subscriptions/${id}`);
  if (row.company_id) revalidatePath(`/app/companies/${row.company_id}`);
  return { ok: true };
}

export async function restoreSubscriptionLink(
  _prev: SubscriptionActionState,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('customer_subscriptions')
    .select('archived_at, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!row) return { error: 'Subscription not found.' };
  if (!row.archived_at) return { error: 'This subscription is not archived.' };

  const { error } = await admin
    .from('customer_subscriptions')
    .update({ archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'subscription.restored',
    actorId: actor.id,
    entityType: 'subscription',
    entityId: id,
    metadata: { company_id: row.company_id },
    source: 'portal',
  });

  revalidatePath('/app/subscriptions');
  revalidatePath(`/app/subscriptions/${id}`);
  if (row.company_id) revalidatePath(`/app/companies/${row.company_id}`);
  return { ok: true };
}
