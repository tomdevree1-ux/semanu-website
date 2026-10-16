import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { linkIsStale } from './guards';
import type { PaymentLinkListRow, PaymentLinkDetail, InvoiceLinkRow } from './types';

/**
 * SERVER ONLY payment-link reads (service-role; callers gate with
 * requirePermission('payment_links.read')). Default lists hide archived.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['draft', 'active', 'paid', 'expired', 'cancelled', 'failed', 'archived'];

export type PaymentLinkFilters = { q?: string; status?: string; companyId?: string; invoiceId?: string; showArchived?: boolean; page?: number };

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

export async function listPaymentLinks(
  filters: PaymentLinkFilters,
): Promise<{ rows: PaymentLinkListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('invoice_payment_links')
    .select('id,amount,currency,status,provider,invoice_id,company_id,url,created_at,expires_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);
  if (filters.invoiceId) q = q.eq('invoice_id', filters.invoiceId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`provider_checkout_session_id.ilike.%${s}%,provider_payment_intent_id.ilike.%${s}%,notes.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [names, invNums] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id)),
    resolveInvoiceNumbers(admin, list.map((x) => x.invoice_id)),
  ]);
  const rows: PaymentLinkListRow[] = list.map((x) => ({
    id: x.id,
    amount: num(x.amount),
    currency: x.currency,
    status: x.status,
    provider: x.provider,
    invoiceId: x.invoice_id,
    invoiceNumber: invNums.get(x.invoice_id) ?? null,
    companyId: x.company_id,
    companyName: names.get(x.company_id) ?? null,
    hasUrl: !!x.url,
    createdAt: x.created_at,
    expiresAt: x.expires_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getPaymentLink(id: string): Promise<PaymentLinkDetail | null> {
  const admin = createAdminClient();
  const { data: l } = await admin.from('invoice_payment_links').select('*').eq('id', id).maybeSingle();
  if (!l) return null;

  // The invoice and company reads are independent (both keyed off `l`), so run them concurrently.
  const [{ data: inv }, { data: company }] = await Promise.all([
    admin.from('invoices').select('invoice_number, status, archived_at, balance_due').eq('id', l.invoice_id).maybeSingle(),
    admin.from('companies').select('company_name, archived_at').eq('id', l.company_id).maybeSingle(),
  ]);

  const invoiceBalanceDue = num(inv?.balance_due);
  return {
    id: l.id,
    amount: num(l.amount),
    currency: l.currency,
    status: l.status,
    provider: l.provider,
    providerCheckoutSessionId: l.provider_checkout_session_id,
    providerPaymentLinkId: l.provider_payment_link_id,
    providerPaymentIntentId: l.provider_payment_intent_id,
    url: l.url,
    invoiceId: l.invoice_id,
    invoiceNumber: inv?.invoice_number ?? null,
    invoiceStatus: inv?.status ?? null,
    invoiceArchived: !!inv?.archived_at,
    invoiceBalanceDue,
    companyId: l.company_id,
    companyName: company?.company_name ?? null,
    companyArchived: !!company?.archived_at,
    invoicePaymentId: l.invoice_payment_id,
    expiresAt: l.expires_at,
    paidAt: l.paid_at,
    cancelledAt: l.cancelled_at,
    failedAt: l.failed_at,
    notes: l.notes,
    internalNotes: l.internal_notes,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    archivedAt: l.archived_at,
    archivedBy: l.archived_by,
    isArchived: !!l.archived_at,
    isActive: l.status === 'active' && !l.archived_at,
    isStale: l.status === 'active' && linkIsStale(num(l.amount), invoiceBalanceDue),
  };
}

/** Links for an invoice's detail section, with stale flags vs the current balance. */
export async function listPaymentLinksForInvoice(invoiceId: string): Promise<InvoiceLinkRow[]> {
  const admin = createAdminClient();
  const { data: inv } = await admin.from('invoices').select('balance_due').eq('id', invoiceId).maybeSingle();
  const balance = num(inv?.balance_due);
  const { data } = await admin
    .from('invoice_payment_links')
    .select('id,amount,currency,status,url,created_at,expires_at,archived_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((l) => ({
    id: l.id,
    amount: num(l.amount),
    currency: l.currency,
    status: l.status,
    url: l.url,
    createdAt: l.created_at,
    expiresAt: l.expires_at,
    archivedAt: l.archived_at,
    isStale: l.status === 'active' && linkIsStale(num(l.amount), balance),
  }));
}

/** Summary for the invoice detail: the current active link (if any) + counts. */
export async function getInvoicePaymentLinkSummary(
  invoiceId: string,
): Promise<{ activeLink: InvoiceLinkRow | null; linkCount: number }> {
  const rows = await listPaymentLinksForInvoice(invoiceId);
  const activeLink = rows.find((r) => r.status === 'active' && !r.archivedAt) ?? null;
  return { activeLink, linkCount: rows.filter((r) => !r.archivedAt).length };
}
