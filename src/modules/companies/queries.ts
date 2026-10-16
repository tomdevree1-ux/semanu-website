import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CompanyListRow, CompanyDetail, CompanyContactRow } from './types';

/**
 * SERVER ONLY company reads. Uses the service-role client (every caller gates
 * with requirePermission('companies.read') first). The existing `companies_select`
 * RLS already allows authenticated staff to read; the default list hides archived
 * rows at the query layer (archived_at is null) like the users module.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

const CRM_STATUSES = ['lead', 'qualified', 'active', 'dormant', 'lost', 'blocked', 'archived'];

export type CompanyFilters = {
  q?: string;
  crmStatus?: string;
  leadStatus?: string;
  source?: string;
  showArchived?: boolean;
  page?: number;
};

/** Strip characters with meaning in a PostgREST `or()` filter, then cap length. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

async function resolveOwnerNames(admin: Admin, ids: Array<string | null>): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((v): v is string => !!v))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, email').in('id', unique);
  for (const p of data ?? []) map.set(p.id, p.full_name || p.email);
  return map;
}

export async function listCompanies(
  filters: CompanyFilters,
): Promise<{ rows: CompanyListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('companies')
    .select('id,company_name,domain,email,city,canton,crm_status,lead_status,source,owner_id,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.crmStatus && CRM_STATUSES.includes(filters.crmStatus)) q = q.eq('crm_status', filters.crmStatus);
  if (filters.leadStatus) q = q.eq('lead_status', filters.leadStatus);
  if (filters.source) q = q.eq('source', filters.source);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`company_name.ilike.%${s}%,domain.ilike.%${s}%,email.ilike.%${s}%`);

  q = q.order('updated_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const ownerNames = await resolveOwnerNames(admin, list.map((c) => c.owner_id));
  const rows: CompanyListRow[] = list.map((c) => ({
    id: c.id,
    companyName: c.company_name,
    domain: c.domain,
    email: c.email,
    city: c.city,
    canton: c.canton,
    crmStatus: c.crm_status,
    leadStatus: c.lead_status,
    source: c.source,
    ownerName: c.owner_id ? ownerNames.get(c.owner_id) ?? null : null,
    updatedAt: c.updated_at,
    archivedAt: c.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getCompany(id: string): Promise<CompanyDetail | null> {
  const admin = createAdminClient();
  const { data: c } = await admin.from('companies').select('*').eq('id', id).maybeSingle();
  if (!c) return null;

  // Owner-name resolution and the contact list are independent reads, so run them concurrently.
  const [ownerNames, { data: contactRows }] = await Promise.all([
    resolveOwnerNames(admin, [c.owner_id]),
    admin
      .from('company_contacts')
      .select('id,name,email,phone,role,contact_status,is_primary,archived_at')
      .eq('company_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),
  ]);

  const contacts: CompanyContactRow[] = (contactRows ?? []).map((ct) => ({
    id: ct.id,
    name: ct.name,
    email: ct.email,
    phone: ct.phone,
    role: ct.role,
    contactStatus: ct.contact_status,
    isPrimary: ct.is_primary,
    archivedAt: ct.archived_at,
  }));

  return {
    id: c.id,
    companyName: c.company_name,
    domain: c.domain,
    websiteUrl: c.website_url,
    email: c.email,
    phone: c.phone,
    city: c.city,
    canton: c.canton,
    country: c.country,
    language: c.language_pref,
    industry: c.industry,
    notes: c.notes,
    source: c.source,
    crmStatus: c.crm_status,
    leadStatus: c.lead_status,
    leadPriority: c.lead_priority,
    ownerId: c.owner_id,
    ownerName: c.owner_id ? ownerNames.get(c.owner_id) ?? null : null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastScannedAt: c.last_scanned_at,
    archivedAt: c.archived_at,
    archivedBy: c.archived_by,
    isArchived: !!c.archived_at,
    contacts,
  };
}

/** Lightweight option list for the contact "company" picker (non-archived). */
export async function listCompanyOptions(limit = 1000): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('companies')
    .select('id, company_name')
    .is('archived_at', null)
    .order('company_name', { ascending: true })
    .limit(limit);
  return (data ?? []).map((c) => ({ id: c.id, name: c.company_name }));
}

/** Active internal users assignable as a company owner / account manager. */
export async function listAssignableOwners(): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email }));
}
