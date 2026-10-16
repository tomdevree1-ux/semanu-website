'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import {
  funnelStatusSchema,
  funnelNotesSchema,
  funnelAssignSchema,
  funnelLinkContactSchema,
  funnelLinkCompanySchema,
  funnelCreateContactSchema,
  funnelIdSchema,
  type FunnelActionState,
} from './schema';
import { funnelIsArchivable } from './guards';
import { fullName } from './format';

/**
 * SERVER actions for funnel submissions (P13, portal). Every action: gates on the exact `funnels.*`
 * permission (CRM-create actions also require `companies.create`/`contacts.create`), writes via the
 * service role, audits, and revalidates. CRM rows are the source of truth: links never overwrite, creates
 * fill empty fields only. Submissions are never hard-deleted (archive). No checkout/Stripe/legacy write.
 */

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
type Admin = ReturnType<typeof createAdminClient>;

function revalidate(id: string, companyId?: string | null) {
  revalidatePath('/app/funnels');
  revalidatePath(`/app/funnels/${id}`);
  if (companyId) revalidatePath(`/app/companies/${companyId}`);
}

async function loadFunnel(admin: Admin, id: string) {
  const { data } = await admin.from('funnel_submissions').select('*').eq('id', id).maybeSingle();
  return data;
}

// ── status / notes / owner ─────────────────────────────────────────────────────

