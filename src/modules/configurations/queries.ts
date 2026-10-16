import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ConfigDetail, ConfigListRow, ConfigPayload, ConfigVersionRow } from './types';

/**
 * SERVER ONLY configuration reads (service-role; callers gate with
 * requirePermission('configurations.read')). Default lists hide archived.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['draft', 'quoted', 'archived'];

export type ConfigFilters = { q?: string; status?: string; showArchived?: boolean; page?: number };

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}
function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

/** Resolve profile ids to a display name (full name, else first + last, else email, else "System"). */
async function resolveProfileNames(admin: Admin, ids: Array<string | null>): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, first_name, last_name, email').in('id', unique);
  for (const p of data ?? []) {
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email || 'Portal';
    map.set(p.id, name);
  }
  return map;
}

async function resolveLeadInfo(
  admin: Admin,
  ids: Array<string | null>,
): Promise<Map<string, { name: string; email: string; company: string | null }>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  const map = new Map<string, { name: string; email: string; company: string | null }>();
  if (!unique.length) return map;
  const { data } = await admin.from('leads').select('id, firstname, lastname, email, company').in('id', unique);
  for (const l of data ?? []) {
    const name = [l.firstname, l.lastname].filter(Boolean).join(' ').trim() || l.email || 'Lead';
    map.set(l.id, { name, email: l.email, company: l.company ?? null });
  }
  return map;
}

export async function listConfigurations(
  filters: ConfigFilters,
): Promise<{ rows: ConfigListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('configurations')
    .select('id,config_number,title,situation,status,current_version,lead_id,company_id,quote_id,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`config_number.ilike.%${s}%,title.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  // Current version totals + lead info in one round-trip each.
  const [{ data: versionRows }, leadInfo] = await Promise.all([
    list.length
      ? admin.from('configuration_versions').select('configuration_id, version, monthly_total, onetime_total').in('configuration_id', list.map((x) => x.id))
      : Promise.resolve({ data: [] as Array<{ configuration_id: string; version: number; monthly_total: number; onetime_total: number }> }),
    resolveLeadInfo(admin, list.map((x) => x.lead_id)),
  ]);
  const currentByConfig = new Map<string, { monthly: number; oneTime: number }>();
  for (const x of list) {
    const v = (versionRows ?? []).find((r) => r.configuration_id === x.id && r.version === x.current_version);
    currentByConfig.set(x.id, { monthly: num(v?.monthly_total), oneTime: num(v?.onetime_total) });
  }

  const rows: ConfigListRow[] = list.map((x) => {
    const cur = currentByConfig.get(x.id);
    const lead = x.lead_id ? leadInfo.get(x.lead_id) : null;
    return {
      id: x.id,
      configNumber: x.config_number,
      title: x.title,
      situation: x.situation,
      status: x.status,
      currentVersion: x.current_version,
      monthly: cur?.monthly ?? 0,
      oneTime: cur?.oneTime ?? 0,
      leadName: lead?.name ?? null,
      leadEmail: lead?.email ?? null,
      companyId: x.company_id,
      quoteId: x.quote_id,
      updatedAt: x.updated_at,
      archivedAt: x.archived_at,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getConfiguration(id: string): Promise<ConfigDetail | null> {
  const admin = createAdminClient();
  const { data: cfg } = await admin.from('configurations').select('*').eq('id', id).maybeSingle();
  if (!cfg) return null;

  const [{ data: versionRows }, lead, { data: company }] = await Promise.all([
    admin
      .from('configuration_versions')
      .select('id, version, monthly_total, onetime_total, note, created_at, created_by, payload')
      .eq('configuration_id', id)
      .order('version', { ascending: false }),
    cfg.lead_id
      ? admin.from('leads').select('firstname, lastname, email, company').eq('id', cfg.lead_id).maybeSingle()
      : Promise.resolve({ data: null }),
    cfg.company_id
      ? admin.from('companies').select('company_name').eq('id', cfg.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const names = await resolveProfileNames(admin, (versionRows ?? []).map((v) => v.created_by));
  const versions: ConfigVersionRow[] = (versionRows ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    monthly: num(v.monthly_total),
    oneTime: num(v.onetime_total),
    note: v.note,
    createdAt: v.created_at,
    createdByName: v.created_by ? names.get(v.created_by) ?? 'Portal' : 'Website',
    payload: (v.payload ?? {}) as ConfigPayload,
  }));

  const leadRow = (lead?.data ?? null) as { firstname?: string; lastname?: string; email?: string; company?: string } | null;
  const leadName = leadRow ? [leadRow.firstname, leadRow.lastname].filter(Boolean).join(' ').trim() || leadRow.email || 'Lead' : null;

  return {
    id: cfg.id,
    configNumber: cfg.config_number,
    title: cfg.title,
    situation: cfg.situation,
    status: cfg.status,
    currentVersion: cfg.current_version,
    source: cfg.source,
    leadId: cfg.lead_id,
    leadName,
    leadEmail: leadRow?.email ?? null,
    leadCompany: leadRow?.company ?? null,
    companyId: cfg.company_id,
    companyName: company?.company_name ?? null,
    quoteId: cfg.quote_id,
    createdAt: cfg.created_at,
    updatedAt: cfg.updated_at,
    archivedAt: cfg.archived_at,
    isArchived: !!cfg.archived_at,
    versions,
  };
}
