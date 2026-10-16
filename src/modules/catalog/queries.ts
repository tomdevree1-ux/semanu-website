import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CatalogListRow, CatalogItemDetail } from './types';

/**
 * SERVER ONLY catalog reads (service-role; callers gate with
 * requirePermission('catalog.read')). Default lists hide archived rows at the
 * query layer. Numeric prices are coerced to numbers defensively.
 */

const PAGE_SIZE = 25;
const STATUSES = ['draft', 'active', 'inactive', 'archived'];
const TYPES = ['subscription', 'service', 'addon', 'product'];
const INTERVALS = ['monthly', 'yearly', 'one_time'];

export type CatalogFilters = {
  q?: string;
  status?: string;
  itemType?: string;
  category?: string;
  billingInterval?: string;
  showArchived?: boolean;
  page?: number;
};

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

export async function listCatalogItems(
  filters: CatalogFilters,
): Promise<{ rows: CatalogListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('catalog_items')
    .select(
      'id,name,code,status,item_type,category,base_price,currency,price_is_from,billing_interval,is_public,updated_at,archived_at',
      { count: 'exact' },
    );

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && STATUSES.includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.itemType && TYPES.includes(filters.itemType)) q = q.eq('item_type', filters.itemType);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.billingInterval && INTERVALS.includes(filters.billingInterval)) {
    q = q.eq('billing_interval', filters.billingInterval);
  }

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`name.ilike.%${s}%,code.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`);

  q = q.order('name', { ascending: true }).range(from, to);
  const { data, count } = await q;

  const rows: CatalogListRow[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    status: c.status,
    itemType: c.item_type,
    category: c.category,
    basePrice: num(c.base_price),
    currency: c.currency,
    priceIsFrom: c.price_is_from,
    billingInterval: c.billing_interval,
    isPublic: c.is_public,
    updatedAt: c.updated_at,
    archivedAt: c.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getCatalogItem(id: string): Promise<CatalogItemDetail | null> {
  const admin = createAdminClient();
  const { data: c } = await admin.from('catalog_items').select('*').eq('id', id).maybeSingle();
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description,
    status: c.status,
    itemType: c.item_type,
    category: c.category,
    basePrice: num(c.base_price),
    currency: c.currency,
    priceIsFrom: c.price_is_from,
    billingInterval: c.billing_interval,
    setupFee: num(c.setup_fee),
    isPublic: c.is_public,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    archivedAt: c.archived_at,
    archivedBy: c.archived_by,
    isArchived: !!c.archived_at,
  };
}

/** Distinct non-null categories (non-archived) for the filter dropdown. */
export async function listCatalogCategories(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('catalog_items')
    .select('category')
    .not('category', 'is', null)
    .is('archived_at', null);
  const set = new Set<string>();
  for (const r of data ?? []) if (r.category) set.add(r.category);
  return [...set].sort();
}
