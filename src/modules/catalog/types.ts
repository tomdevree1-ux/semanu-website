import type { Database, CatalogStatus } from '@/lib/types/database';

/** A row from public.catalog_items — the internal catalog master (Ring D). */
export type CatalogItem = Database['public']['Tables']['catalog_items']['Row'];
export type { CatalogStatus };

/** One row in the catalog list. */
export type CatalogListRow = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  itemType: string;
  category: string | null;
  basePrice: number | null;
  currency: string;
  priceIsFrom: boolean;
  billingInterval: string;
  isPublic: boolean;
  updatedAt: string;
  archivedAt: string | null;
};

/** The catalog item detail view. */
export type CatalogItemDetail = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  itemType: string;
  category: string | null;
  basePrice: number | null;
  currency: string;
  priceIsFrom: boolean;
  billingInterval: string;
  setupFee: number | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};
