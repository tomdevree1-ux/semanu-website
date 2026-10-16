import type { Database, PaymentStatus } from '@/lib/types/database';

/** Rows from public.invoice_payments (Ring D, P10). */
export type Payment = Database['public']['Tables']['invoice_payments']['Row'];
export type { PaymentStatus };

/** One row in the payments list. */
export type PaymentListRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  provider: string;
  invoiceId: string;
  invoiceNumber: string | null;
  companyId: string;
  companyName: string | null;
  paidAt: string | null;
  createdAt: string;
  archivedAt: string | null;
};

/** The payment detail view. */
export type PaymentDetail = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  provider: string;
  providerPaymentId: string | null;
  providerCheckoutSessionId: string | null;
  providerPaymentIntentId: string | null;
  legacyPaymentId: string | null;
  paymentLinkId: string | null;
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  invoiceArchived: boolean;
  companyId: string;
  companyName: string | null;
  companyArchived: boolean;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
  isPending: boolean;
};

/** One payment row shown inside the invoice detail Payments section. */
export type InvoicePaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  paidAt: string | null;
  createdAt: string;
  archivedAt: string | null;
};

/** Derived payment summary for an invoice. */
export type InvoicePaymentSummary = {
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  overpaid: boolean;
  paidCount: number;
  paymentCount: number;
};
