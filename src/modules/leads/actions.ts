'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requirePermission } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listAssignableUsers } from './queries';
import { CRM_LINK_STATUSES, LEAD_CHANNELS, LEAD_STATUSES, type LeadChannel, type LeadFormState, type LeadStatus } from './types';

const statusSchema = z.enum(LEAD_STATUSES as unknown as [LeadStatus, ...LeadStatus[]]);
const channelSchema = z.enum(LEAD_CHANNELS as unknown as [LeadChannel, ...LeadChannel[]]);

// Free email providers are never used to dedup a company (they'd merge strangers).
const FREE_EMAIL = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.ch', 'outlook.com', 'live.com', 'msn.com',
  'yahoo.com', 'icloud.com', 'me.com', 'gmx.ch', 'gmx.net', 'gmx.de', 'bluewin.ch', 'hispeed.ch',
  'sunrise.ch', 'proton.me', 'protonmail.com',
]);

/**
 * Ensure a lead is mirrored into the CRM: link (or create + dedup) a Company by
 * business email domain / name, and a Contact by email. Idempotent — returns the
 * existing link if the lead already has one. Stores the ids back on the lead.
 */
async function ensureLeadCrm(leadId: string, actorId: string): Promise<{ companyId: string; contactId: string | null } | null> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: lead } = await admin
    .from('leads')
    .select('email, company, phone, firstname, lastname, company_id, contact_id')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return null;
  if (lead.company_id) return { companyId: lead.company_id, contactId: lead.contact_id ?? null };

  const leadName = [lead.firstname, lead.lastname].filter(Boolean).join(' ').trim();
  const emailDomain = lead.email?.split('@')[1]?.toLowerCase() || null;
  const bizDomain = emailDomain && !FREE_EMAIL.has(emailDomain) ? emailDomain : null;

  let companyId: string | null = null;
  if (bizDomain) {
    const { data } = await admin.from('companies').select('id').ilike('domain', bizDomain).limit(1).maybeSingle();
    if (data) companyId = data.id;
  }
  if (!companyId && lead.company) {
    const { data } = await admin.from('companies').select('id').ilike('company_name', lead.company).limit(1).maybeSingle();
    if (data) companyId = data.id;
  }
  if (!companyId) {
    const companyName = lead.company || leadName || lead.email || 'New company';
    const { data: comp } = await admin
      .from('companies')
      .insert({ company_name: companyName, domain: bizDomain, email: lead.email ?? null, phone: lead.phone ?? null, source: 'lead', crm_status: 'lead' })
      .select('id')
      .single();
    if (!comp) return null;
    companyId = comp.id;
  }
  if (!companyId) return null;

  let contactId: string | null = null;
  if (lead.email) {
    const { data: exc } = await admin
      .from('company_contacts')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', lead.email)
      .maybeSingle();
    contactId = exc?.id ?? null;
    if (!contactId) {
      const { data: ct } = await admin
        .from('company_contacts')
        .insert({ company_id: companyId, name: leadName || lead.email, email: lead.email, phone: lead.phone ?? null, is_primary: false, created_by: actorId })
        .select('id')
        .single();
      contactId = ct?.id ?? null;
    }
  }

  await admin.from('leads').update({ company_id: companyId, contact_id: contactId }).eq('id', leadId);
  return { companyId, contactId };
}

/**
 * Set a lead's follow-up status (new, read, archived, spam). Permission-gated
 * (leads.manage), zod-validated, written via the service role, then audited.
 */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');

  const parsed = statusSchema.safeParse(status);
  if (!id || !parsed.success) throw new Error('Invalid lead status.');

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('leads')
    .select('status, firstname, lastname, email')
    .eq('id', id)
    .maybeSingle();
  if (!before) throw new Error('Lead not found.');

  if (before.status !== parsed.data) {
    const { error } = await admin.from('leads').update({ status: parsed.data }).eq('id', id);
    if (error) throw new Error('Could not update the lead.');

    const name = `${before.firstname} ${before.lastname}`.trim() || before.email;
    await logEvent({
      action: 'lead.status_changed',
      actorId: actor.id,
      entityType: 'lead',
      entityId: id,
      entityDisplayName: name,
      oldStatus: before.status,
      newStatus: parsed.data,
      source: 'portal',
    });
  }

  // From Contacting onward, mirror the lead into the CRM (company + contact).
  if (CRM_LINK_STATUSES.includes(parsed.data)) {
    await ensureLeadCrm(id, actor.id);
  }

  revalidatePath('/app/leads');
  return { ok: true };
}

