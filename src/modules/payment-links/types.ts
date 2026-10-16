import type { Database, PaymentLinkStatus } from '@/lib/types/database';

/** Rows from public.invoice_payment_links (Ring D, P11). */
export type PaymentLink = Database['public']['Tables']['invoice_payment_links']['Row'];
export type { PaymentLinkStatus };

/** One row in the payment-links list. */
export type PaymentLinkListRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  invoiceId: string;
  invoiceNumber: string | null;
  companyId: string;
  companyName: string | null;
  hasUrl: boolean;
  createdAt: string;
  expiresAt: string | null;
  archivedAt: string | null;
};

/** The payment-link detail view. */
export type PaymentLinkDetail = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerCheckoutSessionId: string | null;
  providerPaymentLinkId: string | null;
  providerPaymentIntentId: string | null;
  url: string | null;
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  invoiceArchived: boolean;
  invoiceBalanceDue: number;
  companyId: string;
  companyName: string | null;
  companyArchived: boolean;
  invoicePaymentId: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
  isActive: boolean;
  isStale: boolean;
};

/** One payment-link row shown inside the invoice detail section. */
export type InvoiceLinkRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  url: string | null;
  createdAt: string;
  expiresAt: string | null;
  archivedAt: string | null;
  isStale: boolean;
};
