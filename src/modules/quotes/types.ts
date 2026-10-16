import type { Database, QuoteStatus } from '@/lib/types/database';

/** Rows from public.quotes / public.quote_items (Ring D). */
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type { QuoteStatus };

/** One row in the quotes list. */
export type QuoteListRow = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  companyId: string;
  companyName: string | null;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** One line item (ordered). */
export type QuoteLineRow = {
  id: string;
  catalogItemId: string | null;
  position: number;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  billingInterval: string | null;
  lineSubtotal: number;
  lineTotal: number;
};

/** The quote detail view. */
export type QuoteDetail = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  companyId: string;
  companyName: string | null;
  companyArchived: boolean;
  contactId: string | null;
  contactName: string | null;
  contactArchived: boolean;
  projectId: string | null;
  projectName: string | null;
  projectArchived: boolean;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
  items: QuoteLineRow[];
};