/**
 * Set a lead's channel (how it came in / is worked). Permission-gated
 * (leads.manage), zod-validated, written via the service role, then audited.
 */
export async function updateLeadChannel(id: string, channel: LeadChannel): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');

  const parsed = channelSchema.safeParse(channel);
  if (!id || !parsed.success) throw new Error('Invalid lead channel.');

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('leads')
    .select('channel, firstname, lastname, email')
    .eq('id', id)
    .maybeSingle();
  if (!before) throw new Error('Lead not found.');

  if (before.channel !== parsed.data) {
    const { error } = await admin.from('leads').update({ channel: parsed.data }).eq('id', id);
    if (error) throw new Error('Could not update the lead.');

    const name = `${before.firstname} ${before.lastname}`.trim() || before.email;
    await logEvent({
      action: 'lead.channel_changed',
      actorId: actor.id,
      entityType: 'lead',
      entityId: id,
      entityDisplayName: name,
      metadata: { from: before.channel, to: parsed.data },
      source: 'portal',
    });
  }

  revalidatePath('/app/leads');
  return { ok: true };
}

/**
 * Win a lead: mark it Won and spin up the CRM records the deal needs — a Company
 * (reused by email if it already exists), a primary Contact, and a Project with the
 * given name. Guarded by leads.manage + projects.create, audited, then opens the
 * new project. On any problem it redirects back with ?error=<code>.
 */
export async function winLead(formData: FormData): Promise<void> {
  const leadId = String(formData.get('leadId') ?? '');
  const projectName = String(formData.get('projectName') ?? '').trim();
  if (!leadId) redirect('/app/leads');
  const back = `/app/leads/${leadId}`;

  const actor = await requireAuth();
  if (!(await hasPermission('leads.manage')) || !(await hasPermission('projects.create'))) {
    redirect(`${back}?error=permission`);
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from('leads')
    .select('firstname, lastname, email, company, phone')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) redirect('/app/leads');

  const leadName = [lead.firstname, lead.lastname].filter(Boolean).join(' ').trim();
  const projName = projectName || lead.company || leadName || 'New project';

  // Link (or create + dedup) the company + contact, then mark the company active.
  const crm = await ensureLeadCrm(leadId, actor.id);
  if (!crm) redirect(`${back}?error=company`);
  const { companyId, contactId } = crm;
  await admin.from('companies').update({ crm_status: 'active' }).eq('id', companyId);

  // Project.
  const { data: proj } = await admin
    .from('projects')
    .insert({ name: projName, company_id: companyId, primary_contact_id: contactId, status: 'draft', created_by: actor.id, updated_by: actor.id })
    .select('id')
    .single();
  if (!proj) redirect(`${back}?error=project`);

  await admin.from('leads').update({ status: 'won' }).eq('id', leadId);
  await logEvent({
    action: 'lead.won',
    actorId: actor.id,
    entityType: 'lead',
    entityId: leadId,
    entityDisplayName: leadName || lead.email,
    newStatus: 'won',
    metadata: { company_id: companyId, contact_id: contactId, project_id: proj.id },
    source: 'portal',
  });

  revalidatePath('/app/leads');
  revalidatePath('/app/projects');
  redirect(`/app/projects/${proj.id}`);
}

