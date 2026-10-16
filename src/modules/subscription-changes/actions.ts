'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/types/database';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { env } from '@/lib/env';
import { planPriceId, type PlanId } from '@/lib/stripe/plans';
import { SUBSCRIPTION_MUTABLE_STATUSES } from '@/modules/subscriptions/status';
import { syncRegistryFromStripe } from '@/modules/subscriptions/sync';
import {
  createChangeRequestSchema,
  changeRequestIdSchema,
  changeRequestNotesSchema,
  type ChangeRequestActionState,
} from './schema';
import {
  changeRequestIsCancellable,
  changeRequestIsArchivable,
  confirmMatches,
  requestStatusExecutable,
  executePermissionFor,
  retryIdempotencyKey,
} from './guards';
import { actionNeedsPreview } from './status';
import { buildChangePreview } from './stripe-mutations';
import {
  retrieveForExecution,
  updateItemPrice,
  updateItemQuantity,
  setCancelAtPeriodEnd,
  cancelNow,
  summarizeSubscription,
} from './stripe-execute';

/**
 * SERVER actions for subscription change requests (P12B1 — request + preview ONLY). No Stripe writes;
 * no live execution. Every action gates on the exact permission, writes via the service role, audits
 * with safe metadata (no amounts/payloads/secrets), and revalidates. The legacy subscriptions/customers/
 * orders/payments/payment_links/stripe_events tables and checkout/webhook are never touched. Rows are
 * never hard-deleted (archive instead).
 */

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
type Admin = ReturnType<typeof createAdminClient>;
type ChangeUpdate = Database['public']['Tables']['subscription_change_requests']['Update'];

function resolveTargetPriceId(payload: Record<string, unknown>): { priceId?: string; error?: string } {
  const explicit = payload.target_price_id;
  if (typeof explicit === 'string' && explicit) return { priceId: explicit };
  const planKey = payload.target_plan_key;
  if (typeof planKey === 'string' && planKey) {
    try {
      return { priceId: planPriceId(planKey as PlanId) };
    } catch {
      return { error: 'No Stripe price is configured for this plan in this environment.' };
    }
  }
  return { error: 'No target plan or price was set on this request.' };
}

// ── create ───────────────────────────────────────────────────────────────────

