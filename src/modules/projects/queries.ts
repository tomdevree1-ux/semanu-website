import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ProjectListRow, ProjectDetail, CompanyProjectRow } from './types';

/**
 * SERVER ONLY project reads (service-role; callers gate with
 * requirePermission('projects.read')). Names are resolved with separate lookups
 * (not PostgREST embeds) to stay aligned with the hand-maintained types. Default
 * lists hide archived rows at the query layer.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived'];

export type ProjectFilters = {
  q?: string;
  status?: string;
  companyId?: string;
  ownerId?: string;
  showArchived?: boolean;
  page?: number;
};

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

async function resolveNames(
  admin: Admin,
  companyIds: string[],
  ownerIds: Array<string | null>,
  contactIds: Array<string | null>,
) {
  const cmap = new Map<string, string>();
  const omap = new Map<string, string>();
  const ctmap = new Map<string, string>();
  const cu = [...new Set(companyIds.filter(Boolean))];
  const ou = [...new Set(ownerIds.filter((v): v is string => !!v))];
  const ctu = [...new Set(contactIds.filter((v): v is string => !!v))];
  // The three name lookups are mutually independent, so run them in one round-trip.
  const [companyRes, ownerRes, contactRes] = await Promise.all([
    cu.length ? admin.from('companies').select('id, company_name').in('id', cu) : Promise.resolve({ data: null }),
    ou.length ? admin.from('profiles').select('id, full_name, email').in('id', ou) : Promise.resolve({ data: null }),
    ctu.length ? admin.from('company_contacts').select('id, name, email').in('id', ctu) : Promise.resolve({ data: null }),
  ]);
  for (const c of companyRes.data ?? []) cmap.set(c.id, c.company_name);
  for (const p of ownerRes.data ?? []) omap.set(p.id, p.full_name || p.email);
  for (const ct of contactRes.data ?? []) ctmap.set(ct.id, ct.name || ct.email || 'Contact');
  return { cmap, omap, ctmap };
}

export async function listProjects(
  filters: ProjectFilters,
): Promise<{ rows: ProjectListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('projects')
    .select('id,name,status,company_id,primary_contact_id,owner_id,due_date,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  if (filters.ownerId) q = q.eq('owner_id', filters.ownerId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);

  q = q.order('updated_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const { cmap, omap, ctmap } = await resolveNames(
    admin,
    list.map((p) => p.company_id),
    list.map((p) => p.owner_id),
    list.map((p) => p.primary_contact_id),
  );

  const rows: ProjectListRow[] = list.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    companyId: p.company_id,
    companyName: cmap.get(p.company_id) ?? null,
    ownerName: p.owner_id ? omap.get(p.owner_id) ?? null : null,
    primaryContactName: p.primary_contact_id ? ctmap.get(p.primary_contact_id) ?? null : null,
    dueDate: p.due_date,
    updatedAt: p.updated_at,
    archivedAt: p.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const admin = createAdminClient();
  const { data: p } = await admin.from('projects').select('*').eq('id', id).maybeSingle();
  if (!p) return null;

  // After the project row is known, these three reads are mutually independent
  // (they only use FK ids from `p`), so run them in one round-trip.
  const [{ data: company }, { data: ct }, { data: o }] = await Promise.all([
    admin.from('companies').select('company_name, archived_at').eq('id', p.company_id).maybeSingle(),
    p.primary_contact_id
      ? admin.from('company_contacts').select('name, email, archived_at').eq('id', p.primary_contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    p.owner_id
      ? admin.from('profiles').select('full_name, email').eq('id', p.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let primaryContactName: string | null = null;
  let primaryContactArchived = false;
  if (ct) {
    primaryContactName = ct.name || ct.email || 'Contact';
    primaryContactArchived = !!ct.archived_at;
  }

  let ownerName: string | null = null;
  if (o) ownerName = o.full_name || o.email;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    companyId: p.company_id,
    companyName: company?.company_name ?? null,
    companyArchived: !!company?.archived_at,
    primaryContactId: p.primary_contact_id,
    primaryContactName,
    primaryContactArchived,
    ownerId: p.owner_id,
    ownerName,
    startDate: p.start_date,
    dueDate: p.due_date,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    archivedAt: p.archived_at,
    archivedBy: p.archived_by,
    isArchived: !!p.archived_at,
  };
}

/** Projects for the company detail page (default non-archived). */
export async function listProjectsForCompany(
  companyId: string,
  opts?: { showArchived?: boolean },
): Promise<CompanyProjectRow[]> {
  const admin = createAdminClient();
  let q = admin.from('projects').select('id,name,status,owner_id,due_date,archived_at').eq('company_id', companyId);
  if (!opts?.showArchived) q = q.is('archived_at', null);
  q = q.order('updated_at', { ascending: false });
  const { data } = await q;
  const list = data ?? [];
  const { omap } = await resolveNames(admin, [], list.map((p) => p.owner_id), []);
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    ownerName: p.owner_id ? omap.get(p.owner_id) ?? null : null,
    dueDate: p.due_date,
    archivedAt: p.archived_at,
  }));
}

/** Active internal users assignable as a project owner. */
export async function listProjectOwnerOptions(): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email }));
}

/** Non-archived contacts for a company (the project's contact picker). */
export async function listContactOptionsForCompany(
  companyId: string,
): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('company_contacts')
    .select('id, name, email, is_primary')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });
  return (data ?? []).map((c) => ({ id: c.id, name: c.name || c.email || 'Contact' }));
}
