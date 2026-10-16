import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeAmountPaid, computeBalanceDue, isOverpaid } from './totals';
import type { PaymentListRow, PaymentDetail, InvoicePaymentRow, InvoicePaymentSummary } from './types';

/**
 * SERVER ONLY payment reads (service-role; callers gate with
 * requirePermission('payments.read')). Default lists hide archived. Numeric money
 * is coerced to numbers defensively.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'archived'];

export type PaymentFilters = { q?: string; status?: string; companyId?: string; invoiceId?: string; showArchived?: boolean; page?: number };

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}
function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

async function resolveCompanyNames(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name').in('id', unique);
  for (const c of data ?? []) map.set(c.id, c.company_name);
  return map;
}
async function resolveInvoiceNumbers(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('invoices').select('id, invoice_number').in('id', unique);
  for (const i of data ?? []) map.set(i.id, i.invoice_number);
  return map;
}

export async function listPayments(
  filters: PaymentFilters,
): Promise<{ rows: PaymentListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('invoice_payments')
    .select('id,amount,currency,status,method,provider,invoice_id,company_id,paid_at,created_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  if (filters.invoiceId) q = q.eq('invoice_id', filters.invoiceId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`provider_payment_id.ilike.%${s}%,provider_payment_intent_id.ilike.%${s}%,notes.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [names, invNums] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id)),
    resolveInvoiceNumbers(admin, list.map((x) => x.invoice_id)),
  ]);
  const rows: PaymentListRow[] = list.map((x) => ({
    id: x.id,
    amount: num(x.amount),
    currency: x.currency,
    status: x.status,
    method: x.method,
    provider: x.provider,
    invoiceId: x.invoice_id,
    invoiceNumber: invNums.get(x.invoice_id) ?? null,
    companyId: x.company_id,
    companyName: names.get(x.company_id) ?? null,
    paidAt: x.paid_at,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getPayment(id: string): Promise<PaymentDetail | null> {
  const admin = createAdminClient();
  const { data: p } = await admin.from('invoice_payments').select('*').eq('id', id).maybeSingle();
  if (!p) return null;

  // The invoice and company reads are independent (both keyed off `p`), so run them concurrently.
  const [{ data: inv }, { data: company }] = await Promise.all([
    admin.from('invoices').select('invoice_number, status, archived_at').eq('id', p.invoice_id).maybeSingle(),
    admin.from('companies').select('company_name, archived_at').eq('id', p.company_id).maybeSingle(),
  ]);

  return {
    id: p.id,
    amount: num(p.amount),
    currency: p.currency,
    status: p.status,
    method: p.method,
    provider: p.provider,
    providerPaymentId: p.provider_payment_id,
    providerCheckoutSessionId: p.provider_checkout_session_id,
    providerPaymentIntentId: p.provider_payment_intent_id,
    legacyPaymentId: p.legacy_payment_id,
    paymentLinkId: p.payment_link_id,
    invoiceId: p.invoice_id,
    invoiceNumber: inv?.invoice_number ?? null,
    invoiceStatus: inv?.status ?? null,
    invoiceArchived: !!inv?.archived_at,
    companyId: p.company_id,
    companyName: company?.company_name ?? null,
    companyArchived: !!company?.archived_at,
    paidAt: p.paid_at,
    failedAt: p.failed_at,
    refundedAt: p.refunded_at,
    notes: p.notes,
    internalNotes: p.internal_notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    archivedAt: p.archived_at,
    archivedBy: p.archived_by,
    isArchived: !!p.archived_at,
    isPending: p.status === 'pending' && !p.archived_at,
  };
}

/** Ordered payments for an invoice's Payments section (includes archived for transparency). */
export async function listPaymentsForInvoice(invoiceId: string): Promise<InvoicePaymentRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('invoice_payments')
    .select('id,amount,currency,status,method,paid_at,created_at,archived_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((p) => ({
    id: p.id,
    amount: num(p.amount),
    currency: p.currency,
    status: p.status,
    method: p.method,
    paidAt: p.paid_at,
    createdAt: p.created_at,
    archivedAt: p.archived_at,
  }));
}

/** Derived payment summary for an invoice (uses the stored, recalc-maintained figures). */
export async function getInvoicePaymentSummary(invoiceId: string): Promise<InvoicePaymentSummary | null> {
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from('invoices')
    .select('total_amount, amount_paid, balance_due')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!inv) return null;
  const { data: pays } = await admin
    .from('invoice_payments')
    .select('amount, status, archived_at')
    .eq('invoice_id', invoiceId);
  const rows = (pays ?? []).map((p) => ({ amount: num(p.amount), status: p.status, archivedAt: p.archived_at }));
  const total = num(inv.total_amount);
  const amountPaid = num(inv.amount_paid); // stored, kept current by recalc
  const balanceDue = num(inv.balance_due);
  return {
    totalAmount: total,
    amountPaid,
    balanceDue,
    overpaid: isOverpaid(total, amountPaid),
    paidCount: rows.filter((r) => r.status === 'succeeded' && !r.archivedAt).length,
    paymentCount: rows.filter((r) => !r.archivedAt).length,
  };
}

/** Non-void, non-archived invoices a payment may be recorded against (P10 picker). */
export async function listInvoiceOptionsForPayment(opts: { companyId?: string } = {}): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  let q = admin
    .from('invoices')
    .select('id, invoice_number, title, status, balance_due, created_at')
    .is('archived_at', null)
    .not('status', 'in', '("void","archived")');
  if (opts.companyId) q = q.eq('company_id', opts.companyId);
  const { data } = await q.order('created_at', { ascending: false }).limit(500);
  return (data ?? []).map((i) => ({ id: i.id, name: `${i.invoice_number} · ${i.title}` }));
}

/** Load one invoice for the prefilled create form (must allow payment). */
export async function getPayableInvoice(invoiceId: string): Promise<
  | { id: string; invoiceNumber: string; status: string; archived: boolean; companyId: string; companyName: string | null; balanceDue: number; currency: string }
  | null
> {
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from('invoices')
    .select('id, invoice_number, status, archived_at, company_id, balance_due, currency')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!inv) return null;
  const { data: company } = await admin.from('companies').select('company_name').eq('id', inv.company_id).maybeSingle();
  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    status: inv.status,
    archived: !!inv.archived_at,
    companyId: inv.company_id,
    companyName: company?.company_name ?? null,
    balanceDue: num(inv.balance_due),
    currency: inv.currency,
  };
}