export async function createSubscriptionChangeRequest(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.request_change'))) return { error: NOT_ALLOWED };

  const parsed = createChangeRequestSchema.safeParse({
    customerSubscriptionId: formData.get('customerSubscriptionId'),
    actionType: formData.get('actionType'),
    targetPlanKey: formData.get('targetPlanKey'),
    targetPriceId: formData.get('targetPriceId'),
    targetQuantity: formData.get('targetQuantity'),
    prorationBehavior: formData.get('prorationBehavior'),
    subscriptionItemId: formData.get('subscriptionItemId'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('customer_subscriptions')
    .select('id, status, archived_at, company_id, contact_id, stripe_subscription_id')
    .eq('id', parsed.data.customerSubscriptionId)
    .maybeSingle();
  if (!sub) return { error: 'Subscription not found.' };
  if (sub.archived_at) return { error: 'This subscription link is archived. Restore it first.' };
  if (!SUBSCRIPTION_MUTABLE_STATUSES.has(sub.status)) {
    return { error: 'This subscription is not in a state that allows changes (active, trialing, past due or paused only).' };
  }

  const reqPayload: Record<string, unknown> = {};
  if (parsed.data.actionType === 'change_plan') {
    reqPayload.target_plan_key = parsed.data.targetPlanKey ?? null;
    reqPayload.target_price_id = parsed.data.targetPriceId ?? null;
  }
  if (parsed.data.actionType === 'change_quantity') {
    reqPayload.target_quantity = parsed.data.targetQuantity ?? null;
  }

  const now = new Date().toISOString();
  const { data: created, error } = await admin
    .from('subscription_change_requests')
    .insert({
      customer_subscription_id: sub.id,
      company_id: sub.company_id,
      contact_id: sub.contact_id,
      stripe_subscription_id: sub.stripe_subscription_id,
      action_type: parsed.data.actionType,
      status: 'draft',
      proration_behavior: parsed.data.prorationBehavior ?? null,
      subscription_item_id: parsed.data.subscriptionItemId ?? null,
      request_payload: reqPayload as Json,
      notes: parsed.data.notes ?? null,
      requested_by: actor.id,
      requested_at: now,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !created) return { error: GENERIC };

  await logEvent({
    action: 'subscription.change_requested',
    actorId: actor.id,
    entityType: 'subscription_change',
    entityId: created.id,
    metadata: { action_type: parsed.data.actionType, stripe_subscription_id: sub.stripe_subscription_id, customer_subscription_id: sub.id },
    source: 'portal',
  });

  revalidatePath('/app/subscription-changes');
  revalidatePath(`/app/subscriptions/${sub.id}`);
  redirect(`/app/subscription-changes/${created.id}`);
}

// ── preview (READ-ONLY Stripe) ─────────────────────────────────────────────────

export async function previewSubscriptionChange(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.preview_change'))) return { error: NOT_ALLOWED };
  const parsed = changeRequestIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const admin = createAdminClient();
  const { data: req } = await admin
    .from('subscription_change_requests')
    .select('id, action_type, status, archived_at, stripe_subscription_id, request_payload, proration_behavior, subscription_item_id')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!req) return { error: 'Change request not found.' };
  if (req.archived_at) return { error: 'This request is archived.' };
  if (req.status !== 'draft' && req.status !== 'previewed') return { error: 'Only a draft request can be previewed.' };
  if (!actionNeedsPreview(req.action_type)) {
    return { error: 'This action does not require a preview. Live execution is deferred to P12B2.' };
  }

  const payload = (req.request_payload as Record<string, unknown>) ?? {};
  let targetPriceId: string | null = null;
  let targetQuantity: number | null = null;
  if (req.action_type === 'change_plan') {
    const r = resolveTargetPriceId(payload);
    if (r.error) return { error: r.error };
    targetPriceId = r.priceId ?? null;
  } else {
    const q = payload.target_quantity;
    targetQuantity = typeof q === 'number' ? q : null;
    if (targetQuantity == null) return { error: 'This request has no target quantity.' };
  }

  try {
    const res = await buildChangePreview({
      stripeSubscriptionId: req.stripe_subscription_id,
      action: req.action_type as 'change_plan' | 'change_quantity',
      targetPriceId,
      targetQuantity,
      subscriptionItemId: req.subscription_item_id,
      prorationBehavior: req.proration_behavior,
    });
    if (!res.ok) return { error: res.blocked }; // validation block (multi-item, etc.) — not a failure

    const safeSummary = {
      currency: res.preview.currency,
      estimatedTotal: res.preview.total,
      lineCount: res.preview.lineCount,
      periodEnd: res.preview.periodEnd,
      target: req.action_type === 'change_plan' ? (payload.target_plan_key ?? targetPriceId ?? null) : `qty ${targetQuantity}`,
      prorationBehavior: req.proration_behavior ?? 'create_prorations',
    };
    const patch: ChangeUpdate = {
      status: 'previewed',
      preview_payload: res.preview.raw as Json,
      safe_summary: safeSummary as Json,
      error_summary: null,
      updated_by: actor.id,
    };
    await admin.from('subscription_change_requests').update(patch).eq('id', req.id);

    // No amounts/payload in ordinary metadata (field names + non-secret ids only).
    await logEvent({
      action: 'subscription.change_previewed',
      actorId: actor.id,
      entityType: 'subscription_change',
      entityId: req.id,
      metadata: { action_type: req.action_type, stripe_subscription_id: req.stripe_subscription_id },
      source: 'portal',
    });

    revalidatePath(`/app/subscription-changes/${req.id}`);
    return { ok: true };
  } catch (err) {
    console.error('[subscription-changes] preview failed:', err instanceof Error ? err.message : 'unknown');
    const sanitized = (err instanceof Error ? err.message : 'Stripe preview failed').replace(/sk_(live|test)\w+/g, '[redacted]').slice(0, 300);
    await admin
      .from('subscription_change_requests')
      .update({ status: 'failed', failed_at: new Date().toISOString(), error_summary: sanitized, updated_by: actor.id })
      .eq('id', req.id);
    await logEvent({
      action: 'subscription.change_failed',
      actorId: actor.id,
      severity: 'warning',
      entityType: 'subscription_change',
      entityId: req.id,
      metadata: { action_type: req.action_type, stripe_subscription_id: req.stripe_subscription_id },
      source: 'portal',
    });
    return { error: 'Stripe could not build a preview for this change. Please try again.' };
  }
}

// ── cancel / archive / restore / notes (local only) ────────────────────────────

export async function cancelSubscriptionChangeRequest(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.request_change'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: req } = await admin.from('subscription_change_requests').select('status, customer_subscription_id').eq('id', id).maybeSingle();
  if (!req) return { error: 'Change request not found.' };
  if (!changeRequestIsCancellable(req.status)) return { error: 'Only a draft or previewed request can be cancelled.' };

  await admin.from('subscription_change_requests').update({ status: 'cancelled', updated_by: actor.id }).eq('id', id);
  await logEvent({ action: 'subscription.change_cancelled', actorId: actor.id, entityType: 'subscription_change', entityId: id, metadata: { customer_subscription_id: req.customer_subscription_id }, source: 'portal' });

  revalidatePath(`/app/subscription-changes/${id}`);
  revalidatePath('/app/subscription-changes');
  return { ok: true };
}

export async function archiveSubscriptionChangeRequest(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: req } = await admin.from('subscription_change_requests').select('status, archived_at').eq('id', id).maybeSingle();
  if (!req) return { error: 'Change request not found.' };
  if (req.archived_at) return { ok: true };
  if (!changeRequestIsArchivable(req.status)) return { error: 'Cancel this request before archiving it.' };

  await admin
    .from('subscription_change_requests')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  await logEvent({ action: 'subscription.change_archived', actorId: actor.id, severity: 'warning', entityType: 'subscription_change', entityId: id, metadata: {}, source: 'portal' });

  revalidatePath(`/app/subscription-changes/${id}`);
  revalidatePath('/app/subscription-changes');
  return { ok: true };
}

export async function restoreSubscriptionChangeRequest(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: req } = await admin.from('subscription_change_requests').select('archived_at').eq('id', id).maybeSingle();
  if (!req) return { error: 'Change request not found.' };
  if (!req.archived_at) return { error: 'This request is not archived.' };

  // Restore to `cancelled` (inert) — never silently back to an actionable state.
  await admin
    .from('subscription_change_requests')
    .update({ status: 'cancelled', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  await logEvent({ action: 'subscription.change_restored', actorId: actor.id, entityType: 'subscription_change', entityId: id, metadata: {}, source: 'portal' });

  revalidatePath(`/app/subscription-changes/${id}`);
  revalidatePath('/app/subscription-changes');
  return { ok: true };
}

export async function updateChangeRequestNotes(
  _prev: ChangeRequestActionState,
  formData: FormData,
): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('subscriptions.request_change'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: req } = await admin.from('subscription_change_requests').select('notes, internal_notes').eq('id', id).maybeSingle();
  if (!req) return { error: 'Change request not found.' };

  const parsed = changeRequestNotesSchema.safeParse({ notes: formData.get('notes'), internalNotes: formData.get('internalNotes') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const next = { notes: parsed.data.notes ?? null, internal_notes: parsed.data.internalNotes ?? null, updated_by: actor.id };
  const { error } = await admin.from('subscription_change_requests').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const changed = (['notes', 'internal_notes'] as const).filter((k) => (req as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({ action: 'subscription.change_updated', actorId: actor.id, entityType: 'subscription_change', entityId: id, metadata: { fields: changed }, source: 'portal' });

  revalidatePath(`/app/subscription-changes/${id}`);
  return { ok: true };
}

// ── execution (P12B2 — admin-only, flag-gated, idempotent) ─────────────────────

const EXEC_DISABLED = 'Subscription execution is disabled in this environment.';
/** Registry effect event per action (entity_type='subscription'). */
const EFFECT_EVENT: Record<string, string> = {
  change_plan: 'subscription.plan_changed',
  change_quantity: 'subscription.quantity_changed',
  cancel_at_period_end: 'subscription.cancel_at_period_end_set',
  undo_cancel_at_period_end: 'subscription.cancel_at_period_end_removed',
  cancel_immediately: 'subscription.cancelled',
};

function sanitizeStripeError(err: unknown): string {
  return (err instanceof Error ? err.message : 'Stripe execution failed').replace(/sk_(live|test)\w+/g, '[redacted]').slice(0, 300);
}

async function markFailed(admin: Admin, actorId: string, requestId: string, action: string, err: unknown): Promise<ChangeRequestActionState> {
  await admin
    .from('subscription_change_requests')
    .update({ status: 'failed', failed_at: new Date().toISOString(), error_summary: sanitizeStripeError(err), updated_by: actorId })
    .eq('id', requestId);
  await logEvent({ action: 'subscription.change_failed', actorId, severity: 'warning', entityType: 'subscription_change', entityId: requestId, metadata: { action_type: action }, source: 'portal' });
  return { error: 'Stripe could not apply this change. The request is marked failed; you can retry.' };
}

/**
 * Core executor shared by execute + retry. Gates on the flag, the request status, and the per-action
 * admin permission; re-previews plan/quantity; writes to Stripe with an idempotency key; on success
 * records the result + re-syncs the P12A registry + audits; on failure marks the request `failed`.
 * Never writes a legacy table; never calls checkout/webhook.
 */
async function performExecution(actorId: string, requestId: string, typed: string, isRetry: boolean): Promise<ChangeRequestActionState> {
  if (!env.stripeSubscriptionMutationsEnabled) return { error: EXEC_DISABLED }; // hard kill-switch

  const admin = createAdminClient();
  const { data: req } = await admin
    .from('subscription_change_requests')
    .select('id, action_type, status, archived_at, customer_subscription_id, stripe_subscription_id, request_payload, proration_behavior, subscription_item_id, idempotency_key')
    .eq('id', requestId)
    .maybeSingle();
  if (!req) return { error: 'Change request not found.' };
  if (req.archived_at) return { error: 'This request is archived.' };

  const action = req.action_type;
  if (isRetry) {
    if (req.status !== 'failed') return { error: 'Only a failed request can be retried.' };
  } else if (!requestStatusExecutable(action, req.status)) {
    return { error: 'This request is not in an executable state.' };
  }

  // permission: admin-only execute perm (the flag was already checked).
  const perm = executePermissionFor(action);
  if (!perm) return { error: 'This action cannot be executed in this phase.' };
  if (!(await hasPermission(perm))) return { error: NOT_ALLOWED };

  const { data: reg } = await admin
    .from('customer_subscriptions')
    .select('id, stripe_subscription_id, company_id')
    .eq('id', req.customer_subscription_id)
    .maybeSingle();
  if (!reg) return { error: 'Linked subscription not found.' };
  if (reg.stripe_subscription_id !== req.stripe_subscription_id) return { error: 'Subscription mismatch; re-sync and try again.' };

  if (action === 'cancel_immediately' && !confirmMatches(typed, req.stripe_subscription_id)) {
    return { error: 'The subscription id you typed does not match.' };
  }

  // live retrieve + eligibility + item selection
  let live;
  try {
    live = await retrieveForExecution(req.stripe_subscription_id);
  } catch {
    return { error: 'Stripe could not load the subscription. Please try again.' };
  }
  if (!SUBSCRIPTION_MUTABLE_STATUSES.has(live.status)) return { error: 'The subscription is no longer in a changeable state.' };

  let itemId = req.subscription_item_id ?? null;
  if (!itemId) {
    if (live.items.length === 1) itemId = live.items[0].id;
    else if (live.items.length === 0) return { error: 'The subscription has no items to change.' };
    else return { error: 'The subscription has multiple items. Set a subscription item on the request.' };
  }
  const item = live.items.find((i) => i.id === itemId);
  if (!itemId || !item) return { error: 'The selected subscription item was not found on the subscription.' };

  const payload = (req.request_payload as Record<string, unknown>) ?? {};
  const proration = req.proration_behavior ?? 'create_prorations';
  let targetPriceId: string | null = null;
  let targetQuantity: number | null = null;

  if (action === 'change_plan') {
    const explicit = typeof payload.target_price_id === 'string' ? payload.target_price_id : '';
    if (explicit) targetPriceId = explicit;
    else if (typeof payload.target_plan_key === 'string' && payload.target_plan_key) {
      try {
        targetPriceId = planPriceId(payload.target_plan_key as PlanId);
      } catch {
        return { error: 'No Stripe price is configured for this plan in this environment.' };
      }
    }
    if (!targetPriceId) return { error: 'This request has no target plan or price.' };
    if (item.priceId === targetPriceId) return { error: 'The subscription is already on this price (nothing to apply).' };
  } else if (action === 'change_quantity') {
    targetQuantity = typeof payload.target_quantity === 'number' ? payload.target_quantity : null;
    if (targetQuantity == null || targetQuantity <= 0) return { error: 'This request has no valid target quantity.' };
    if (item.quantity === targetQuantity) return { error: 'The subscription is already at this quantity (nothing to apply).' };
  }

  // mandatory FRESH re-preview for plan/quantity (never trust the stored P12B1 preview)
  if (action === 'change_plan' || action === 'change_quantity') {
    let preview;
    try {
      preview = await buildChangePreview({
        stripeSubscriptionId: req.stripe_subscription_id,
        action: action as 'change_plan' | 'change_quantity',
        targetPriceId,
        targetQuantity,
        subscriptionItemId: itemId,
        prorationBehavior: proration,
      });
    } catch (err) {
      return markFailed(admin, actorId, req.id, action, err);
    }
    if (!preview.ok) return { error: preview.blocked };
    const safe = {
      currency: preview.preview.currency,
      estimatedTotal: preview.preview.total,
      lineCount: preview.preview.lineCount,
      periodEnd: preview.preview.periodEnd,
      target: action === 'change_plan' ? (payload.target_plan_key ?? targetPriceId) : `qty ${targetQuantity}`,
      prorationBehavior: proration,
      repreviewed: true,
    };
    const patch: ChangeUpdate = { preview_payload: preview.preview.raw as Json, safe_summary: safe as Json, updated_by: actorId };
    await admin.from('subscription_change_requests').update(patch).eq('id', req.id);
  }

  // approve + executing (idempotency key persisted before the write)
  const now = new Date().toISOString();
  const idempotencyKey = isRetry ? retryIdempotencyKey(req.id) : req.idempotency_key || req.id;
  const startPatch: ChangeUpdate = { approved_by: actorId, approved_at: now, status: 'executing', idempotency_key: idempotencyKey, error_summary: null, updated_by: actorId };
  await admin.from('subscription_change_requests').update(startPatch).eq('id', req.id);
  await logEvent({ action: 'subscription.change_approved', actorId, entityType: 'subscription_change', entityId: req.id, metadata: { action_type: action }, source: 'portal' });
  await logEvent({ action: 'subscription.change_executing', actorId, entityType: 'subscription_change', entityId: req.id, metadata: { action_type: action, stripe_subscription_id: req.stripe_subscription_id }, source: 'portal' });

  try {
    let sub;
    if (action === 'change_plan') sub = await updateItemPrice({ stripeSubscriptionId: req.stripe_subscription_id, itemId, priceId: targetPriceId as string, prorationBehavior: proration, idempotencyKey });
    else if (action === 'change_quantity') sub = await updateItemQuantity({ stripeSubscriptionId: req.stripe_subscription_id, itemId, quantity: targetQuantity as number, prorationBehavior: proration, idempotencyKey });
    else if (action === 'cancel_at_period_end') sub = await setCancelAtPeriodEnd({ stripeSubscriptionId: req.stripe_subscription_id, value: true, idempotencyKey });
    else if (action === 'undo_cancel_at_period_end') sub = await setCancelAtPeriodEnd({ stripeSubscriptionId: req.stripe_subscription_id, value: false, idempotencyKey });
    else sub = await cancelNow({ stripeSubscriptionId: req.stripe_subscription_id, idempotencyKey }); // cancel_immediately

    const donePatch: ChangeUpdate = { status: 'executed', executed_by: actorId, executed_at: new Date().toISOString(), result_payload: summarizeSubscription(sub) as Json, updated_by: actorId };
    await admin.from('subscription_change_requests').update(donePatch).eq('id', req.id);
    await logEvent({ action: 'subscription.change_executed', actorId, entityType: 'subscription_change', entityId: req.id, metadata: { action_type: action, stripe_subscription_id: req.stripe_subscription_id }, source: 'portal' });
    await logEvent({ action: EFFECT_EVENT[action] ?? 'subscription.synced', actorId, entityType: 'subscription', entityId: reg.id, metadata: { stripe_subscription_id: req.stripe_subscription_id, action_type: action }, source: 'portal' });

    // immediate P12A registry resync (emits subscription.synced; preserves CRM links/notes)
    await syncRegistryFromStripe(reg.id, actorId, 'execution');

    revalidatePath(`/app/subscription-changes/${req.id}`);
    revalidatePath('/app/subscription-changes');
    revalidatePath(`/app/subscriptions/${reg.id}`);
    if (reg.company_id) revalidatePath(`/app/companies/${reg.company_id}`);
    return { ok: true };
  } catch (err) {
    console.error('[subscription-changes] execution failed:', err instanceof Error ? err.message : 'unknown');
    return markFailed(admin, actorId, req.id, action, err);
  }
}

export async function executeSubscriptionChange(_prev: ChangeRequestActionState, formData: FormData): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  const id = String(formData.get('id') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };
  return performExecution(actor.id, id, typed, false);
}

export async function retrySubscriptionChange(_prev: ChangeRequestActionState, formData: FormData): Promise<ChangeRequestActionState> {
  const actor = await requireAuth();
  const id = String(formData.get('id') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };
  return performExecution(actor.id, id, typed, true);
}
