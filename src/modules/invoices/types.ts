import type { Database, InvoiceStatus } from '@/lib/types/database';

/** Rows from public.invoices / public.invoice_items (Ring D). */
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type { InvoiceStatus };

/** One row in the invoices list. */
export type InvoiceListRow = {
  id: string;
  invoiceNumber: string;
  title: string;
  status: string;
  companyId: string;
  companyName: string | null;
  totalAmount: number;
  balanceDue: number;
  currency: string;
  dueDate: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** One line item (ordered). */
export type InvoiceLineRow = {
  id: string;
  quoteItemId: string | null;
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

/** The invoice detail view. */
export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
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
  quoteId: string | null;
  quoteNumber: string | null;
  quoteArchived: boolean;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
  isDraft: boolean;
  items: InvoiceLineRow[];
};
