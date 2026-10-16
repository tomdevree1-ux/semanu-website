import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ContactListRow, ContactDetail } from './types';

/**
 * SERVER ONLY contact reads (service-role; callers gate with
 * requirePermission('contacts.read')). Company names are resolved with a second
 * lookup (not a PostgREST embed) to stay aligned with the hand-maintained types.
 * Default lists hide archived rows at the query layer.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

const CONTACT_STATUSES = ['lead', 'qualified', 'active', 'dormant', 'blocked', 'archived'];

export type ContactFilters = {
  q?: string;
  status?: string;
  companyId?: string;
  showArchived?: boolean;
  page?: number;
};

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

async function resolveCompanyNames(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name').in('id', unique);
  for (const c of data ?? []) map.set(c.id, c.company_name);
  return map;
}

export async function listContacts(
  filters: ContactFilters,
): Promise<{ rows: ContactListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('company_contacts')
    .select('id,name,email,phone,role,contact_status,is_primary,company_id,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && CONTACT_STATUSES.includes(filters.status)) q = q.eq('contact_status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) {
    const { data: cs } = await admin.from('companies').select('id').ilike('company_name', `%${s}%`);
    const companyIds = (cs ?? []).map((c) => c.id);
    const ors = [`name.ilike.%${s}%`, `email.ilike.%${s}%`, `phone.ilike.%${s}%`, `role.ilike.%${s}%`];
    if (companyIds.length) ors.push(`company_id.in.(${companyIds.join(',')})`);
    q = q.or(ors.join(','));
  }

  q = q.order('updated_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const names = await resolveCompanyNames(admin, list.map((c) => c.company_id));
  const rows: ContactListRow[] = list.map((ct) => ({
    id: ct.id,
    name: ct.name,
    email: ct.email,
    phone: ct.phone,
    role: ct.role,
    contactStatus: ct.contact_status,
    isPrimary: ct.is_primary,
    companyId: ct.company_id,
    companyName: names.get(ct.company_id) ?? null,
    updatedAt: ct.updated_at,
    archivedAt: ct.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getContact(id: string): Promise<ContactDetail | null> {
  const admin = createAdminClient();
  const { data: ct } = await admin.from('company_contacts').select('*').eq('id', id).maybeSingle();
  if (!ct) return null;

  const names = await resolveCompanyNames(admin, [ct.company_id]);
  return {
    id: ct.id,
    name: ct.name,
    email: ct.email,
    phone: ct.phone,
    role: ct.role,
    contactStatus: ct.contact_status,
    isPrimary: ct.is_primary,
    companyId: ct.company_id,
    companyName: names.get(ct.company_id) ?? null,
    createdAt: ct.created_at,
    updatedAt: ct.updated_at,
    archivedAt: ct.archived_at,
    archivedBy: ct.archived_by,
    isArchived: !!ct.archived_at,
  };
}
