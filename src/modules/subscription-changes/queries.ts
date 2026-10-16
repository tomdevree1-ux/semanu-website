import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { CHANGE_ACTIONS } from './schema';
import { CHANGE_STATUSES, actionNeedsPreview } from './status';
import { requestStatusExecutable } from './guards';
import { SUBSCRIPTION_MUTABLE_STATUSES } from '@/modules/subscriptions/status';
import type {
  ChangeRequestListRow,
  ChangeRequestDetail,
  AllowedAction,
  ChangeRequestFilters,
  PreviewSummary,
} from './types';

/**
 * SERVER ONLY change-request reads (service-role; callers gate with requirePermission('subscriptions.read')).
 * Default lists hide archived. `preview_payload` (billing-sensitive raw) is returned only for
 * audit.read_technical holders.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

async function resolveCompanyNames(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name').in('id', unique);
  for (const c of data ?? []) map.set(c.id, c.company_name);
  return map;
}
async function resolveContactNames(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('company_contacts').select('id, name').in('id', unique);
  for (const c of data ?? []) map.set(c.id, c.name ?? '');
  return map;
}
async function resolveProfileNames(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, email').in('id', unique);
  for (const p of data ?? []) map.set(p.id, p.full_name || p.email || '');
  return map;
}

export async function listSubscriptionChangeRequests(
  filters: ChangeRequestFilters,
): Promise<{ rows: ChangeRequestListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('subscription_change_requests')
    .select(
      'id,action_type,status,stripe_subscription_id,customer_subscription_id,company_id,contact_id,requested_by,preview_payload,created_at,archived_at',
      { count: 'exact' },
    );

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && (CHANGE_STATUSES as ReadonlyArray<string>).includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.actionType && (CHANGE_ACTIONS as ReadonlyArray<string>).includes(filters.actionType)) q = q.eq('action_type', filters.actionType);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  if (filters.customerSubscriptionId) q = q.eq('customer_subscription_id', filters.customerSubscriptionId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) {
    const clauses = [`stripe_subscription_id.ilike.%${s}%`, `action_type.ilike.%${s}%`, `notes.ilike.%${s}%`];
    const { data: comps } = await admin.from('companies').select('id').ilike('company_name', `%${s}%`).limit(50);
    const ids = (comps ?? []).map((c) => c.id);
    if (ids.length) clauses.push(`company_id.in.(${ids.join(',')})`);
    q = q.or(clauses.join(','));
  }

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [companyNames, contactNames, profileNames] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, list.map((x) => x.contact_id ?? '').filter(Boolean)),
    resolveProfileNames(admin, list.map((x) => x.requested_by ?? '').filter(Boolean)),
  ]);

  const rows: ChangeRequestListRow[] = list.map((x) => ({
    id: x.id,
    actionType: x.action_type,
    status: x.status,
    stripeSubscriptionId: x.stripe_subscription_id,
    customerSubscriptionId: x.customer_subscription_id,
    companyId: x.company_id,
    companyName: x.company_id ? companyNames.get(x.company_id) || null : null,
    contactId: x.contact_id,
    contactName: x.contact_id ? contactNames.get(x.contact_id) || null : null,
    requestedByName: x.requested_by ? profileNames.get(x.requested_by) || null : null,
    hasPreview: x.preview_payload != null,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getSubscriptionChangeRequest(
  id: string,
  includeTechnical = false,
): Promise<ChangeRequestDetail | null> {
  const admin = createAdminClient();
  const { data: r } = await admin.from('subscription_change_requests').select('*').eq('id', id).maybeSingle();
  if (!r) return null;

  const [company, contact, profile] = await Promise.all([
    r.company_id ? admin.from('companies').select('company_name').eq('id', r.company_id).maybeSingle() : Promise.resolve({ data: null }),
    r.contact_id ? admin.from('company_contacts').select('name').eq('id', r.contact_id).maybeSingle() : Promise.resolve({ data: null }),
    r.requested_by ? admin.from('profiles').select('full_name, email').eq('id', r.requested_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return {
    id: r.id,
    actionType: r.action_type,
    status: r.status,
    prorationBehavior: r.proration_behavior,
    subscriptionItemId: r.subscription_item_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    customerSubscriptionId: r.customer_subscription_id,
    companyId: r.company_id,
    companyName: company.data?.company_name ?? null,
    contactId: r.contact_id,
    contactName: contact.data?.name ?? null,
    requestPayload: (r.request_payload as Record<string, unknown>) ?? {},
    safeSummary: (r.safe_summary as PreviewSummary | Record<string, unknown> | null) ?? null,
    previewPayload: includeTechnical ? ((r.preview_payload as Record<string, unknown> | null) ?? null) : null,
    errorSummary: r.error_summary,
    requestedByName: profile.data ? profile.data.full_name || profile.data.email || null : null,
    requestedAt: r.requested_at,
    notes: r.notes,
    internalNotes: r.internal_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    archivedAt: r.archived_at,
    isArchived: !!r.archived_at,
  };
}

/**
 * Whether a request can be executed now (P12B2): status-executable AND the live registry snapshot is in
 * a mutable state. This is advisory and status-based; the caller additionally gates on the
 * `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` flag + the admin execute permission, and the action re-checks
 * the LIVE Stripe state at execution time. `needsConfirm` flags destructive cancel_immediately.
 */
