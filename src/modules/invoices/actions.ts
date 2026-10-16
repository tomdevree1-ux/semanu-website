'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import type { Database } from '@/lib/types/database';
import {
  invoiceCreateSchema,
  invoiceFromQuoteSchema,
  invoiceUpdateSchema,
  invoiceStatusChangeSchema,
  invoiceItemCreateSchema,
  invoiceItemUpdateSchema,
  type InvoiceActionState,
} from './schema';
import { permissionForTransition, type InvoiceStatus } from './status';
import {
  isLegalInvoiceTransition,
  isArchivableStatus,
  confirmMatches,
  contactBelongsToCompany,
  projectBelongsToCompany,
  quoteBelongsToCompany,
} from './guards';
import { computeLine, computeInvoiceTotals, computeBalanceDue } from './totals';

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
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Recompute and persist subtotal + total + balance_due from lines + stored discount/tax/amount_paid (P9-D5/D8). */
async function recalcTotals(admin: Admin, invoiceId: string): Promise<void> {
  const { data: iv } = await admin
    .from('invoices')
    .select('discount_amount, tax_amount, amount_paid')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!iv) return;
  const { data: items } = await admin.from('invoice_items').select('line_total').eq('invoice_id', invoiceId);
  const lines = (items ?? []).map((i) => ({ lineTotal: num(i.line_total) }));
  const { subtotal, total } = computeInvoiceTotals(lines, num(iv.discount_amount), num(iv.tax_amount));
  const balanceDue = computeBalanceDue(total, num(iv.amount_paid));
  await admin.from('invoices').update({ subtotal, total_amount: total, balance_due: balanceDue }).eq('id', invoiceId);
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

async function validateQuote(admin: Admin, quoteId: string | null | undefined, companyId: string): Promise<Ok | Err> {
  if (!quoteId) return { ok: true };
  const { data: qz } = await admin.from('quotes').select('company_id, archived_at').eq('id', quoteId).maybeSingle();
  if (!qz) return { ok: false, error: 'The selected quote was not found.' };
  if (qz.archived_at) return { ok: false, error: 'You cannot link an archived quote.' };
  if (!quoteBelongsToCompany(qz.company_id, companyId)) return { ok: false, error: 'The quote does not belong to this company.' };
  return { ok: true };
}

/** Load a draft, non-archived invoice (the gate for header + line-item edits — issued invoices are immutable). */
async function requireEditableInvoice(
  admin: Admin,
  invoiceId: string,
): Promise<{ ok: true; invoice: { id: string; status: string; archived_at: string | null } } | Err> {
  if (!invoiceId) return { ok: false, error: GENERIC };
  const { data: iv } = await admin.from('invoices').select('id, status, archived_at').eq('id', invoiceId).maybeSingle();
  if (!iv) return { ok: false, error: 'Invoice not found.' };
  if (iv.archived_at) return { ok: false, error: 'Restore this invoice before editing it.' };
  if (iv.status !== 'draft') return { ok: false, error: 'Only draft invoices can be edited. Issued invoices are read-only.' };
  return { ok: true, invoice: iv };
}

// ── invoices ───────────────────────────────────────────────────────────────────

