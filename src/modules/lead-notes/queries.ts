import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LeadNote } from './types';

/** Resolve profile ids to a display name (full name / first+last / email). */
export async function resolveNames(admin: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (!clean.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, first_name, last_name, email').in('id', clean);
  for (const p of (data ?? []) as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }>) {
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email || 'Unknown';
    map.set(p.id, name);
  }
  return map;
}

/** All notes for a lead, newest first, with author names. */
export async function listLeadNotes(leadId: string): Promise<LeadNote[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from('lead_notes')
    .select('id, body, current_version, created_at, updated_at, created_by, updated_by')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  const notes = (data ?? []) as Array<{
    id: string; body: string; current_version: number; created_at: string; updated_at: string;
    created_by: string | null; updated_by: string | null;
  }>;
  const names = await resolveNames(admin, notes.flatMap((n) => [n.created_by ?? '', n.updated_by ?? '']));
  return notes.map((n) => ({
    id: n.id,
    body: n.body,
    version: n.current_version,
    authorName: names.get(n.created_by ?? '') ?? 'Unknown',
    editorName: n.updated_by && n.updated_by !== n.created_by ? names.get(n.updated_by) ?? null : null,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));
}