export async function updateFunnelStatus(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  const parsed = funnelStatusSchema.safeParse({ id: formData.get('id'), status: formData.get('status') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  if (parsed.data.status === 'archived') return { error: 'Use Archive to archive a submission.' };

  const admin = createAdminClient();
  const row = await loadFunnel(admin, parsed.data.id);
  if (!row) return { error: 'Submission not found.' };
  if (row.archived_at) return { error: 'Restore this submission before changing its status.' };

  await admin.from('funnel_submissions').update({ status: parsed.data.status, updated_by: actor.id }).eq('id', row.id);
  await logEvent({ action: 'funnel.status_changed', actorId: actor.id, entityType: 'funnel', entityId: row.id, oldStatus: row.status, newStatus: parsed.data.status, metadata: { source_type: row.source_type }, source: 'portal' });
  revalidate(row.id);
  return { ok: true };
}

export async function updateFunnelNotes(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };
  const admin = createAdminClient();
  const row = await loadFunnel(admin, id);
  if (!row) return { error: 'Submission not found.' };

  const parsed = funnelNotesSchema.safeParse({ notes: formData.get('notes'), internalNotes: formData.get('internalNotes') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const next = { notes: parsed.data.notes ?? null, internal_notes: parsed.data.internalNotes ?? null, updated_by: actor.id };
  const { error } = await admin.from('funnel_submissions').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const changed = (['notes', 'internal_notes'] as const).filter((k) => (row as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({ action: 'funnel.updated', actorId: actor.id, entityType: 'funnel', entityId: id, metadata: { fields: changed }, source: 'portal' });
  revalidate(id);
  return { ok: true };
}

export async function assignFunnelOwner(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.assign'))) return { error: NOT_ALLOWED };
  const parsed = funnelAssignSchema.safeParse({ id: formData.get('id'), ownerId: formData.get('ownerId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const row = await loadFunnel(admin, parsed.data.id);
  if (!row) return { error: 'Submission not found.' };
  if (parsed.data.ownerId) {
    const { data: p } = await admin.from('profiles').select('id').eq('id', parsed.data.ownerId).maybeSingle();
    if (!p) return { error: 'Selected owner not found.' };
  }
  await admin.from('funnel_submissions').update({ owner_id: parsed.data.ownerId ?? null, updated_by: actor.id }).eq('id', row.id);
  await logEvent({ action: 'funnel.assigned', actorId: actor.id, entityType: 'funnel', entityId: row.id, metadata: { owner_id: parsed.data.ownerId ?? null }, source: 'portal' });
  revalidate(row.id);
  return { ok: true };
}

// ── archive / restore ──────────────────────────────────────────────────────────

export async function archiveFunnelSubmission(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };
  const admin = createAdminClient();
  const row = await loadFunnel(admin, id);
  if (!row) return { error: 'Submission not found.' };
  if (!funnelIsArchivable(row.archived_at)) return { ok: true };

  await admin.from('funnel_submissions').update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id }).eq('id', id);
  await logEvent({ action: 'funnel.archived', actorId: actor.id, severity: 'warning', entityType: 'funnel', entityId: id, oldStatus: row.status, newStatus: 'archived', metadata: {}, source: 'portal' });
  revalidate(id);
  return { ok: true };
}

export async function restoreFunnelSubmission(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };
  const admin = createAdminClient();
  const row = await loadFunnel(admin, id);
  if (!row) return { error: 'Submission not found.' };
  if (!row.archived_at) return { error: 'This submission is not archived.' };

  await admin.from('funnel_submissions').update({ status: 'new', archived_at: null, archived_by: null, updated_by: actor.id }).eq('id', id);
  await logEvent({ action: 'funnel.restored', actorId: actor.id, entityType: 'funnel', entityId: id, oldStatus: 'archived', newStatus: 'new', metadata: {}, source: 'portal' });
  revalidate(id);
  return { ok: true };
}

// ── CRM link (existing) ────────────────────────────────────────────────────────

export async function linkFunnelToContact(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  const parsed = funnelLinkContactSchema.safeParse({ id: formData.get('id'), contactId: formData.get('contactId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: contact } = await admin.from('company_contacts').select('id, company_id').eq('id', parsed.data.contactId).maybeSingle();
  if (!contact) return { error: 'Selected contact not found.' };
  await admin.from('funnel_submissions').update({ contact_id: contact.id, company_id: contact.company_id, updated_by: actor.id }).eq('id', parsed.data.id);
  await logEvent({ action: 'funnel.linked_contact', actorId: actor.id, entityType: 'funnel', entityId: parsed.data.id, metadata: { contact_id: contact.id, company_id: contact.company_id }, source: 'portal' });
  revalidate(parsed.data.id, contact.company_id);
  return { ok: true };
}

export async function linkFunnelToCompany(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  const parsed = funnelLinkCompanySchema.safeParse({ id: formData.get('id'), companyId: formData.get('companyId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('id').eq('id', parsed.data.companyId).maybeSingle();
  if (!company) return { error: 'Selected company not found.' };
  await admin.from('funnel_submissions').update({ company_id: company.id, updated_by: actor.id }).eq('id', parsed.data.id);
  await logEvent({ action: 'funnel.linked_company', actorId: actor.id, entityType: 'funnel', entityId: parsed.data.id, metadata: { company_id: company.id }, source: 'portal' });
  revalidate(parsed.data.id, company.id);
  return { ok: true };
}

// ── CRM create (gated by CRM create permissions; fill-empty-only) ───────────────

export async function createCompanyFromFunnel(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  if (!(await hasPermission('companies.create'))) return { error: 'You do not have permission to create companies.' };
  const parsed = funnelIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid submission.' };

  const admin = createAdminClient();
  const row = await loadFunnel(admin, parsed.data.id);
  if (!row) return { error: 'Submission not found.' };
  if (row.company_id) return { error: 'This submission is already linked to a company.' };

  const companyName = row.company_name || row.normalized_domain || `${fullName(row.first_name, row.last_name) || row.email}`;
  const { data: company, error } = await admin
    .from('companies')
    .insert({ company_name: companyName, domain: row.normalized_domain ?? null, website_url: row.website_url ?? null, email: row.email, source: 'contact_form', crm_status: 'lead', owner_id: actor.id })
    .select('id')
    .single();
  if (error || !company) return { error: GENERIC };

  await admin.from('funnel_submissions').update({ company_id: company.id, updated_by: actor.id }).eq('id', row.id);
  await logEvent({ action: 'company.created', actorId: actor.id, entityType: 'company', entityId: company.id, metadata: { via: 'funnel' }, source: 'portal' });
  await logEvent({ action: 'funnel.created_company', actorId: actor.id, entityType: 'funnel', entityId: row.id, metadata: { company_id: company.id }, source: 'portal' });
  revalidate(row.id, company.id);
  return { ok: true };
}

export async function createContactFromFunnel(_prev: FunnelActionState, formData: FormData): Promise<FunnelActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('funnels.update'))) return { error: NOT_ALLOWED };
  if (!(await hasPermission('contacts.create'))) return { error: 'You do not have permission to create contacts.' };
  const parsed = funnelCreateContactSchema.safeParse({ id: formData.get('id'), companyId: formData.get('companyId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const row = await loadFunnel(admin, parsed.data.id);
  if (!row) return { error: 'Submission not found.' };
  const { data: company } = await admin.from('companies').select('id').eq('id', parsed.data.companyId).maybeSingle();
  if (!company) return { error: 'Selected company not found.' };

  const { data: contact, error } = await admin
    .from('company_contacts')
    .insert({ company_id: company.id, name: fullName(row.first_name, row.last_name) || null, email: row.email, phone: row.phone ?? null, contact_status: 'lead', created_by: actor.id, updated_by: actor.id })
    .select('id')
    .single();
  if (error || !contact) return { error: GENERIC };

  await admin.from('funnel_submissions').update({ contact_id: contact.id, company_id: company.id, updated_by: actor.id }).eq('id', row.id);
  await logEvent({ action: 'contact.created', actorId: actor.id, entityType: 'contact', entityId: contact.id, metadata: { via: 'funnel', company_id: company.id }, source: 'portal' });
  await logEvent({ action: 'funnel.created_contact', actorId: actor.id, entityType: 'funnel', entityId: row.id, metadata: { contact_id: contact.id, company_id: company.id }, source: 'portal' });
  revalidate(row.id, company.id);
  return { ok: true };
}
