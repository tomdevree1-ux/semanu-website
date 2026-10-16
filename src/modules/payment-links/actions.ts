'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { linkCreateSchema, linkNotesSchema, type PaymentLinkActionState } from './schema';
import { invoiceAllowsLink, linkIsActive, linkIsArchivable, confirmMatches } from './guards';
import { createInvoiceCheckoutSession } from './stripe';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';

type Admin = ReturnType<typeof createAdminClient>;
type InvoiceForLink = { id: string; status: string; archived_at: string | null; company_id: string; invoice_number: string; balance_due: number; currency: string };

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

async function loadInvoiceForLink(admin: Admin, invoiceId: string): Promise<InvoiceForLink | null> {
  const { data } = await admin
    .from('invoices')
    .select('id, status, archived_at, company_id, invoice_number, balance_due, currency')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!data) return null;
  return { ...data, balance_due: num(data.balance_due) };
}

/** Internal: insert a draft row, call Stripe, activate or fail. Returns the new link id. */
async function generateLink(
  admin: Admin,
  actorId: string,
  invoice: InvoiceForLink,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data: row, error: insErr } = await admin
    .from('invoice_payment_links')
    .insert({
      invoice_id: invoice.id,
      company_id: invoice.company_id, // denormalized (P11-D5)
      amount: invoice.balance_due, // snapshot of balance_due (P11-D6)
      currency: invoice.currency,
      status: 'draft',
      provider: 'stripe',
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id')
    .single();
  if (insErr || !row) return { ok: false, error: GENERIC };

  try {
    const session = await createInvoiceCheckoutSession({
      linkId: row.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      companyId: invoice.company_id,
      amount: invoice.balance_due,
      currency: invoice.currency,
    });
    await admin
      .from('invoice_payment_links')
      .update({
        status: 'active',
        provider_checkout_session_id: session.sessionId,
        provider_payment_intent_id: session.paymentIntentId,
        url: session.url,
        expires_at: session.expiresAt,
        updated_by: actorId,
      })
      .eq('id', row.id);

    // No URL in ordinary metadata (P11-D9); field names + ids only.
    await logEvent({
      action: 'payment_link.created',
      actorId,
      entityType: 'payment_link',
      entityId: row.id,
      newStatus: 'active',
      metadata: { invoice_id: invoice.id, company_id: invoice.company_id, invoice_number: invoice.invoice_number, provider: 'stripe' },
      source: 'portal',
    });
    await logEvent({
      action: 'payment_link.stripe_created',
      actorId,
      entityType: 'payment_link',
      entityId: row.id,
      metadata: { invoice_id: invoice.id, provider_checkout_session_id: session.sessionId },
      source: 'portal',
    });
    await logEvent({
      action: 'invoice.payment_link_created',
      actorId,
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { payment_link_id: row.id },
      source: 'portal',
    });
    return { ok: true, id: row.id };
  } catch (err) {
    console.error('[payment-links] Stripe session create failed:', err instanceof Error ? err.message : 'unknown');
    await admin.from('invoice_payment_links').update({ status: 'failed', failed_at: new Date().toISOString(), updated_by: actorId }).eq('id', row.id);
    await logEvent({
      action: 'payment_link.failed',
      actorId,
      entityType: 'payment_link',
      entityId: row.id,
      newStatus: 'failed',
      metadata: { invoice_id: invoice.id },
      source: 'portal',
    });
    return { ok: false, error: 'Stripe could not create the payment link. Please try again.' };
  }
}

/** Cancel a single active link (internal helper, no audit on its own — caller audits). */
async function markCancelled(admin: Admin, actorId: string, linkId: string): Promise<void> {
  await admin
    .from('invoice_payment_links')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_by: actorId })
    .eq('id', linkId);
}

// ── actions ──────────────────────────────────────────────────────────────────