export async function getExecutableSubscriptionActions(
  requestId: string,
): Promise<{ executable: boolean; needsConfirm: boolean; needsPreview: boolean; reason: string | null }> {
  const admin = createAdminClient();
  const { data: req } = await admin
    .from('subscription_change_requests')
    .select('action_type, status, archived_at, customer_subscription_id')
    .eq('id', requestId)
    .maybeSingle();
  if (!req) return { executable: false, needsConfirm: false, needsPreview: false, reason: 'Request not found' };
  const needsConfirm = req.action_type === 'cancel_immediately';
  const needsPreview = actionNeedsPreview(req.action_type);
  if (req.archived_at) return { executable: false, needsConfirm, needsPreview, reason: 'Request is archived' };
  if (!requestStatusExecutable(req.action_type, req.status)) {
    return { executable: false, needsConfirm, needsPreview, reason: `Not executable from status ${req.status}` };
  }
  const { data: sub } = await admin
    .from('customer_subscriptions')
    .select('status, archived_at')
    .eq('id', req.customer_subscription_id)
    .maybeSingle();
  if (!sub || sub.archived_at || !SUBSCRIPTION_MUTABLE_STATUSES.has(sub.status)) {
    return { executable: false, needsConfirm, needsPreview, reason: 'Subscription is not in a changeable state' };
  }
  return { executable: true, needsConfirm, needsPreview, reason: null };
}

/** Change requests for a subscription (for the subscription detail panel + history). */
export async function listChangeRequestsForSubscription(customerSubscriptionId: string): Promise<ChangeRequestListRow[]> {
  const { rows } = await listSubscriptionChangeRequests({ customerSubscriptionId, showArchived: false, page: 1 });
  return rows;
}

/**
 * Compute which actions are eligible for a target subscription (UI gating). Eligibility is derived from
 * the P12A registry snapshot status (Stripe authoritative). Permission gating is applied separately by
 * the caller. This is advisory; the live status is re-checked when a request is created.
 */
export async function getAllowedSubscriptionActions(customerSubscriptionId: string): Promise<AllowedAction[]> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('customer_subscriptions')
    .select('status, cancel_at_period_end, archived_at')
    .eq('id', customerSubscriptionId)
    .maybeSingle();

  const status = sub?.status ?? 'unknown';
  const archived = !!sub?.archived_at;
  const cancelAtPeriodEnd = !!sub?.cancel_at_period_end;
  const isActiveish = status === 'active' || status === 'trialing' || status === 'past_due';

  function entry(action: AllowedAction['action'], eligible: boolean, reason: string | null): AllowedAction {
    return { action, eligible: eligible && !archived, needsPreview: actionNeedsPreview(action), reason: archived ? 'Subscription link is archived' : reason };
  }

  return [
    entry('change_plan', isActiveish, isActiveish ? null : 'Only active/trialing/past_due subscriptions'),
    entry('change_quantity', isActiveish, isActiveish ? null : 'Only active/trialing/past_due subscriptions'),
    entry('cancel_at_period_end', isActiveish && !cancelAtPeriodEnd, cancelAtPeriodEnd ? 'Already set to cancel at period end' : isActiveish ? null : 'Only active subscriptions'),
    entry('undo_cancel_at_period_end', isActiveish && cancelAtPeriodEnd, cancelAtPeriodEnd ? null : 'Not currently set to cancel at period end'),
    entry('cancel_immediately', isActiveish, isActiveish ? null : 'Only active subscriptions'),
    entry('pause_collection', status === 'active' || status === 'trialing', status === 'active' || status === 'trialing' ? null : 'Only active/trialing subscriptions'),
    entry('resume_collection', status === 'paused', status === 'paused' ? null : 'Only paused subscriptions'),
  ];
}
