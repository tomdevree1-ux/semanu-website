import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { AVATAR_BUCKET } from '@/lib/security/upload';
import { LEAD_CHANNELS, LEAD_STATUSES, type AssignableUser, type LeadChannel, type LeadDetail, type LeadListRow, type LeadStatus } from './types';

/**
 * SERVER ONLY lead reads (service-role; callers gate with requirePermission('leads.read')).
 * Hashes (ip_hash/user_agent) are never returned to the UI. Mirrors the funnels/invoices
 * list query shape: paginated, count:'exact', newest first.
 */
const PAGE_SIZE = 25;
const FORM_TYPES = ['contact', 'start'] as const;

export type LeadFilters = { q?: string; status?: string; formType?: string; channel?: string; page?: number };

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

function asStatus(v: string | null): LeadStatus {
  return (LEAD_STATUSES as ReadonlyArray<string>).includes(v ?? '') ? (v as LeadStatus) : 'new';
}

function asChannel(v: string | null): LeadChannel {
  return (LEAD_CHANNELS as ReadonlyArray<string>).includes(v ?? '') ? (v as LeadChannel) : 'contact_form';
}

type ProfileRow = { id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null };
function displayName(p: { full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }): string {
  return p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email || 'Unknown';
}

/** Resolve profile ids to display names in one query. */
async function resolveNames(admin: SupabaseClient, ids: (string | null)[]): Promise<Map<string, string>> {
  const clean = Array.from(new Set(ids.filter(Boolean))) as string[];
  const m = new Map<string, string>();
  if (!clean.length) return m;
  const { data } = await admin.from('profiles').select('id, full_name, first_name, last_name, email').in('id', clean);
  for (const p of (data ?? []) as ProfileRow[]) m.set(p.id, displayName(p));
  return m;
}

/** Portal users who can own a lead: everyone with the admin or sales role. */
export async function listAssignableUsers(): Promise<AssignableUser[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: roles } = await admin.from('roles').select('id, key').in('key', ['admin', 'sales']);
  const roleIds = ((roles ?? []) as Array<{ id: number }>).map((r) => r.id);
  if (!roleIds.length) return [];
  const { data: urs } = await admin.from('user_roles').select('user_id').in('role_id', roleIds);
  const userIds = Array.from(new Set(((urs ?? []) as Array<{ user_id: string }>).map((u) => u.user_id)));
  if (!userIds.length) return [];
  const { data: profs } = await admin.from('profiles').select('id, full_name, first_name, last_name, email, status, archived_at, avatar_url').in('id', userIds);
  const list = ((profs ?? []) as Array<ProfileRow & { status: string; archived_at: string | null; avatar_url: string | null }>)
    .filter((p) => p.archived_at == null && p.status !== 'archived' && p.status !== 'disabled');
  // One signed avatar URL per user (not per lead) — cheap regardless of lead count.
  const withAvatars = await Promise.all(
    list.map(async (p) => {
      let avatarUrl: string | null = null;
      if (p.avatar_url) {
        const { data } = await admin.storage.from(AVATAR_BUCKET).createSignedUrl(p.avatar_url, 3600);
        avatarUrl = data?.signedUrl ?? null;
      }
      return { id: p.id, name: displayName(p), avatarUrl };
    }),
  );
  return withAvatars.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listLeads(
  filters: LeadFilters,
): Promise<{ rows: LeadListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('leads')
    .select('id,form_type,firstname,lastname,email,company,phone,message,lang,status,channel,source_locale,created_at,assigned_to,lead_submissions(count)', {
      count: 'exact',
    });

  if (filters.status && (LEAD_STATUSES as ReadonlyArray<string>).includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.formType && (FORM_TYPES as ReadonlyArray<string>).includes(filters.formType)) q = q.eq('form_type', filters.formType);
  if (filters.channel && (LEAD_CHANNELS as ReadonlyArray<string>).includes(filters.channel)) q = q.eq('channel', filters.channel);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`firstname.ilike.%${s}%,lastname.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const rows: LeadListRow[] = list.map((x) => ({
    id: x.id,
    formType: x.form_type,
    firstname: x.firstname,
    lastname: x.lastname,
    email: x.email,
    company: x.company,
    phone: x.phone,
    message: x.message,
    lang: x.lang,
    status: asStatus(x.status),
    channel: asChannel(x.channel),
    source: x.source_locale,
    createdAt: x.created_at,
    submissionCount: Array.isArray(x.lead_submissions) ? (x.lead_submissions[0]?.count ?? 0) : 0,
    assignedToId: x.assigned_to ?? null,
    assignedToName: null as string | null,
  }));

  const names = await resolveNames(admin, rows.map((r) => r.assignedToId));
  for (const r of rows) if (r.assignedToId) r.assignedToName = names.get(r.assignedToId) ?? null;

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

/** Full lead for the detail view. Returns null when the id does not exist. */
export async function getLead(id: string): Promise<LeadDetail | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('leads')
    .select('id,form_type,firstname,lastname,email,company,phone,message,lang,status,channel,source_locale,notes,lost_reason,company_id,contact_id,assigned_to,created_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;

  let assignedToName: string | null = null;
  if (data.assigned_to) {
    const { data: pr } = await admin.from('profiles').select('full_name, first_name, last_name, email').eq('id', data.assigned_to).maybeSingle();
    if (pr) assignedToName = displayName(pr);
  }
  return {
    id: data.id,
    formType: data.form_type,
    firstname: data.firstname,
    lastname: data.lastname,
    email: data.email,
    company: data.company,
    phone: data.phone,
    message: data.message,
    lang: data.lang,
    status: asStatus(data.status),
    channel: asChannel(data.channel),
    source: data.source_locale,
    notes: data.notes,
    lostReason: data.lost_reason,
    companyId: data.company_id,
    contactId: data.contact_id,
    createdAt: data.created_at,
    submissionCount: 0,
    assignedToId: data.assigned_to,
    assignedToName,
  };
}