export async function createStripeCheckoutForInvoice(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.create'))) return { error: NOT_ALLOWED };
  const parsed = linkCreateSchema.safeParse({ invoiceId: formData.get('invoiceId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const admin = createAdminClient();
  const invoice = await loadInvoiceForLink(admin, parsed.data.invoiceId);
  if (!invoice) return { error: 'Invoice not found.' };
  if (!invoiceAllowsLink(invoice.status, invoice.archived_at, invoice.balance_due)) {
    return { error: 'Payment links can only be generated for issued or overdue invoices with a balance due.' };
  }

  const { data: existing } = await admin
    .from('invoice_payment_links')
    .select('id')
    .eq('invoice_id', invoice.id)
    .eq('status', 'active')
    .is('archived_at', null)
    .maybeSingle();
  if (existing) return { error: 'An active payment link already exists for this invoice. Cancel or regenerate it.' };

  const res = await generateLink(admin, actor.id, invoice);
  if (!res.ok) return { error: res.error };

  revalidatePath('/app/payment-links');
  revalidatePath(`/app/invoices/${invoice.id}`);
  redirect(`/app/payment-links/${res.id}`);
}

export async function regeneratePaymentLink(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.create'))) return { error: NOT_ALLOWED };
  const invoiceId = String(formData.get('invoiceId') ?? '');
  if (!invoiceId) return { error: GENERIC };

  const admin = createAdminClient();
  const invoice = await loadInvoiceForLink(admin, invoiceId);
  if (!invoice) return { error: 'Invoice not found.' };
  if (!invoiceAllowsLink(invoice.status, invoice.archived_at, invoice.balance_due)) {
    return { error: 'Payment links can only be generated for issued or overdue invoices with a balance due.' };
  }

  // Supersede the current active link (P11-D8).
  const { data: active } = await admin
    .from('invoice_payment_links')
    .select('id')
    .eq('invoice_id', invoice.id)
    .eq('status', 'active')
    .is('archived_at', null)
    .maybeSingle();
  if (active) {
    await markCancelled(admin, actor.id, active.id);
    await logEvent({ action: 'payment_link.cancelled', actorId: actor.id, entityType: 'payment_link', entityId: active.id, oldStatus: 'active', newStatus: 'cancelled', metadata: { invoice_id: invoice.id, reason: 'superseded' }, source: 'portal' });
    await logEvent({ action: 'invoice.payment_link_cancelled', actorId: actor.id, entityType: 'invoice', entityId: invoice.id, metadata: { payment_link_id: active.id }, source: 'portal' });
  }

  const res = await generateLink(admin, actor.id, invoice);
  if (!res.ok) return { error: res.error };

  revalidatePath('/app/payment-links');
  revalidatePath(`/app/invoices/${invoice.id}`);
  redirect(`/app/payment-links/${res.id}`);
}

export async function cancelPaymentLink(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.cancel'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentLinkId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: link } = await admin.from('invoice_payment_links').select('status, invoice_id').eq('id', id).maybeSingle();
  if (!link) return { error: 'Payment link not found.' };
  if (!linkIsActive(link.status)) return { error: 'Only an active payment link can be cancelled.' };

  // Stripe Checkout Sessions cannot be force-cancelled via the API; we mark the link
  // cancelled internally and let the Stripe session expire on its own.
  await markCancelled(admin, actor.id, id);

  await logEvent({ action: 'payment_link.cancelled', actorId: actor.id, entityType: 'payment_link', entityId: id, oldStatus: 'active', newStatus: 'cancelled', metadata: { invoice_id: link.invoice_id }, source: 'portal' });
  await logEvent({ action: 'invoice.payment_link_cancelled', actorId: actor.id, entityType: 'invoice', entityId: link.invoice_id, metadata: { payment_link_id: id }, source: 'portal' });

  revalidatePath(`/app/payment-links/${id}`);
  revalidatePath('/app/payment-links');
  revalidatePath(`/app/invoices/${link.invoice_id}`);
  return { ok: true };
}

export async function updatePaymentLinkNotes(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.create'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentLinkId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: link } = await admin.from('invoice_payment_links').select('archived_at, notes, internal_notes').eq('id', id).maybeSingle();
  if (!link) return { error: 'Payment link not found.' };
  if (link.archived_at) return { error: 'Restore this payment link before editing it.' };

  const parsed = linkNotesSchema.safeParse({ notes: formData.get('notes'), internalNotes: formData.get('internalNotes') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const next = { notes: parsed.data.notes ?? null, internal_notes: parsed.data.internalNotes ?? null, updated_by: actor.id };
  const { error } = await admin.from('invoice_payment_links').update(next).eq('id', id);
  if (error) return { error: GENERIC };

  const changed = (['notes', 'internal_notes'] as const).filter((k) => (link as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]);
  await logEvent({ action: 'payment_link.updated', actorId: actor.id, entityType: 'payment_link', entityId: id, metadata: { fields: changed }, source: 'portal' });

  revalidatePath(`/app/payment-links/${id}`);
  return { ok: true };
}

export async function archivePaymentLink(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentLinkId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: link } = await admin.from('invoice_payment_links').select('status, archived_at, invoice_id').eq('id', id).maybeSingle();
  if (!link) return { error: 'Payment link not found.' };
  if (link.archived_at) return { ok: true };
  if (!linkIsArchivable(link.status)) return { error: 'Cancel or expire an active link before archiving it.' };

  const { data: inv } = await admin.from('invoices').select('invoice_number').eq('id', link.invoice_id).maybeSingle();
  if (!inv || !confirmMatches(typed, inv.invoice_number)) return { error: 'The invoice number you typed does not match.' };

  const { error } = await admin
    .from('invoice_payment_links')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({ action: 'payment_link.archived', actorId: actor.id, severity: 'warning', entityType: 'payment_link', entityId: id, oldStatus: link.status, newStatus: 'archived', metadata: { invoice_id: link.invoice_id }, source: 'portal' });

  revalidatePath(`/app/payment-links/${id}`);
  revalidatePath('/app/payment-links');
  return { ok: true };
}

export async function restorePaymentLink(_prev: PaymentLinkActionState, formData: FormData): Promise<PaymentLinkActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('payment_links.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('paymentLinkId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: link } = await admin.from('invoice_payment_links').select('archived_at, invoice_id').eq('id', id).maybeSingle();
  if (!link) return { error: 'Payment link not found.' };
  if (!link.archived_at) return { error: 'This payment link is not archived.' };

  // Restore to `cancelled`, never re-activated (P11-D16) — the Stripe session may be gone.
  const { error } = await admin
    .from('invoice_payment_links')
    .update({ status: 'cancelled', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({ action: 'payment_link.restored', actorId: actor.id, entityType: 'payment_link', entityId: id, oldStatus: 'archived', newStatus: 'cancelled', metadata: { invoice_id: link.invoice_id }, source: 'portal' });

  revalidatePath(`/app/payment-links/${id}`);
  revalidatePath('/app/payment-links');
  return { ok: true };
}
