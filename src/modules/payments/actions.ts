'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import type { Database } from '@/lib/types/database';
import {
  paymentCreateSchema,
  paymentUpdateSchema,
  paymentStatusChangeSchema,
  type PaymentActionState,
} from './schema';
import { permissionForPaymentTransition, type PaymentStatus } from './status';
import {
  isLegalPaymentTransition,
  confirmMatches,
  invoiceAllowsPayment,
  paymentIsEditable,
  paymentIsArchivable,
} from './guards';
import { computeAmountPaid, computeBalanceDue } from './totals';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
const HAS_PAYMENTS = 'This invoice has payment records. Update payment records instead.';

type Admin = ReturnType<typeof createAdminClient>;

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Recompute and persist the invoice's amount_paid / balance_due / paid_at from its
 * succeeded, non-archived payments (P10-D13). Never changes the invoice status
 * (P10-D14). Emits invoice.payment_state_updated (field NAMES only) when a figure
 * actually changes. This is the authority for the invoice paid figures once payments
 * exist (paired with the P9 manual-mark-paid guard).
 */
export async function recalculateInvoicePaymentState(admin: Admin, invoiceId: string, actorId: string): Promise<void> {
  const { data: inv } = await admin
    .from('invoices')
    .select('total_amount, amount_paid, balance_due, paid_at')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!inv) return;

  const { data: pays } = await admin.from('invoice_payments').select('amount, status, archived_at').eq('invoice_id', invoiceId);
  const rows = (pays ?? []).map((p) => ({ amount: num(p.amount), status: p.status, archivedAt: p.archived_at }));
  const total = num(inv.total_amount);
  const amountPaid = computeAmountPaid(rows);
  const balanceDue = computeBalanceDue(total, amountPaid);
  const paidCount = rows.filter((r) => r.status === 'succeeded' && !r.archivedAt).length;
  const fullyPaid = paidCount > 0 && amountPaid >= total;
  const paidAt = fullyPaid ? (inv.paid_at ?? new Date().toISOString()) : null;

  const changed: string[] = [];
  if (num(inv.amount_paid) !== amountPaid) changed.push('amount_paid');
  if (num(inv.balance_due) !== balanceDue) changed.push('balance_due');
  if ((inv.paid_at ?? null) !== paidAt) changed.push('paid_at');
  if (!changed.length) return;

  await admin.from('invoices').update({ amount_paid: amountPaid, balance_due: balanceDue, paid_at: paidAt }).eq('id', invoiceId);
  await logEvent({
    action: 'invoice.payment_state_updated',
    actorId,
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { fields: changed },
    source: 'portal',
  });
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath('/app/invoices');
}

// ── payments ─────────────────────────────────────────────────────────────────

