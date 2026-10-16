'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import {
  quoteCreateSchema,
  quoteUpdateSchema,
  quoteStatusChangeSchema,
  quoteItemCreateSchema,
  quoteItemUpdateSchema,
  type QuoteActionState,
} from './schema';
import { permissionForStatus, type QuoteStatus } from './status';
import {
  isLegalQuoteTransition,
  confirmMatches,
  contactBelongsToCompany,
  projectBelongsToCompany,
} from './guards';
import { computeLine, computeQuoteTotals } from './totals';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';

type Admin = ReturnType<typeof createAdminClient>;
type Ok = { ok: true };
type Err = { ok: false; error: string };

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** Recompute and persist a quote's subtotal + total from its lines (P8-D5). */
async function recalcTotals(admin: Admin, quoteId: string): Promise<void> {
  const { data: q } = await admin.from('quotes').select('discount_amount, tax_amount').eq('id', quoteId).maybeSingle();
  if (!q) return;
  const { data: items } = await admin.from('quote_items').select('line_total').eq('quote_id', quoteId);
  const lines = (items ?? []).map((i) => ({ lineTotal: num(i.line_total) }));
  const { subtotal, total } = computeQuoteTotals(lines, num(q.discount_amount), num(q.tax_amount));
  await admin.from('quotes').update({ subtotal, total_amount: total }).eq('id', quoteId);
}

async function validateContact(admin: Admin, contactId: string | null | undefined, companyId: string): Promise<Ok | Err> {
  if (!contactId) return { ok: true };
  const { data: ct } = await admin.from('company_contacts').select('company_id, archived_at').eq('id', contactId).maybeSingle();
  if (!ct) return { ok: false, error: 'The selected contact was not found.' };
  if (ct.archived_at) return { ok: false, error: 'You cannot link an archived contact.' };
  if (!contactBelongsToCompany(ct.company_id, companyId)) return { ok: false, error: 'The contact does not belong to this company.' };
  return { ok: true };
}

async function validateProject(admin: Admin, projectId: string | null | undefined, companyId: string): Promise<Ok | Err> {
  if (!projectId) return { ok: true };
  const { data: pj } = await admin.from('projects').select('company_id, archived_at').eq('id', projectId).maybeSingle();
  if (!pj) return { ok: false, error: 'The selected project was not found.' };
  if (pj.archived_at) return { ok: false, error: 'You cannot link an archived project.' };
  if (!projectBelongsToCompany(pj.company_id, companyId)) return { ok: false, error: 'The project does not belong to this company.' };
  return { ok: true };
}

/** Load a non-archived quote (the gate for all line-item edits). */
async function requireEditableQuote(admin: Admin, quoteId: string): Promise<{ ok: true; quote: { id: string; archived_at: string | null } } | Err> {
  if (!quoteId) return { ok: false, error: GENERIC };
  const { data: q } = await admin.from('quotes').select('id, archived_at').eq('id', quoteId).maybeSingle();
  if (!q) return { ok: false, error: 'Quote not found.' };
  if (q.archived_at) return { ok: false, error: 'Restore this quote before editing it.' };
  return { ok: true, quote: q };
}

// ── quotes ───────────────────────────────────────────────────────────────────

