'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { projectCreateSchema, projectUpdateSchema, projectStatusChangeSchema, type ProjectActionState } from './schema';
import { isLegalProjectTransition, confirmMatches, contactBelongsToCompany } from './guards';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';

type Admin = ReturnType<typeof createAdminClient>;

function readProjectFields(fd: FormData) {
  return {
    name: fd.get('name'),
    description: fd.get('description'),
    primaryContactId: fd.get('primaryContactId'),
    ownerId: fd.get('ownerId'),
    startDate: fd.get('startDate'),
    dueDate: fd.get('dueDate'),
  };
}

/** Validate that an optional contact exists, is non-archived, and belongs to the company. */
async function validateContact(
  admin: Admin,
  contactId: string | null | undefined,
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!contactId) return { ok: true };
  const { data: ct } = await admin
    .from('company_contacts')
    .select('company_id, archived_at')
    .eq('id', contactId)
    .maybeSingle();
  if (!ct) return { ok: false, error: 'The selected contact was not found.' };
  if (ct.archived_at) return { ok: false, error: 'You cannot link an archived contact.' };
  if (!contactBelongsToCompany(ct.company_id, companyId)) {
    return { ok: false, error: 'The contact does not belong to this company.' };
  }
  return { ok: true };
}

/** Create a project under an existing (non-archived) company. Redirects on success. */
export async function createProject(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('projects.create'))) return { error: NOT_ALLOWED };

  const parsed = projectCreateSchema.safeParse({ companyId: formData.get('companyId'), ...readProjectFields(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: company } = await admin
    .from('companies')
    .select('id, archived_at')
    .eq('id', input.companyId)
    .maybeSingle();
  if (!company) return { error: 'Company not found.' };
  if (company.archived_at) return { error: 'You cannot create a project for an archived company.' };

  const contactCheck = await validateContact(admin, input.primaryContactId, input.companyId);
  if (!contactCheck.ok) return { error: contactCheck.error };

  const { data, error } = await admin
    .from('projects')
    .insert({
      name: input.name,
      description: input.description ?? null,
      company_id: input.companyId,
      primary_contact_id: input.primaryContactId ?? null,
      owner_id: input.ownerId ?? null,
      status: 'draft',
      start_date: input.startDate ?? null,
      due_date: input.dueDate ?? null,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'project.created',
    actorId: actor.id,
    entityType: 'project',
    entityId: data.id,
    entityDisplayName: input.name,
    newStatus: 'draft',
    metadata: { company_id: input.companyId },
    source: 'portal',
  });

  revalidatePath('/app/projects');
  revalidatePath(`/app/companies/${input.companyId}`);
  redirect(`/app/projects/${data.id}`);
}

/** Edit a project's info (EditableBlock). company_id is not editable (P6-D9). */
export async function updateProject(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('projects.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('projectId') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = projectUpdateSchema.safeParse(readProjectFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('projects')
    .select('name,description,primary_contact_id,owner_id,start_date,due_date,company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Project not found.' };

  const contactCheck = await validateContact(admin, input.primaryContactId, before.company_id);
  if (!contactCheck.ok) return { error: contactCheck.error };

  const next = {
    name: input.name,
    description: input.description ?? null,
    primary_contact_id: input.primaryContactId ?? null,
    owner_id: input.ownerId ?? null,
    start_date: input.startDate ?? null,
    due_date: input.dueDate ?? null,
    updated_by: actor.id,
  };
  const { error } = await admin.from('projects').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const compare = {
    name: next.name,
    description: next.description,
    primary_contact_id: next.primary_contact_id,
    owner_id: next.owner_id,
    start_date: next.start_date,
    due_date: next.due_date,
  };
  const changed = Object.keys(compare).filter(
    (k) => (before as Record<string, unknown>)[k] !== (compare as Record<string, unknown>)[k],
  );
  await logEvent({
    action: 'project.updated',
    actorId: actor.id,
    entityType: 'project',
    entityId: id,
    entityDisplayName: input.name,
    metadata: { fields: changed, company_id: before.company_id },
    oldValues: {
      name: before.name,
      description: before.description,
      primary_contact_id: before.primary_contact_id,
      owner_id: before.owner_id,
      start_date: before.start_date,
      due_date: before.due_date,
    },
    newValues: compare,
    source: 'portal',
  });

  revalidatePath(`/app/projects/${id}`);
  revalidatePath('/app/projects');
  revalidatePath(`/app/companies/${before.company_id}`);
  return { ok: true };
}

/** Change a project's lifecycle status (machine-validated). */
export async function changeProjectStatus(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('projects.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('projectId') ?? '');
  const parsed = projectStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status;

  const admin = createAdminClient();
  const { data: p } = await admin
    .from('projects')
    .select('status, name, company_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!p) return { error: 'Project not found.' };
  if (p.archived_at) return { error: 'Restore this project before changing its status.' };
  if (p.status === to) return { ok: true };
  if (!isLegalProjectTransition(p.status, to)) return { error: 'That status change is not allowed.' };

  const { error } = await admin.from('projects').update({ status: to, updated_by: actor.id }).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'project.status_changed',
    actorId: actor.id,
    entityType: 'project',
    entityId: id,
    entityDisplayName: p.name,
    oldStatus: p.status,
    newStatus: to,
    metadata: { company_id: p.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/projects/${id}`);
  revalidatePath('/app/projects');
  return { ok: true };
}

/** Archive a project (soft, reversible). Type-to-confirm the project name. No hard delete. */
export async function archiveProject(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('projects.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('projectId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: p } = await admin.from('projects').select('status, name, company_id, archived_at').eq('id', id).maybeSingle();
  if (!p) return { error: 'Project not found.' };
  if (p.archived_at) return { ok: true };
  if (!confirmMatches(typed, p.name)) return { error: 'The name you typed does not match.' };

  const { error } = await admin
    .from('projects')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'project.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'project',
    entityId: id,
    entityDisplayName: p.name,
    oldStatus: p.status,
    newStatus: 'archived',
    metadata: { company_id: p.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/projects/${id}`);
  revalidatePath('/app/projects');
  revalidatePath(`/app/companies/${p.company_id}`);
  return { ok: true };
}

/** Restore an archived project to `draft`. */
export async function restoreProject(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('projects.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('projectId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: p } = await admin.from('projects').select('name, company_id, archived_at').eq('id', id).maybeSingle();
  if (!p) return { error: 'Project not found.' };
  if (!p.archived_at) return { error: 'This project is not archived.' };

  const { error } = await admin
    .from('projects')
    .update({ status: 'draft', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'project.restored',
    actorId: actor.id,
    entityType: 'project',
    entityId: id,
    entityDisplayName: p.name,
    oldStatus: 'archived',
    newStatus: 'draft',
    metadata: { company_id: p.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/projects/${id}`);
  revalidatePath('/app/projects');
  revalidatePath(`/app/companies/${p.company_id}`);
  return { ok: true };
}
