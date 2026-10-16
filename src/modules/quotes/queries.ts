import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { QuoteListRow, QuoteDetail, QuoteLineRow } from './types';

/**
 * SERVER ONLY quote reads (service-role; callers gate with
 * requirePermission('quotes.read')). Default lists hide archived. Numeric money
 * is coerced to numbers defensively.
 */

const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;
const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'archived'];

export type QuoteFilters = { q?: string; status?: string; companyId?: string; showArchived?: boolean; page?: number };

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

export async function listQuotes(
  filters: QuoteFilters,
): Promise<{ rows: QuoteListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('quotes')
    .select('id,quote_number,title,status,company_id,total_amount,currency,valid_until,updated_at,archived_at', {
      count: 'exact',
    });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.companyId) q = q.eq('company_id', filters.companyId);

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`quote_number.ilike.%${s}%,title.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const names = await resolveCompanyNames(admin, list.map((x) => x.company_id));
  const rows: QuoteListRow[] = list.map((x) => ({
    id: x.id,
    quoteNumber: x.quote_number,
    title: x.title,
    status: x.status,
    companyId: x.company_id,
    companyName: names.get(x.company_id) ?? null,
    totalAmount: num(x.total_amount),
    currency: x.currency,
    validUntil: x.valid_until,
    updatedAt: x.updated_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getQuote(id: string): Promise<QuoteDetail | null> {
  const admin = createAdminClient();
  const { data: qr } = await admin.from('quotes').select('*').eq('id', id).maybeSingle();
  if (!qr) return null;

  // After the quote row is known, these four reads are mutually independent
  // (they only use FK ids/fields from `qr`), so run them in one round-trip.
  const [{ data: company }, { data: ct }, { data: pj }, { data: itemRows }] = await Promise.all([
    admin.from('companies').select('company_name, archived_at').eq('id', qr.company_id).maybeSingle(),
    qr.contact_id
      ? admin.from('company_contacts').select('name, email, archived_at').eq('id', qr.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    qr.project_id
      ? admin.from('projects').select('name, archived_at').eq('id', qr.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from('quote_items')
      .select('id,catalog_item_id,position,name,description,quantity,unit_price,billing_interval,line_subtotal,line_total')
      .eq('quote_id', id)
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

  const items: QuoteLineRow[] = (itemRows ?? []).map((it) => ({
    id: it.id,
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
    id: qr.id,
    quoteNumber: qr.quote_number,
    title: qr.title,
    status: qr.status,
    companyId: qr.company_id,
    companyName: company?.company_name ?? null,
    companyArchived: !!company?.archived_at,
    contactId: qr.contact_id,
    contactName,
    contactArchived,
    projectId: qr.project_id,
    projectName,
    projectArchived,
    currency: qr.currency,
    subtotal: num(qr.subtotal),
    discountAmount: num(qr.discount_amount),
    taxAmount: num(qr.tax_amount),
    totalAmount: num(qr.total_amount),
    validUntil: qr.valid_until,
    notes: qr.notes,
    internalNotes: qr.internal_notes,
    createdAt: qr.created_at,
    updatedAt: qr.updated_at,
    archivedAt: qr.archived_at,
    archivedBy: qr.archived_by,
    isArchived: !!qr.archived_at,
    items,
  };
}

/** Non-archived contacts for the quote's company. */
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

/** Non-archived projects for the quote's company. */
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
