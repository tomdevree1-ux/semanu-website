'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { companyCreateSchema, companyUpdateSchema, companyStatusChangeSchema, type CompanyActionState } from './schema';
import { isLegalCompanyTransition, confirmMatches } from './guards';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';

function readCompanyInput(fd: FormData) {
  return {
    companyName: fd.get('companyName'),
    domain: fd.get('domain'),
    websiteUrl: fd.get('websiteUrl'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    city: fd.get('city'),
    canton: fd.get('canton'),
    country: fd.get('country'),
    language: fd.get('language'),
    industry: fd.get('industry'),
    notes: fd.get('notes'),
  };
}

type CompanyFields = {
  companyName: string;
  domain?: string | null;
  websiteUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  canton?: string | null;
  country: string;
  language?: string | null;
  industry?: string | null;
  notes?: string | null;
};

function toRow(input: CompanyFields) {
  return {
    company_name: input.companyName,
    domain: input.domain ?? null,
    website_url: input.websiteUrl ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    city: input.city ?? null,
    canton: input.canton ?? null,
    country: input.country,
    language_pref: input.language ?? null,
    industry: input.industry ?? null,
    notes: input.notes ?? null,
  };
}

/** Create a manual CRM company. Redirects to its detail page on success. */
export async function createCompany(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('companies.create'))) return { error: NOT_ALLOWED };

  const parsed = companyCreateSchema.safeParse(readCompanyInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  // Manual CRM companies must NOT look like freshly imported prospects to the
  // external outreach pipeline (P5 audit Issue #1). Pin a safe, non-send
  // `lead_status`; set `crm_status` explicitly (matches the DB default) for
  // clarity. `lead_status` is written ONLY here — never by update/status/
  // archive/restore — so existing imported/prospecting rows are untouched.
  const { data, error } = await admin
    .from('companies')
    .insert({
      ...toRow(parsed.data),
      source: 'manual',
      crm_status: 'lead',
      lead_status: 'waiting_for_review',
    })
    .select('id')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'company.created',
    actorId: actor.id,
    entityType: 'company',
    entityId: data.id,
    entityDisplayName: parsed.data.companyName,
    newStatus: 'lead',
    source: 'portal',
  });

  revalidatePath('/app/companies');
  redirect(`/app/companies/${data.id}`);
}

/** Edit a company's info (EditableBlock). Status/archive are separate actions. */
export async function updateCompany(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('companies.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('companyId') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = companyUpdateSchema.safeParse({ ...readCompanyInput(formData), ownerId: formData.get('ownerId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('companies')
    .select('company_name,domain,website_url,email,phone,city,canton,country,language_pref,industry,notes,owner_id')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Company not found.' };

  const next = { ...toRow(parsed.data), owner_id: parsed.data.ownerId ?? null };
  const { error } = await admin.from('companies').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  // Changed-field NAMES only in ordinary metadata (no raw values); full before/after
  // goes to old_values/new_values (technical-only, audit.read_technical).
  const changed = Object.keys(next).filter(
    (k) => (before as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k],
  );
  await logEvent({
    action: 'company.updated',
    actorId: actor.id,
    entityType: 'company',
    entityId: id,
    entityDisplayName: parsed.data.companyName,
    metadata: { fields: changed },
    oldValues: before,
    newValues: next,
    source: 'portal',
  });

  revalidatePath(`/app/companies/${id}`);
  revalidatePath('/app/companies');
  return { ok: true };
}

/** Change a company's CRM lifecycle status (machine-validated). */
export async function changeCompanyStatus(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('companies.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('companyId') ?? '');
  const parsed = companyStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status;

  const admin = createAdminClient();
  const { data: c } = await admin.from('companies').select('crm_status, company_name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Company not found.' };
  if (c.archived_at) return { error: 'Restore this company before changing its status.' };
  if (c.crm_status === to) return { ok: true };
  if (!isLegalCompanyTransition(c.crm_status, to)) return { error: 'That status change is not allowed.' };

  const { error } = await admin.from('companies').update({ crm_status: to }).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'company.status_changed',
    actorId: actor.id,
    entityType: 'company',
    entityId: id,
    entityDisplayName: c.company_name,
    oldStatus: c.crm_status,
    newStatus: to,
    source: 'portal',
  });

  revalidatePath(`/app/companies/${id}`);
  revalidatePath('/app/companies');
  return { ok: true };
}

/** Archive a company (soft, reversible). Type-to-confirm the company name. No hard delete; contacts are NOT auto-archived. */
export async function archiveCompany(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('companies.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('companyId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin.from('companies').select('crm_status, company_name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Company not found.' };
  if (c.archived_at) return { ok: true };
  if (!confirmMatches(typed, c.company_name)) return { error: 'The name you typed does not match.' };

  const { error } = await admin
    .from('companies')
    .update({ crm_status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'company.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'company',
    entityId: id,
    entityDisplayName: c.company_name,
    oldStatus: c.crm_status,
    newStatus: 'archived',
    source: 'portal',
  });

  revalidatePath(`/app/companies/${id}`);
  revalidatePath('/app/companies');
  return { ok: true };
}

/** Restore an archived company to `lead`. */
export async function restoreCompany(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('companies.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('companyId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin.from('companies').select('company_name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Company not found.' };
  if (!c.archived_at) return { error: 'This company is not archived.' };

  const { error } = await admin
    .from('companies')
    .update({ crm_status: 'lead', archived_at: null, archived_by: null })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'company.restored',
    actorId: actor.id,
    entityType: 'company',
    entityId: id,
    entityDisplayName: c.company_name,
    oldStatus: 'archived',
    newStatus: 'lead',
    source: 'portal',
  });

  revalidatePath(`/app/companies/${id}`);
  revalidatePath('/app/companies');
  return { ok: true };
}
