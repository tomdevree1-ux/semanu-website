import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InvoiceListRow, InvoiceDetail, InvoiceLineRow } from './types';

/**
 * SERVER ONLY invoice reads (service-role; callers gate with
 * requirePermission('invoices.read')). Default lists hide archived. Numeric money
 * is coerced to numbers defensively.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['draft', 'issued', 'paid', 'overdue', 'void', 'archived'];

export type InvoiceFilters = { q?: string; status?: string; companyId?: string; showArchived?: boolean; page?: number };

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

export async function listInvoices(
  filters: InvoiceFilters,
): Promise<{ rows: InvoiceListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('invoices')
    .select('id,invoice_number,title,status,company_id,total_amount,balance_due,currency,due_date,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`invoice_number.ilike.%${s}%,title.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const names = await resolveCompanyNames(admin, list.map((x) => x.company_id));
  const rows: InvoiceListRow[] = list.map((x) => ({
    id: x.id,
    invoiceNumber: x.invoice_number,
    title: x.title,
    status: x.status,
    companyId: x.company_id,
    companyName: names.get(x.company_id) ?? null,
    totalAmount: num(x.total_amount),
    balanceDue: num(x.balance_due),
    currency: x.currency,
    dueDate: x.due_date,
    updatedAt: x.updated_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const admin = createAdminClient();
  const { data: iv } = await admin.from('invoices').select('*').eq('id', id).maybeSingle();
  if (!iv) return null;

  // After the invoice row is known, these five reads are mutually independent
  // (they only use FK ids/fields from `iv`), so run them in one round-trip.
  const [{ data: company }, { data: ct }, { data: pj }, { data: qz }, { data: itemRows }] = await Promise.all([
    admin.from('companies').select('company_name, archived_at').eq('id', iv.company_id).maybeSingle(),
    iv.contact_id
      ? admin.from('company_contacts').select('name, email, archived_at').eq('id', iv.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    iv.project_id
      ? admin.from('projects').select('name, archived_at').eq('id', iv.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    iv.quote_id
      ? admin.from('quotes').select('quote_number, archived_at').eq('id', iv.quote_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from('invoice_items')
      .select('id,quote_item_id,catalog_item_id,position,name,description,quantity,unit_price,billing_interval,line_subtotal,line_total')
      .eq('invoice_id', id)
      .order('position', { ascending: true }),
  ]);

  let contactName: string | null = null;
  let contactArchived = false;
  if (ct) {
    contactName = ct.name || ct.email || 'Contact';
    contactArchived = !!ct.archived_at;
  }

  let projectName: string | null = null;
  let projectArchived = false;
  if (pj) {
    projectName = pj.name;
    projectArchived = !!pj.archived_at;
  }

  let quoteNumber: string | null = null;
  let quoteArchived = false;
  if (qz) {
    quoteNumber = qz.quote_number;
    quoteArchived = !!qz.archived_at;
  }

  const items: InvoiceLineRow[] = (itemRows ?? []).map((it) => ({
    id: it.id,
    quoteItemId: it.quote_item_id,
    catalogItemId: it.catalog_item_id,
    position: it.position,
    name: it.name,
    description: it.description,
    quantity: num(it.quantity),
    unitPrice: num(it.unit_price),
    billingInterval: it.billing_interval,
    lineSubtotal: num(it.line_subtotal),
    lineTotal: num(it.line_total),
  }));

  return {
    id: iv.id,
    invoiceNumber: iv.invoice_number,
    title: iv.title,
    status: iv.status,
    companyId: iv.company_id,
    companyName: company?.company_name ?? null,
    companyArchived: !!company?.archived_at,
    contactId: iv.contact_id,
    contactName,
    contactArchived,
    projectId: iv.project_id,
    projectName,
    projectArchived,
    quoteId: iv.quote_id,
    quoteNumber,
    quoteArchived,
    currency: iv.currency,
    subtotal: num(iv.subtotal),
    discountAmount: num(iv.discount_amount),
    taxAmount: num(iv.tax_amount),
    totalAmount: num(iv.total_amount),
    amountPaid: num(iv.amount_paid),
    balanceDue: num(iv.balance_due),
    issueDate: iv.issue_date,
    dueDate: iv.due_date,
    paidAt: iv.paid_at,
    notes: iv.notes,
    internalNotes: iv.internal_notes,
    createdAt: iv.created_at,
    updatedAt: iv.updated_at,
    archivedAt: iv.archived_at,
    archivedBy: iv.archived_by,
    isArchived: !!iv.archived_at,
    isDraft: iv.status === 'draft' && !iv.archived_at,
    items,
  };
}

/** Non-archived contacts for the invoice's company. */
export async function listContactOptionsForCompany(companyId: string): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('company_contacts')
    .select('id, name, email, is_primary')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });
  return (data ?? []).map((c) => ({ id: c.id, name: c.name || c.email || 'Contact' }));
}

/** Non-archived projects for the invoice's company. */
export async function listProjectOptionsForCompany(companyId: string): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('projects')
    .select('id, name')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('name', { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.name }));
}

/** Non-archived quotes for the invoice's company (accepted surfaced first). */
export async function listQuoteOptionsForCompany(companyId: string): Promise<Array<{ id: string; name: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('quotes')
    .select('id, quote_number, title, status, created_at')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  const rows = data ?? [];
  rows.sort((a, b) => Number(b.status === 'accepted') - Number(a.status === 'accepted'));
  return rows.map((qz) => ({
    id: qz.id,
    name: `${qz.quote_number} · ${qz.title}${qz.status === 'accepted' ? ' (accepted)' : ''}`,
  }));
}

export type CatalogPickerItem = {
  id: string;
  name: string;
  basePrice: number | null;
  currency: string;
  billingInterval: string;
};

/** Active, non-archived catalog items for the line picker. */
export async function listCatalogPickerItems(): Promise<CatalogPickerItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('catalog_items')
    .select('id, name, base_price, currency, billing_interval')
    .eq('status', 'active')
    .is('archived_at', null)
    .order('name', { ascending: true });
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    basePrice: c.base_price == null ? null : num(c.base_price),
    currency: c.currency,
    billingInterval: c.billing_interval,
  }));
}
