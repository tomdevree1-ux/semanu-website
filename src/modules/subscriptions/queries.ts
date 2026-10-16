import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  SubscriptionListRow,
  SubscriptionDetail,
  CompanySubscriptionRow,
  CompanyOption,
  ContactOption,
  SubscriptionFilters,
} from './types';
import { SUBSCRIPTION_STATUSES } from './status';

/**
 * SERVER ONLY subscription-registry reads (service-role; callers gate with
 * requirePermission('subscriptions.read')). Default lists hide archived rows. Stripe is
 * authoritative for subscription state; these reads return the last-synced local snapshot.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const SYNC_STATUSES = ['pending', 'synced', 'failed', 'stale'];

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}
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

/** Company / contact ids whose name matches the search term (for name search in the list). */
async function idsMatchingSearch(admin: Admin, s: string): Promise<{ companyIds: string[]; contactIds: string[] }> {
  const [{ data: comps }, { data: contacts }] = await Promise.all([
    admin.from('companies').select('id').ilike('company_name', `%${s}%`).limit(50),
    admin.from('company_contacts').select('id').or(`name.ilike.%${s}%,email.ilike.%${s}%`).limit(50),
  ]);
  return { companyIds: (comps ?? []).map((c) => c.id), contactIds: (contacts ?? []).map((c) => c.id) };
}

