'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePermission } from '@/lib/security/rbac';
import { logEvent } from '@/lib/audit/log';
import { resolveNames } from './queries';
import type { LeadNoteVersion } from './types';

/** Add a new note to a lead (version 1). */
export async function createLeadNote(leadId: string, body: string): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  const clean = body.trim().slice(0, 5000);
  if (!leadId || !clean) throw new Error('Empty note.');

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: note, error } = await admin
    .from('lead_notes')
    .insert({ lead_id: leadId, body: clean, current_version: 1, created_by: actor.id, updated_by: actor.id })
    .select('id')
    .single();
  if (error || !note) throw new Error('Could not save the note.');
  await admin.from('lead_note_versions').insert({ note_id: note.id, version: 1, body: clean, created_by: actor.id });

  await logEvent({ action: 'lead.note_added', actorId: actor.id, entityType: 'lead', entityId: leadId, metadata: { note_id: note.id }, source: 'portal' });
  revalidatePath(`/app/leads/${leadId}`);
  return { ok: true };
}

/** Edit an existing note — writes a new immutable version and bumps current_version. */
export async function updateLeadNote(noteId: string, body: string): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  const clean = body.trim().slice(0, 5000);
  if (!noteId || !clean) throw new Error('Empty note.');

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: note } = await admin.from('lead_notes').select('lead_id, body, current_version').eq('id', noteId).maybeSingle();
  if (!note) throw new Error('Note not found.');
  if (note.body === clean) {
    revalidatePath(`/app/leads/${note.lead_id}`);
    return { ok: true };
  }

  const next = note.current_version + 1;
  await admin.from('lead_note_versions').insert({ note_id: noteId, version: next, body: clean, created_by: actor.id });
  const { error } = await admin
    .from('lead_notes')
    .update({ body: clean, current_version: next, updated_by: actor.id, updated_at: new Date().toISOString() })
    .eq('id', noteId);
  if (error) throw new Error('Could not update the note.');

  await logEvent({ action: 'lead.note_edited', actorId: actor.id, entityType: 'lead', entityId: note.lead_id, metadata: { note_id: noteId, version: next }, source: 'portal' });
  revalidatePath(`/app/leads/${note.lead_id}`);
  return { ok: true };
}

/** Delete a note and its version history. */
export async function deleteLeadNote(noteId: string): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: note } = await admin.from('lead_notes').select('lead_id').eq('id', noteId).maybeSingle();
  if (!note) return { ok: true };
  await admin.from('lead_notes').delete().eq('id', noteId);
  await logEvent({ action: 'lead.note_deleted', actorId: actor.id, entityType: 'lead', entityId: note.lead_id, metadata: { note_id: noteId }, source: 'portal' });
  revalidatePath(`/app/leads/${note.lead_id}`);
  return { ok: true };
}

/** Full edit history of a note, newest version first. */
export async function listLeadNoteVersions(noteId: string): Promise<LeadNoteVersion[]> {
  await requirePermission('leads.read');
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from('lead_note_versions')
    .select('version, body, created_by, created_at')
    .eq('note_id', noteId)
    .order('version', { ascending: false });
  const rows = (data ?? []) as Array<{ version: number; body: string; created_by: string | null; created_at: string }>;
  const names = await resolveNames(admin, rows.map((r) => r.created_by ?? ''));
  return rows.map((r) => ({
    version: r.version,
    body: r.body,
    authorName: names.get(r.created_by ?? '') ?? 'Unknown',
    createdAt: r.created_at,
  }));
}