export async function createManualPayment(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payments.create'))) return { error: NOT_ALLOWED };

  const parsed = paymentCreateSchema.safeParse({
    invoiceId: formData.get('invoiceId'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    provider: formData.get('provider'),
    providerPaymentId: formData.get('providerPaymentId'),
    providerCheckoutSessionId: formData.get('providerCheckoutSessionId'),
    providerPaymentIntentId: formData.get('providerPaymentIntentId'),
    notes: formData.get('notes'),
    internalNotes: formData.get('internalNotes'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from('invoices')
    .select('id, status, archived_at, company_id')
    .eq('id', input.invoiceId)
    .maybeSingle();
  if (!invoice) return { error: 'Invoice not found.' };
  if (!invoiceAllowsPayment(invoice.status, invoice.archived_at)) {
    return { error: 'You cannot record a payment for a void or archived invoice.' };
  }

  const { data, error } = await admin
    .from('invoice_payments')
    .insert({
      invoice_id: invoice.id,
      company_id: invoice.company_id, // denormalized from the invoice (P10-D4)
      amount: input.amount,
      status: 'pending', // P10-D16: admin confirms succeeded separately
      method: input.method,
      provider: input.provider,
      provider_payment_id: input.providerPaymentId ?? null,
      provider_checkout_session_id: input.providerCheckoutSessionId ?? null,
      provider_payment_intent_id: input.providerPaymentIntentId ?? null,
      notes: input.notes ?? null,
      internal_notes: input.internalNotes ?? null,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { error: GENERIC };

  await logEvent({
    action: 'payment.created',
    actorId: actor.id,
    entityType: 'payment',
    entityId: data.id,
    newStatus: 'pending',
    metadata: { invoice_id: invoice.id, company_id: invoice.company_id },
    source: 'portal',
  });

  // No invoice recalc — a pending payment does not count toward amount_paid.
  revalidatePath('/app/payments');
  redirect(`/app/payments/${data.id}`);
}

export async function updatePayment(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payments.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('invoice_payments')
    .select('status, archived_at, amount, method, provider, provider_payment_id, provider_checkout_session_id, provider_payment_intent_id, notes, internal_notes')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Payment not found.' };
  if (!paymentIsEditable(before.status, before.archived_at)) {
    return { error: 'Only pending payments can be edited.' };
  }

  const parsed = paymentUpdateSchema.safeParse({
    amount: formData.get('amount'),
    method: formData.get('method'),
    provider: formData.get('provider'),
    providerPaymentId: formData.get('providerPaymentId'),
    providerCheckoutSessionId: formData.get('providerCheckoutSessionId'),
    providerPaymentIntentId: formData.get('providerPaymentIntentId'),
    notes: formData.get('notes'),
    internalNotes: formData.get('internalNotes'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const next = {
    amount: input.amount,
    method: input.method,
    provider: input.provider,
    provider_payment_id: input.providerPaymentId ?? null,
    provider_checkout_session_id: input.providerCheckoutSessionId ?? null,
    provider_payment_intent_id: input.providerPaymentIntentId ?? null,
    notes: input.notes ?? null,
    internal_notes: input.internalNotes ?? null,
    updated_by: actor.id,
  };
  const { error } = await admin.from('invoice_payments').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  // Changed field NAMES only in ordinary metadata (no money values / provider secrets).
  const beforeNorm = { ...before, amount: num(before.amount) };
  const compareKeys = ['amount', 'method', 'provider', 'provider_payment_id', 'provider_checkout_session_id', 'provider_payment_intent_id', 'notes', 'internal_notes'] as const;
  const changed = compareKeys.filter((k) => (beforeNorm as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({
    action: 'payment.updated',
    actorId: actor.id,
    entityType: 'payment',
    entityId: id,
    metadata: { fields: changed },
    oldValues: beforeNorm,
    newValues: next,
    source: 'portal',
  });

  // Pending payments do not count — no invoice recalc needed.
  revalidatePath(`/app/payments/${id}`);
  revalidatePath('/app/payments');
  return { ok: true };
}

export async function changePaymentStatus(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payments.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentId') ?? '');
  const parsed = paymentStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status as PaymentStatus;

  const admin = createAdminClient();
  const { data: p } = await admin
    .from('invoice_payments')
    .select('status, archived_at, invoice_id')
    .eq('id', id)
    .maybeSingle();
  if (!p) return { error: 'Payment not found.' };
  if (p.archived_at) return { error: 'Restore this payment before changing its status.' };
  if (p.status === to) return { ok: true };

  const from = p.status as PaymentStatus;
  const needed = permissionForPaymentTransition(from, to);
  if (needed !== 'payments.update' && !(await hasPermission(needed))) return { error: NOT_ALLOWED };
  if (!isLegalPaymentTransition(from, to)) return { error: 'That status change is not allowed.' };

  const patch: Database['public']['Tables']['invoice_payments']['Update'] = { status: to, updated_by: actor.id };
  if (to === 'succeeded') {
    patch.paid_at = new Date().toISOString();
    patch.failed_at = null;
    patch.refunded_at = null;
  }
  if (to === 'failed') patch.failed_at = new Date().toISOString();
  if (to === 'refunded') patch.refunded_at = new Date().toISOString();
  if (to === 'pending') {
    patch.paid_at = null;
    patch.failed_at = null;
    patch.refunded_at = null;
  }

  const { error } = await admin.from('invoice_payments').update(patch).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'payment.status_changed',
    actorId: actor.id,
    entityType: 'payment',
    entityId: id,
    oldStatus: from,
    newStatus: to,
    source: 'portal',
  });

  // Recompute the invoice (covers → succeeded and succeeded → refunded).
  await recalculateInvoicePaymentState(admin, p.invoice_id, actor.id);

  revalidatePath(`/app/payments/${id}`);
  revalidatePath('/app/payments');
  return { ok: true };
}

export async function archivePayment(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payments.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: p } = await admin.from('invoice_payments').select('status, archived_at, invoice_id').eq('id', id).maybeSingle();
  if (!p) return { error: 'Payment not found.' };
  if (p.archived_at) return { ok: true };
  if (!paymentIsArchivable(p.status)) return { error: 'A succeeded payment must be refunded before it can be archived.' };

  // Type-to-confirm the invoice number (payments have no human number).
  const { data: inv } = await admin.from('invoices').select('invoice_number').eq('id', p.invoice_id).maybeSingle();
  if (!inv || !confirmMatches(typed, inv.invoice_number)) return { error: 'The invoice number you typed does not match.' };

  const { error } = await admin
    .from('invoice_payments')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'payment.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'payment',
    entityId: id,
    oldStatus: p.status,
    newStatus: 'archived',
    metadata: { invoice_id: p.invoice_id },
    source: 'portal',
  });

  await recalculateInvoicePaymentState(admin, p.invoice_id, actor.id);

  revalidatePath(`/app/payments/${id}`);
  revalidatePath('/app/payments');
  return { ok: true };
}

export async function restorePayment(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payments.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: p } = await admin.from('invoice_payments').select('archived_at, invoice_id').eq('id', id).maybeSingle();
  if (!p) return { error: 'Payment not found.' };
  if (!p.archived_at) return { error: 'This payment is not archived.' };

  const { error } = await admin
    .from('invoice_payments')
    .update({ status: 'pending', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'payment.restored',
    actorId: actor.id,
    entityType: 'payment',
    entityId: id,
    oldStatus: 'archived',
    newStatus: 'pending',
    metadata: { invoice_id: p.invoice_id },
    source: 'portal',
  });

  await recalculateInvoicePaymentState(admin, p.invoice_id, actor.id);

  revalidatePath(`/app/payments/${id}`);
  revalidatePath('/app/payments');
  return { ok: true };
}
