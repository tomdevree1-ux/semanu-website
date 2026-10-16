'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { contactCreateSchema, contactUpdateSchema, contactStatusChangeSchema, type ContactActionState } from './schema';
import { isLegalContactTransition, confirmMatches } from './guards';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';

function readContactFields(fd: FormData) {
  return {
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    role: fd.get('role'),
    isPrimary: fd.get('isPrimary'),
  };
}

/** Create a contact under an existing (non-archived) company. Redirects on success. */
export async function createContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('contacts.create'))) return { error: NOT_ALLOWED };

  const parsed = contactCreateSchema.safeParse({ companyId: formData.get('companyId'), ...readContactFields(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: company } = await admin
    .from('companies')
    .select('id, company_name, archived_at')
    .eq('id', input.companyId)
    .maybeSingle();
  if (!company) return { error: 'Company not found.' };
  if (company.archived_at) return { error: 'You cannot add a contact to an archived company.' };

  const { data, error } = await admin
    .from('company_contacts')
    .insert({
      company_id: input.companyId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      role: input.role ?? null,
      is_primary: input.isPrimary,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'contact.created',
    actorId: actor.id,
    entityType: 'contact',
    entityId: data.id,
    entityDisplayName: input.name,
    newStatus: 'lead',
    metadata: { company_id: company.id, company_name: company.company_name },
    source: 'portal',
  });

  revalidatePath('/app/contacts');
  revalidatePath(`/app/companies/${company.id}`);
  redirect(`/app/contacts/${data.id}`);
}

/** Edit a contact's info (EditableBlock). Company link is fixed in P5. */
export async function updateContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('contacts.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('contactId') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = contactUpdateSchema.safeParse(readContactFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('company_contacts')
    .select('name,email,phone,role,is_primary,company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Contact not found.' };

  const next = {
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    role: parsed.data.role ?? null,
    is_primary: parsed.data.isPrimary,
    updated_by: actor.id,
  };
  const { error } = await admin.from('company_contacts').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const compare = { name: next.name, email: next.email, phone: next.phone, role: next.role, is_primary: next.is_primary };
  const changed = Object.keys(compare).filter(
    (k) => (before as Record<string, unknown>)[k] !== (compare as Record<string, unknown>)[k],
  );
  await logEvent({
    action: 'contact.updated',
    actorId: actor.id,
    entityType: 'contact',
    entityId: id,
    entityDisplayName: parsed.data.name,
    metadata: { fields: changed, company_id: before.company_id },
    oldValues: { name: before.name, email: before.email, phone: before.phone, role: before.role, is_primary: before.is_primary },
    newValues: compare,
    source: 'portal',
  });

  revalidatePath(`/app/contacts/${id}`);
  revalidatePath('/app/contacts');
  revalidatePath(`/app/companies/${before.company_id}`);
  return { ok: true };
}

/** Change a contact's CRM lifecycle status (machine-validated). */
export async function changeContactStatus(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('contacts.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('contactId') ?? '');
  const parsed = contactStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status;

  const admin = createAdminClient();
  const { data: c } = await admin
    .from('company_contacts')
    .select('contact_status, name, company_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!c) return { error: 'Contact not found.' };
  if (c.archived_at) return { error: 'Restore this contact before changing its status.' };
  if (c.contact_status === to) return { ok: true };
  if (!isLegalContactTransition(c.contact_status, to)) return { error: 'That status change is not allowed.' };

  const { error } = await admin.from('company_contacts').update({ contact_status: to, updated_by: actor.id }).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'contact.status_changed',
    actorId: actor.id,
    entityType: 'contact',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: c.contact_status,
    newStatus: to,
    metadata: { company_id: c.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/contacts/${id}`);
  revalidatePath('/app/contacts');
  return { ok: true };
}

/** Archive a contact (soft, reversible). Type-to-confirm the contact name. No hard delete. */
export async function archiveContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('contacts.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('contactId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin
    .from('company_contacts')
    .select('contact_status, name, email, company_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!c) return { error: 'Contact not found.' };
  if (c.archived_at) return { ok: true };
  const expected = c.name || c.email || '';
  if (!confirmMatches(typed, expected)) return { error: 'The name you typed does not match.' };

  const { error } = await admin
    .from('company_contacts')
    .update({ contact_status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'contact.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'contact',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: c.contact_status,
    newStatus: 'archived',
    metadata: { company_id: c.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/contacts/${id}`);
  revalidatePath('/app/contacts');
  revalidatePath(`/app/companies/${c.company_id}`);
  return { ok: true };
}

/** Restore an archived contact to `lead`. */
export async function restoreContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('contacts.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('contactId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin
    .from('company_contacts')
    .select('name, company_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!c) return { error: 'Contact not found.' };
  if (!c.archived_at) return { error: 'This contact is not archived.' };

  const { error } = await admin
    .from('company_contacts')
    .update({ contact_status: 'lead', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'contact.restored',
    actorId: actor.id,
    entityType: 'contact',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: 'archived',
    newStatus: 'lead',
    metadata: { company_id: c.company_id },
    source: 'portal',
  });

  revalidatePath(`/app/contacts/${id}`);
  revalidatePath('/app/contacts');
  revalidatePath(`/app/companies/${c.company_id}`);
  return { ok: true };
}