export async function createInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.create'))) return { error: NOT_ALLOWED };

  const parsed = invoiceCreateSchema.safeParse({
    title: formData.get('title'),
    companyId: formData.get('companyId'),
    contactId: formData.get('contactId'),
    projectId: formData.get('projectId'),
    quoteId: formData.get('quoteId'),
    dueDate: formData.get('dueDate'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('id, archived_at').eq('id', input.companyId).maybeSingle();
  if (!company) return { error: 'Company not found.' };
  if (company.archived_at) return { error: 'You cannot create an invoice for an archived company.' };

  const c = await validateContact(admin, input.contactId, input.companyId);
  if (!c.ok) return { error: c.error };
  const p = await validateProject(admin, input.projectId, input.companyId);
  if (!p.ok) return { error: p.error };
  const qz = await validateQuote(admin, input.quoteId, input.companyId);
  if (!qz.ok) return { error: qz.error };

  const { data, error } = await admin
    .from('invoices')
    .insert({
      title: input.title,
      company_id: input.companyId,
      contact_id: input.contactId ?? null,
      project_id: input.projectId ?? null,
      quote_id: input.quoteId ?? null,
      due_date: input.dueDate ?? null,
      status: 'draft',
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id, invoice_number')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'invoice.created',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: data.id,
    entityDisplayName: data.invoice_number,
    newStatus: 'draft',
    metadata: { invoice_number: data.invoice_number, company_id: input.companyId },
    source: 'portal',
  });

  revalidatePath('/app/invoices');
  redirect(`/app/invoices/${data.id}`);
}

export async function createInvoiceFromQuote(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.create'))) return { error: NOT_ALLOWED };

  const parsed = invoiceFromQuoteSchema.safeParse({ quoteId: formData.get('quoteId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { quoteId } = parsed.data;

  const admin = createAdminClient();
  const { data: quote } = await admin
    .from('quotes')
    .select('id, quote_number, title, company_id, contact_id, project_id, discount_amount, tax_amount, archived_at')
    .eq('id', quoteId)
    .maybeSingle();
  if (!quote) return { error: 'Quote not found.' };
  if (quote.archived_at) return { error: 'You cannot invoice an archived quote.' };

  const { data: qItems } = await admin
    .from('quote_items')
    .select('id, catalog_item_id, position, name, description, quantity, unit_price, billing_interval, line_subtotal, line_total')
    .eq('quote_id', quoteId)
    .order('position', { ascending: true });

  const { data: inv, error } = await admin
    .from('invoices')
    .insert({
      title: quote.title,
      company_id: quote.company_id,
      contact_id: quote.contact_id,
      project_id: quote.project_id,
      quote_id: quote.id,
      discount_amount: num(quote.discount_amount),
      tax_amount: num(quote.tax_amount),
      status: 'draft',
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id, invoice_number')
    .single();
  if (error || !inv) return { error: GENERIC };

  const lines = (qItems ?? []).map((qi) => ({
    invoice_id: inv.id,
    quote_item_id: qi.id,
    catalog_item_id: qi.catalog_item_id,
    position: qi.position,
    name: qi.name,
    description: qi.description,
    quantity: num(qi.quantity),
    unit_price: num(qi.unit_price),
    billing_interval: qi.billing_interval,
    line_subtotal: num(qi.line_subtotal),
    line_total: num(qi.line_total),
  }));
  if (lines.length) {
    const { error: liErr } = await admin.from('invoice_items').insert(lines);
    if (liErr) return { error: GENERIC };
  }
  await recalcTotals(admin, inv.id);

  await logEvent({
    action: 'invoice.created_from_quote',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: inv.id,
    entityDisplayName: inv.invoice_number,
    newStatus: 'draft',
    metadata: { quote_id: quote.id, quote_number: quote.quote_number, item_count: lines.length },
    source: 'portal',
  });

  revalidatePath('/app/invoices');
  redirect(`/app/invoices/${inv.id}`);
}

export async function updateInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('invoiceId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const gate = await requireEditableInvoice(admin, id);
  if (!gate.ok) return { error: gate.error };

  const parsed = invoiceUpdateSchema.safeParse({
    title: formData.get('title'),
    contactId: formData.get('contactId'),
    projectId: formData.get('projectId'),
    quoteId: formData.get('quoteId'),
    dueDate: formData.get('dueDate'),
    notes: formData.get('notes'),
    internalNotes: formData.get('internalNotes'),
    discountAmount: formData.get('discountAmount'),
    taxAmount: formData.get('taxAmount'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const { data: before } = await admin
    .from('invoices')
    .select('company_id,title,contact_id,project_id,quote_id,due_date,notes,internal_notes,discount_amount,tax_amount')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Invoice not found.' };

  const c = await validateContact(admin, input.contactId, before.company_id);
  if (!c.ok) return { error: c.error };
  const p = await validateProject(admin, input.projectId, before.company_id);
  if (!p.ok) return { error: p.error };
  const qz = await validateQuote(admin, input.quoteId, before.company_id);
  if (!qz.ok) return { error: qz.error };

  const next = {
    title: input.title,
    contact_id: input.contactId ?? null,
    project_id: input.projectId ?? null,
    quote_id: input.quoteId ?? null,
    due_date: input.dueDate ?? null,
    notes: input.notes ?? null,
    internal_notes: input.internalNotes ?? null,
    discount_amount: input.discountAmount,
    tax_amount: input.taxAmount,
    updated_by: actor.id,
  };
  const { error } = await admin.from('invoices').update(next).eq('id', id);
  if (error) return { error: GENERIC };
  await recalcTotals(admin, id);

  // Changed field NAMES only in ordinary metadata (no money values). Full before/after
  // (incl. money) goes to old_values/new_values (technical-only, audit.read_technical).
  const beforeNorm = { ...before, discount_amount: num(before.discount_amount), tax_amount: num(before.tax_amount) };
  const compareKeys = ['title', 'contact_id', 'project_id', 'quote_id', 'due_date', 'notes', 'internal_notes', 'discount_amount', 'tax_amount'] as const;
  const changed = compareKeys.filter((k) => (beforeNorm as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({
    action: 'invoice.updated',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: id,
    metadata: { fields: changed },
    oldValues: beforeNorm,
    newValues: next,
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${id}`);
  revalidatePath('/app/invoices');
  return { ok: true };
}

export async function changeInvoiceStatus(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('invoiceId') ?? '');
  const parsed = invoiceStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status as InvoiceStatus;

  const admin = createAdminClient();
  const { data: iv } = await admin
    .from('invoices')
    .select('status, invoice_number, archived_at, total_amount, issue_date')
    .eq('id', id)
    .maybeSingle();
  if (!iv) return { error: 'Invoice not found.' };
  if (iv.archived_at) return { error: 'Restore this invoice before changing its status.' };
  if (iv.status === to) return { ok: true };

  const from = iv.status as InvoiceStatus;
  const needed = permissionForTransition(from, to);
  if (needed !== 'invoices.update' && !(await hasPermission(needed))) return { error: NOT_ALLOWED };
  if (!isLegalInvoiceTransition(from, to)) return { error: 'That status change is not allowed.' };

  // P10 guard: once payment records exist, the paid figures are owned by the payments layer.
  // Block the money-mutating manual mark-paid (→ paid) and un-pay (paid → issued) so they cannot
  // overwrite payment-record authority. Behaviour is unchanged for invoices with no payments.
  if (to === 'paid' || (from === 'paid' && to === 'issued')) {
    const { count } = await admin
      .from('invoice_payments')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', id)
      .is('archived_at', null);
    if ((count ?? 0) > 0) return { error: 'This invoice has payment records. Update payment records instead.' };
  }

  const patch: Database['public']['Tables']['invoices']['Update'] = { status: to, updated_by: actor.id };
  if (to === 'issued' && !iv.issue_date) patch.issue_date = todayIso();
  if (to === 'paid') {
    patch.amount_paid = num(iv.total_amount);
    patch.balance_due = 0;
    patch.paid_at = new Date().toISOString();
  }
  if (from === 'paid' && to === 'issued') {
    patch.amount_paid = 0;
    patch.paid_at = null;
    patch.balance_due = num(iv.total_amount);
  }

  const { error } = await admin.from('invoices').update(patch).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'invoice.status_changed',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: id,
    entityDisplayName: iv.invoice_number,
    oldStatus: from,
    newStatus: to,
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${id}`);
  revalidatePath('/app/invoices');
  return { ok: true };
}

export async function archiveInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('invoiceId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: iv } = await admin.from('invoices').select('status, invoice_number, archived_at').eq('id', id).maybeSingle();
  if (!iv) return { error: 'Invoice not found.' };
  if (iv.archived_at) return { ok: true };
  if (!isArchivableStatus(iv.status)) return { error: 'Only draft or void invoices can be archived.' };
  if (!confirmMatches(typed, iv.invoice_number)) return { error: 'The number you typed does not match.' };

  const { error } = await admin
    .from('invoices')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'invoice.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'invoice',
    entityId: id,
    entityDisplayName: iv.invoice_number,
    oldStatus: iv.status,
    newStatus: 'archived',
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${id}`);
  revalidatePath('/app/invoices');
  return { ok: true };
}

export async function restoreInvoice(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('invoiceId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: iv } = await admin.from('invoices').select('invoice_number, archived_at').eq('id', id).maybeSingle();
  if (!iv) return { error: 'Invoice not found.' };
  if (!iv.archived_at) return { error: 'This invoice is not archived.' };

  const { error } = await admin
    .from('invoices')
    .update({ status: 'draft', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'invoice.restored',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: id,
    entityDisplayName: iv.invoice_number,
    oldStatus: 'archived',
    newStatus: 'draft',
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${id}`);
  revalidatePath('/app/invoices');
  return { ok: true };
}

// ── line items (draft only) ──────────────────────────────────────────────────

export async function addInvoiceItem(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const invoiceId = String(formData.get('invoiceId') ?? '');

  const admin = createAdminClient();
  const gate = await requireEditableInvoice(admin, invoiceId);
  if (!gate.ok) return { error: gate.error };

  const parsed = invoiceItemCreateSchema.safeParse({
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
    .from('invoice_items')
    .select('position')
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (maxRow?.position ?? 0) + 1;
  const { lineSubtotal, lineTotal } = computeLine(input.quantity, input.unitPrice);

  const { data, error } = await admin
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
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
  await recalcTotals(admin, invoiceId);

  await logEvent({
    action: 'invoice.item_added',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { item_id: data.id, position, name: input.name },
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${invoiceId}`);
  return { ok: true };
}

export async function updateInvoiceItem(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: item } = await admin.from('invoice_items').select('invoice_id').eq('id', itemId).maybeSingle();
  if (!item) return { error: 'Line item not found.' };
  const gate = await requireEditableInvoice(admin, item.invoice_id);
  if (!gate.ok) return { error: gate.error };

  const parsed = invoiceItemUpdateSchema.safeParse({
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
    .from('invoice_items')
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
  await recalcTotals(admin, item.invoice_id);

  await logEvent({
    action: 'invoice.item_updated',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: item.invoice_id,
    metadata: { item_id: itemId, fields: ['name', 'description', 'quantity', 'unit_price', 'billing_interval'] },
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${item.invoice_id}`);
  return { ok: true };
}

export async function removeInvoiceItem(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: item } = await admin.from('invoice_items').select('invoice_id, name, position').eq('id', itemId).maybeSingle();
  if (!item) return { error: 'Line item not found.' };
  const gate = await requireEditableInvoice(admin, item.invoice_id);
  if (!gate.ok) return { error: gate.error };

  const { error } = await admin.from('invoice_items').delete().eq('id', itemId);
  if (error) return { error: GENERIC };

  // Resequence remaining positions 1..n.
  const { data: rest } = await admin.from('invoice_items').select('id').eq('invoice_id', item.invoice_id).order('position', { ascending: true });
  let pos = 1;
  for (const r of rest ?? []) {
    await admin.from('invoice_items').update({ position: pos }).eq('id', r.id);
    pos += 1;
  }
  await recalcTotals(admin, item.invoice_id);

  await logEvent({
    action: 'invoice.item_removed',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: item.invoice_id,
    metadata: { item_id: itemId, name: item.name, position: item.position },
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${item.invoice_id}`);
  return { ok: true };
}

export async function reorderInvoiceItems(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('invoices.update'))) return { error: NOT_ALLOWED };
  const invoiceId = String(formData.get('invoiceId') ?? '');

  let orderedIds: string[] = [];
  try {
    orderedIds = JSON.parse(String(formData.get('orderedIds') ?? '[]'));
  } catch {
    return { error: GENERIC };
  }
  if (!Array.isArray(orderedIds) || !orderedIds.length) return { error: GENERIC };

  const admin = createAdminClient();
  const gate = await requireEditableInvoice(admin, invoiceId);
  if (!gate.ok) return { error: gate.error };

  const { data: existing } = await admin.from('invoice_items').select('id').eq('invoice_id', invoiceId);
  const owned = new Set((existing ?? []).map((r) => r.id));
  if (orderedIds.length !== owned.size || !orderedIds.every((iid) => owned.has(iid))) {
    return { error: 'Invalid reorder.' };
  }

  let pos = 1;
  for (const iid of orderedIds) {
    await admin.from('invoice_items').update({ position: pos }).eq('id', iid);
    pos += 1;
  }

  await logEvent({
    action: 'invoice.items_reordered',
    actorId: actor.id,
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { count: orderedIds.length },
    source: 'portal',
  });

  revalidatePath(`/app/invoices/${invoiceId}`);
  return { ok: true };
}
