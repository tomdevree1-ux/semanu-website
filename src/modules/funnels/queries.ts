import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { FUNNEL_STATUSES, FUNNEL_SOURCE_TYPES, FUNNEL_SPAM_STATUSES } from './status';
import { fullName } from './format';
import type { FunnelListRow, FunnelDetail, OwnerOption, CompanyOption, ContactOption, FunnelFilters } from './types';

/**
 * SERVER ONLY funnel reads (service-role; callers gate with requirePermission('funnels.read')). Default
 * lists hide archived. Hashes (ip/user-agent) are never returned to the UI.
 */
const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}
async function resolveCompanyNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.company_name || '');
  return map;
}
async function resolveContactNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('company_contacts').select('id, name, email').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.name || r.email || '');
  return map;
}
async function resolveProfileNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, email').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.full_name || r.email || '');
  return map;
}

export async function listFunnelSubmissions(
  filters: FunnelFilters,
): Promise<{ rows: FunnelListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('funnel_submissions')
    .select(
      'id,source_type,status,spam_status,first_name,last_name,email,website_url,normalized_domain,company_id,contact_id,owner_id,created_at,archived_at',
      { count: 'exact' },
    );

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.sourceType && (FUNNEL_SOURCE_TYPES as ReadonlyArray<string>).includes(filters.sourceType)) q = q.eq('source_type', filters.sourceType);
  if (filters.status && (FUNNEL_STATUSES as ReadonlyArray<string>).includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.spamStatus && (FUNNEL_SPAM_STATUSES as ReadonlyArray<string>).includes(filters.spamStatus)) q = q.eq('spam_status', filters.spamStatus);
  if (filters.ownerId) q = q.eq('owner_id', filters.ownerId);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,normalized_domain.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [companyNames, contactNames, ownerNames] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, list.map((x) => x.contact_id ?? '').filter(Boolean)),
    resolveProfileNames(admin, list.map((x) => x.owner_id ?? '').filter(Boolean)),
  ]);

  const rows: FunnelListRow[] = list.map((x) => ({
    id: x.id,
    sourceType: x.source_type,
    status: x.status,
    spamStatus: x.spam_status,
    firstName: x.first_name,
    lastName: x.last_name,
    email: x.email,
    websiteUrl: x.website_url,
    normalizedDomain: x.normalized_domain,
    companyId: x.company_id,
    companyName: x.company_id ? companyNames.get(x.company_id) || null : null,
    contactId: x.contact_id,
    contactName: x.contact_id ? contactNames.get(x.contact_id) || null : null,
    ownerId: x.owner_id,
    ownerName: x.owner_id ? ownerNames.get(x.owner_id) || null : null,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getFunnelSubmission(id: string): Promise<FunnelDetail | null> {
  const admin = createAdminClient();
  const { data: f } = await admin.from('funnel_submissions').select('*').eq('id', id).maybeSingle();
  if (!f) return null;

  const [company, contact, owner] = await Promise.all([
    f.company_id ? admin.from('companies').select('company_name, archived_at').eq('id', f.company_id).maybeSingle() : Promise.resolve({ data: null }),
    f.contact_id ? admin.from('company_contacts').select('name, email, archived_at').eq('id', f.contact_id).maybeSingle() : Promise.resolve({ data: null }),
    f.owner_id ? admin.from('profiles').select('full_name, email').eq('id', f.owner_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // Possible-duplicate hint: other non-archived submissions with the same email or domain.
  let duplicateCount = 0;
  {
    const or = [`email.ilike.${f.email}`];
    if (f.normalized_domain) or.push(`normalized_domain.eq.${f.normalized_domain}`);
    const { count } = await admin
      .from('funnel_submissions')
      .select('id', { count: 'exact', head: true })
      .neq('id', f.id)
      .is('archived_at', null)
      .or(or.join(','));
    duplicateCount = count ?? 0;
  }

  return {
    id: f.id,
    sourceType: f.source_type,
    status: f.status,
    spamStatus: f.spam_status,
    spamScore: f.spam_score,
    firstName: f.first_name,
    lastName: f.last_name,
    email: f.email,
    phone: f.phone,
    websiteUrl: f.website_url,
    normalizedDomain: f.normalized_domain,
    companyName: f.company_name,
    payload: (f.payload as Record<string, unknown>) ?? {},
    utmSource: f.utm_source,
    utmMedium: f.utm_medium,
    utmCampaign: f.utm_campaign,
    utmTerm: f.utm_term,
    utmContent: f.utm_content,
    referrer: f.referrer,
    pagePath: f.page_path,
    locale: f.locale,
    consentPrivacy: f.consent_privacy,
    consentMarketing: f.consent_marketing,
    companyId: f.company_id,
    companyNameLinked: company.data?.company_name ?? null,
    companyArchived: !!company.data?.archived_at,
    contactId: f.contact_id,
    contactName: contact.data?.name ?? contact.data?.email ?? null,
    contactArchived: !!contact.data?.archived_at,
    ownerId: f.owner_id,
    ownerName: owner.data ? owner.data.full_name || owner.data.email || null : null,
    notes: f.notes,
    internalNotes: f.internal_notes,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    archivedAt: f.archived_at,
    isArchived: !!f.archived_at,
    duplicateCount,
  };
}

/** Active users assignable as funnel owners. */
export async function listFunnelOwners(): Promise<OwnerOption[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('id, full_name, email, is_active').eq('is_active', true).order('full_name').limit(200);
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email || 'User' }));
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

/** Contacts available to link, optionally filtered by name/email. */
export async function listLinkableContacts(q?: string): Promise<ContactOption[]> {
  const admin = createAdminClient();
  let query = admin.from('company_contacts').select('id, name, email, archived_at');
  const s = q ? sanitizeSearch(q) : '';
  if (s) query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
  query = query.order('archived_at', { ascending: true, nullsFirst: true }).order('name').limit(100);
  const { data } = await query;
  return (data ?? []).map((c) => ({ id: c.id, name: c.name || c.email || '(unnamed contact)', archived: !!c.archived_at }));
}