export async function listSubscriptions(
  filters: SubscriptionFilters,
): Promise<{ rows: SubscriptionListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('customer_subscriptions')
    .select(
      'id,status,sync_status,stripe_subscription_id,stripe_customer_id,plan_key,amount,currency,interval,quantity,current_period_end,cancel_at_period_end,company_id,contact_id,last_synced_at,created_at,archived_at',
      { count: 'exact' },
    );

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && (SUBSCRIPTION_STATUSES as ReadonlyArray<string>).includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.syncStatus && SYNC_STATUSES.includes(filters.syncStatus)) q = q.eq('sync_status', filters.syncStatus);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  if (filters.contactId) q = q.eq('contact_id', filters.contactId);
  if (filters.stripeCustomerId) q = q.eq('stripe_customer_id', filters.stripeCustomerId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) {
    const clauses = [
      `stripe_subscription_id.ilike.%${s}%`,
      `stripe_customer_id.ilike.%${s}%`,
      `plan_key.ilike.%${s}%`,
      `notes.ilike.%${s}%`,
    ];
    const { companyIds, contactIds } = await idsMatchingSearch(admin, s);
    if (companyIds.length) clauses.push(`company_id.in.(${companyIds.join(',')})`);
    if (contactIds.length) clauses.push(`contact_id.in.(${contactIds.join(',')})`);
    q = q.or(clauses.join(','));
  }

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [companyNames, contactNames] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, list.map((x) => x.contact_id ?? '').filter(Boolean)),
  ]);

  const rows: SubscriptionListRow[] = list.map((x) => ({
    id: x.id,
    status: x.status,
    syncStatus: x.sync_status,
    stripeSubscriptionId: x.stripe_subscription_id,
    stripeCustomerId: x.stripe_customer_id,
    planKey: x.plan_key,
    amount: num(x.amount),
    currency: x.currency,
    interval: x.interval,
    quantity: x.quantity,
    currentPeriodEnd: x.current_period_end,
    cancelAtPeriodEnd: x.cancel_at_period_end,
    companyId: x.company_id,
    companyName: x.company_id ? companyNames.get(x.company_id) ?? null : null,
    contactId: x.contact_id,
    contactName: x.contact_id ? contactNames.get(x.contact_id) ?? null : null,
    lastSyncedAt: x.last_synced_at,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getSubscription(id: string): Promise<SubscriptionDetail | null> {
  const admin = createAdminClient();
  const { data: s } = await admin.from('customer_subscriptions').select('*').eq('id', id).maybeSingle();
  if (!s) return null;

  const [company, contact, customer] = await Promise.all([
    s.company_id
      ? admin.from('companies').select('company_name, archived_at').eq('id', s.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
    s.contact_id
      ? admin.from('company_contacts').select('name, archived_at').eq('id', s.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    s.customer_id
      ? admin.from('customers').select('name, email').eq('id', s.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const customerLabel = customer.data ? customer.data.name ?? customer.data.email ?? null : null;

  return {
    id: s.id,
    status: s.status,
    syncStatus: s.sync_status,
    stripeSubscriptionId: s.stripe_subscription_id,
    stripeCustomerId: s.stripe_customer_id,
    stripeProductId: s.stripe_product_id,
    stripePriceId: s.stripe_price_id,
    planKey: s.plan_key,
    amount: num(s.amount),
    currency: s.currency,
    interval: s.interval,
    quantity: s.quantity,
    currentPeriodStart: s.current_period_start,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    cancelledAt: s.cancelled_at,
    trialStart: s.trial_start,
    trialEnd: s.trial_end,
    companyId: s.company_id,
    companyName: company.data?.company_name ?? null,
    companyArchived: !!company.data?.archived_at,
    contactId: s.contact_id,
    contactName: contact.data?.name ?? null,
    contactArchived: !!contact.data?.archived_at,
    customerId: s.customer_id,
    customerLabel,
    notes: s.notes,
    internalNotes: s.internal_notes,
    lastSyncedAt: s.last_synced_at,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    archivedAt: s.archived_at,
    archivedBy: s.archived_by,
    isArchived: !!s.archived_at,
  };
}

/** Subscriptions linked to a company, for the company detail section (non-archived first). */
export async function listSubscriptionsForCompany(companyId: string): Promise<CompanySubscriptionRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('customer_subscriptions')
    .select('id,status,stripe_subscription_id,plan_key,amount,currency,interval,current_period_end,cancel_at_period_end,archived_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((x) => ({
    id: x.id,
    status: x.status,
    stripeSubscriptionId: x.stripe_subscription_id,
    planKey: x.plan_key,
    amount: num(x.amount),
    currency: x.currency,
    interval: x.interval,
    currentPeriodEnd: x.current_period_end,
    cancelAtPeriodEnd: x.cancel_at_period_end,
    archivedAt: x.archived_at,
  }));
}

/** Subscriptions linked to a contact (for an optional contact-detail section). */
export async function listSubscriptionsForContact(contactId: string): Promise<CompanySubscriptionRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('customer_subscriptions')
    .select('id,status,stripe_subscription_id,plan_key,amount,currency,interval,current_period_end,cancel_at_period_end,archived_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((x) => ({
    id: x.id,
    status: x.status,
    stripeSubscriptionId: x.stripe_subscription_id,
    planKey: x.plan_key,
    amount: num(x.amount),
    currency: x.currency,
    interval: x.interval,
    currentPeriodEnd: x.current_period_end,
    cancelAtPeriodEnd: x.cancel_at_period_end,
    archivedAt: x.archived_at,
  }));
}

/** Find an existing registry row by Stripe subscription id (duplicate-link detection). */
export async function findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('customer_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();
  return data ?? null;
}

/** Companies available to link (non-archived first), optionally filtered by name. */
export async function listLinkableCompanies(q?: string): Promise<CompanyOption[]> {
  const admin = createAdminClient();
  let query = admin.from('companies').select('id, company_name, archived_at');
  const s = q ? sanitizeSearch(q) : '';
  if (s) query = query.ilike('company_name', `%${s}%`);
  query = query.order('archived_at', { ascending: true, nullsFirst: true }).order('company_name').limit(100);
  const { data } = await query;
  return (data ?? []).map((c) => ({ id: c.id, name: c.company_name, archived: !!c.archived_at }));
}

/** Contacts of a company, available to link. */
export async function listLinkableContactsForCompany(companyId: string): Promise<ContactOption[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('company_contacts')
    .select('id, name, archived_at')
    .eq('company_id', companyId)
    .order('archived_at', { ascending: true, nullsFirst: true })
    .order('name')
    .limit(100);
  return (data ?? []).map((c) => ({ id: c.id, name: c.name ?? '(unnamed contact)', archived: !!c.archived_at }));
}

/** Suggest a CRM company for a Stripe customer id via the legacy customers bridge. */
export async function suggestCompanyForStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('customers')
    .select('company_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  return data?.company_id ?? null;
}