/** Create a lead manually from the portal, then open it. */
export async function createLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');

  const firstname = String(formData.get('firstname') ?? '').trim();
  const lastname = String(formData.get('lastname') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const company = String(formData.get('company') ?? '').trim() || null;
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const message = String(formData.get('message') ?? '').trim() || null;
  const channelIn = String(formData.get('channel') ?? 'contact_form');
  const statusIn = String(formData.get('status') ?? 'new');
  const assignedIn = String(formData.get('assigned_to') ?? '').trim() || null;

  if (!email || !email.includes('@')) return { error: 'A valid email is required.' };
  if (!lastname && !firstname && !company) return { error: 'Enter a name or a company.' };

  const channel = (LEAD_CHANNELS as ReadonlyArray<string>).includes(channelIn) ? (channelIn as LeadChannel) : 'contact_form';
  const status = (LEAD_STATUSES as ReadonlyArray<string>).includes(statusIn) ? (statusIn as LeadStatus) : 'new';
  let assigned_to: string | null = null;
  if (assignedIn) {
    const allowed = await listAssignableUsers();
    assigned_to = allowed.some((u) => u.id === assignedIn) ? assignedIn : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('leads')
    .insert({
      form_type: 'contact',
      firstname,
      lastname: lastname || company || email,
      email,
      company,
      phone,
      message,
      lang: 'de',
      consent: false,
      channel,
      status,
      assigned_to,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'Could not create the lead.' };

  await logEvent({
    action: 'lead.created',
    actorId: actor.id,
    entityType: 'lead',
    entityId: data.id,
    entityDisplayName: `${firstname} ${lastname}`.trim() || company || email,
    source: 'portal',
  });

  revalidatePath('/app/leads');
  redirect(`/app/leads/${data.id}`);
}

/** Assign (or unassign) a lead to a portal user with the admin/sales role. */
export async function updateLeadAssignee(leadId: string, userId: string | null): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  if (!leadId) throw new Error('Invalid lead.');

  const assignee = userId && userId.trim() ? userId.trim() : null;
  if (assignee) {
    const allowed = await listAssignableUsers();
    if (!allowed.some((u) => u.id === assignee)) throw new Error('That user cannot be assigned leads.');
  }

  const admin = createAdminClient();
  const { error } = await admin.from('leads').update({ assigned_to: assignee }).eq('id', leadId);
  if (error) throw new Error('Could not assign the lead.');

  await logEvent({
    action: assignee ? 'lead.assigned' : 'lead.unassigned',
    actorId: actor.id,
    entityType: 'lead',
    entityId: leadId,
    metadata: { assigned_to: assignee },
    source: 'portal',
  });

  revalidatePath('/app/leads');
  revalidatePath(`/app/leads/${leadId}`);
  return { ok: true };
}

/** Save the internal note on a lead. Permission-gated (leads.manage). */
export async function updateLeadNotes(id: string, notes: string): Promise<{ ok: true }> {
  await requireAuth();
  await requirePermission('leads.manage');
  if (!id) throw new Error('Invalid lead.');

  const clean = notes.slice(0, 5000);
  const admin = createAdminClient();
  const { error } = await admin.from('leads').update({ notes: clean || null }).eq('id', id);
  if (error) throw new Error('Could not save the note.');

  revalidatePath(`/app/leads/${id}`);
  revalidatePath('/app/leads');
  return { ok: true };
}

/** Mark a lead Lost with a required reason. Permission-gated (leads.manage), audited. */
export async function loseLead(leadId: string, reason: string): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  const clean = reason.trim().slice(0, 500);
  if (!leadId || !clean) throw new Error('A reason is required.');

  const admin = createAdminClient();
  const { data: before } = await admin.from('leads').select('status, firstname, lastname, email').eq('id', leadId).maybeSingle();
  if (!before) throw new Error('Lead not found.');

  const { error } = await admin.from('leads').update({ status: 'lost', lost_reason: clean }).eq('id', leadId);
  if (error) throw new Error('Could not update the lead.');

  const name = `${before.firstname} ${before.lastname}`.trim() || before.email;
  await logEvent({
    action: 'lead.lost',
    actorId: actor.id,
    entityType: 'lead',
    entityId: leadId,
    entityDisplayName: name,
    oldStatus: before.status,
    newStatus: 'lost',
    metadata: { reason: clean },
    source: 'portal',
  });

  revalidatePath('/app/leads');
  revalidatePath(`/app/leads/${leadId}`);
  return { ok: true };
}

/**
 * Permanently delete a lead. Destructive: guarded by leads.manage, audited with
 * the deleted lead's name so the removal is traceable.
 */
export async function deleteLead(id: string): Promise<{ ok: true }> {
  const actor = await requireAuth();
  await requirePermission('leads.manage');
  if (!id) throw new Error('Invalid lead.');

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('leads')
    .select('firstname, lastname, email')
    .eq('id', id)
    .maybeSingle();
  if (!before) throw new Error('Lead not found.');

  const { error } = await admin.from('leads').delete().eq('id', id);
  if (error) throw new Error('Could not delete the lead.');

  const name = `${before.firstname} ${before.lastname}`.trim() || before.email;
  await logEvent({
    action: 'lead.deleted',
    actorId: actor.id,
    entityType: 'lead',
    entityId: id,
    entityDisplayName: name,
    severity: 'warning',
    source: 'portal',
  });

  revalidatePath('/app/leads');
  return { ok: true };
}