export async function createQuote(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.create'))) return { error: NOT_ALLOWED };

  const parsed = quoteCreateSchema.safeParse({
    title: formData.get('title'),
    companyId: formData.get('companyId'),
    contactId: formData.get('contactId'),
    projectId: formData.get('projectId'),
    validUntil: formData.get('validUntil'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('id, archived_at').eq('id', input.companyId).maybeSingle();
  if (!company) return { error: 'Company not found.' };
  if (company.archived_at) return { error: 'You cannot create a quote for an archived company.' };

  const c = await validateContact(admin, input.contactId, input.companyId);
  if (!c.ok) return { error: c.error };
  const p = await validateProject(admin, input.projectId, input.companyId);
  if (!p.ok) return { error: p.error };

  const { data, error } = await admin
    .from('quotes')
    .insert({
      title: input.title,
      company_id: input.companyId,
      contact_id: input.contactId ?? null,
      project_id: input.projectId ?? null,
      valid_until: input.validUntil ?? null,
      status: 'draft',
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id, quote_number')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'quote.created',
    actorId: actor.id,
    entityType: 'quote',
    entityId: data.id,
    entityDisplayName: data.quote_number,
    newStatus: 'draft',
    metadata: { quote_number: data.quote_number, company_id: input.companyId },
    source: 'portal',
  });

  revalidatePath('/app/quotes');
  redirect(`/app/quotes/${data.id}`);
}

export async function updateQuote(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('quoteId') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = quoteUpdateSchema.safeParse({
    title: formData.get('title'),
    contactId: formData.get('contactId'),
    projectId: formData.get('projectId'),
    validUntil: formData.get('validUntil'),
    notes: formData.get('notes'),
    internalNotes: formData.get('internalNotes'),
    discountAmount: formData.get('discountAmount'),
    taxAmount: formData.get('taxAmount'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('quotes')
    .select('company_id,title,contact_id,project_id,valid_until,notes,internal_notes,discount_amount,tax_amount,archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Quote not found.' };
  if (before.archived_at) return { error: 'Restore this quote before editing it.' };

  const c = await validateContact(admin, input.contactId, before.company_id);
  if (!c.ok) return { error: c.error };
  const p = await validateProject(admin, input.projectId, before.company_id);
  if (!p.ok) return { error: p.error };

  const next = {
    title: input.title,
    contact_id: input.contactId ?? null,
    project_id: input.projectId ?? null,
    valid_until: input.validUntil ?? null,
    notes: input.notes ?? null,
    internal_notes: input.internalNotes ?? null,
    discount_amount: input.discountAmount,
    tax_amount: input.taxAmount,
    updated_by: actor.id,
  };
  const { error } = await admin.from('quotes').update(next).eq('id', id);
  if (error) return { error: GENERIC };
  await recalcTotals(admin, id);

  // Changed field NAMES only in ordinary metadata (no money values). Full before/after
  // (incl. money) goes to old_values/new_values (technical-only, audit.read_technical).
  const beforeNorm = { ...before, discount_amount: num(before.discount_amount), tax_amount: num(before.tax_amount) };
  const compareKeys = ['title', 'contact_id', 'project_id', 'valid_until', 'notes', 'internal_notes', 'discount_amount', 'tax_amount'] as const;
  const changed = compareKeys.filter((k) => (beforeNorm as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({
    action: 'quote.updated',
    actorId: actor.id,
    entityType: 'quote',
    entityId: id,
    metadata: { fields: changed },
    oldValues: beforeNorm,
    newValues: next,
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${id}`);
  revalidatePath('/app/quotes');
  return { ok: true };
}

export async function changeQuoteStatus(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('quoteId') ?? '');
  const parsed = quoteStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status as QuoteStatus;

  const needed = permissionForStatus(to);
  if (needed !== 'quotes.update' && !(await hasPermission(needed))) return { error: NOT_ALLOWED };

  const admin = createAdminClient();
  const { data: q } = await admin.from('quotes').select('status, quote_number, archived_at').eq('id', id).maybeSingle();
  if (!q) return { error: 'Quote not found.' };
  if (q.archived_at) return { error: 'Restore this quote before changing its status.' };
  if (q.status === to) return { ok: true };
  if (!isLegalQuoteTransition(q.status, to)) return { error: 'That status change is not allowed.' };

  const { error } = await admin.from('quotes').update({ status: to, updated_by: actor.id }).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'quote.status_changed',
    actorId: actor.id,
    entityType: 'quote',
    entityId: id,
    entityDisplayName: q.quote_number,
    oldStatus: q.status,
    newStatus: to,
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${id}`);
  revalidatePath('/app/quotes');
  return { ok: true };
}

export async function archiveQuote(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('quoteId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: q } = await admin.from('quotes').select('status, quote_number, archived_at').eq('id', id).maybeSingle();
  if (!q) return { error: 'Quote not found.' };
  if (q.archived_at) return { ok: true };
  if (!confirmMatches(typed, q.quote_number)) return { error: 'The number you typed does not match.' };

  const { error } = await admin
    .from('quotes')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'quote.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'quote',
    entityId: id,
    entityDisplayName: q.quote_number,
    oldStatus: q.status,
    newStatus: 'archived',
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${id}`);
  revalidatePath('/app/quotes');
  return { ok: true };
}

export async function restoreQuote(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('quoteId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: q } = await admin.from('quotes').select('quote_number, archived_at').eq('id', id).maybeSingle();
  if (!q) return { error: 'Quote not found.' };
  if (!q.archived_at) return { error: 'This quote is not archived.' };

  const { error } = await admin
    .from('quotes')
    .update({ status: 'draft', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'quote.restored',
    actorId: actor.id,
    entityType: 'quote',
    entityId: id,
    entityDisplayName: q.quote_number,
    oldStatus: 'archived',
    newStatus: 'draft',
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${id}`);
  revalidatePath('/app/quotes');
  return { ok: true };
}

// ── line items ─────────────────────────────────────────────────────────────

export async function addQuoteItem(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const quoteId = String(formData.get('quoteId') ?? '');

  const admin = createAdminClient();
  const gate = await requireEditableQuote(admin, quoteId);
  if (!gate.ok) return { error: gate.error };

  const parsed = quoteItemCreateSchema.safeParse({
    catalogItemId: formData.get('catalogItemId'),
    name: formData.get('name'),
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    unitPrice: formData.get('unitPrice'),
    billingInterval: formData.get('billingInterval'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  // If a catalog item is linked, it must be active + non-archived (the line is snapshot-based).
  if (input.catalogItemId) {
    const { data: ci } = await admin.from('catalog_items').select('status, archived_at').eq('id', input.catalogItemId).maybeSingle();
    if (!ci || ci.archived_at || ci.status !== 'active') return { error: 'That catalog item is not available.' };
  }

  const { data: maxRow } = await admin
    .from('quote_items')
    .select('position')
    .eq('quote_id', quoteId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (maxRow?.position ?? 0) + 1;
  const { lineSubtotal, lineTotal } = computeLine(input.quantity, input.unitPrice);

  const { data, error } = await admin
    .from('quote_items')
    .insert({
      quote_id: quoteId,
      catalog_item_id: input.catalogItemId ?? null,
      position,
      name: input.name,
      description: input.description ?? null,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      billing_interval: input.billingInterval ?? null,
      line_subtotal: lineSubtotal,
      line_total: lineTotal,
    })
    .select('id')
    .single();
  if (error || !data) return { error: GENERIC };
  await recalcTotals(admin, quoteId);

  await logEvent({
    action: 'quote.item_added',
    actorId: actor.id,
    entityType: 'quote',
    entityId: quoteId,
    metadata: { item_id: data.id, position, name: input.name },
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${quoteId}`);
  return { ok: true };
}

export async function updateQuoteItem(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: item } = await admin.from('quote_items').select('quote_id').eq('id', itemId).maybeSingle();
  if (!item) return { error: 'Line item not found.' };
  const gate = await requireEditableQuote(admin, item.quote_id);
  if (!gate.ok) return { error: gate.error };

  const parsed = quoteItemUpdateSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    quantity: formData.get('quantity'),
    unitPrice: formData.get('unitPrice'),
    billingInterval: formData.get('billingInterval'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;
  const { lineSubtotal, lineTotal } = computeLine(input.quantity, input.unitPrice);

  const { error } = await admin
    .from('quote_items')
    .update({
      name: input.name,
      description: input.description ?? null,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      billing_interval: input.billingInterval ?? null,
      line_subtotal: lineSubtotal,
      line_total: lineTotal,
    })
    .eq('id', itemId);
  if (error) return { error: GENERIC };
  await recalcTotals(admin, item.quote_id);

  await logEvent({
    action: 'quote.item_updated',
    actorId: actor.id,
    entityType: 'quote',
    entityId: item.quote_id,
    metadata: { item_id: itemId, fields: ['name', 'description', 'quantity', 'unit_price', 'billing_interval'] },
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${item.quote_id}`);
  return { ok: true };
}

export async function removeQuoteItem(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: item } = await admin.from('quote_items').select('quote_id, name, position').eq('id', itemId).maybeSingle();
  if (!item) return { error: 'Line item not found.' };
  const gate = await requireEditableQuote(admin, item.quote_id);
  if (!gate.ok) return { error: gate.error };

  const { error } = await admin.from('quote_items').delete().eq('id', itemId);
  if (error) return { error: GENERIC };

  // Resequence remaining positions 1..n.
  const { data: rest } = await admin.from('quote_items').select('id').eq('quote_id', item.quote_id).order('position', { ascending: true });
  let pos = 1;
  for (const r of rest ?? []) {
    await admin.from('quote_items').update({ position: pos }).eq('id', r.id);
    pos += 1;
  }
  await recalcTotals(admin, item.quote_id);

  await logEvent({
    action: 'quote.item_removed',
    actorId: actor.id,
    entityType: 'quote',
    entityId: item.quote_id,
    metadata: { item_id: itemId, name: item.name, position: item.position },
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${item.quote_id}`);
  return { ok: true };
}

export async function reorderQuoteItems(_prev: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('quotes.update'))) return { error: NOT_ALLOWED };
  const quoteId = String(formData.get('quoteId') ?? '');

  let orderedIds: string[] = [];
  try {
    orderedIds = JSON.parse(String(formData.get('orderedIds') ?? '[]'));
  } catch {
    return { error: GENERIC };
  }
  if (!Array.isArray(orderedIds) || !orderedIds.length) return { error: GENERIC };

  const admin = createAdminClient();
  const gate = await requireEditableQuote(admin, quoteId);
  if (!gate.ok) return { error: gate.error };

  const { data: existing } = await admin.from('quote_items').select('id').eq('quote_id', quoteId);
  const owned = new Set((existing ?? []).map((r) => r.id));
  if (orderedIds.length !== owned.size || !orderedIds.every((iid) => owned.has(iid))) {
    return { error: 'Invalid reorder.' };
  }

  let pos = 1;
  for (const iid of orderedIds) {
    await admin.from('quote_items').update({ position: pos }).eq('id', iid);
    pos += 1;
  }

  await logEvent({
    action: 'quote.items_reordered',
    actorId: actor.id,
    entityType: 'quote',
    entityId: quoteId,
    metadata: { count: orderedIds.length },
    source: 'portal',
  });

  revalidatePath(`/app/quotes/${quoteId}`);
  return { ok: true };
}
