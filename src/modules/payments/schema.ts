import { z } from 'zod';

/**
 * Validation for the Payments module (P10). CHF, amount > 0. invoice_id is required
 * at create and not editable afterward; company_id is derived from the invoice (never
 * a form field). status / paid_at / failed_at / refunded_at are never set through
 * these schemas (status flows through changePaymentStatus).
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );

const toNumber = (v: unknown) => {
  if (v === '' || v == null) return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').trim());
    return Number.isNaN(n) ? v : n;
  }
  return v;
};

/** Money amount, > 0 (a payment is always positive). */
const amountPos = z.preprocess(toNumber, z.number({ invalid_type_error: 'Enter a valid amount' }).gt(0, 'Amount must be greater than 0'));

const method = z.preprocess(blankToNull, z.enum(['manual', 'bank_transfer', 'cash', 'card', 'stripe', 'other']).default('manual'));
const provider = z.preprocess(blankToNull, z.enum(['manual', 'stripe', 'bank', 'other']).default('manual'));

export const paymentCreateSchema = z.object({
  invoiceId: z.string().uuid('Choose an invoice'),
  amount: amountPos,
  method,
  provider,
  providerPaymentId: optStr(200),
  providerCheckoutSessionId: optStr(200),
  providerPaymentIntentId: optStr(200),
  notes: optStr(10000),
  internalNotes: optStr(10000),
});
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;

/** Update: editable only while pending (NOT invoice_id, company_id, status, paid_at). */
export const paymentUpdateSchema = z.object({
  amount: amountPos,
  method,
  provider,
  providerPaymentId: optStr(200),
  providerCheckoutSessionId: optStr(200),
  providerPaymentIntentId: optStr(200),
  notes: optStr(10000),
  internalNotes: optStr(10000),
});
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;

export const paymentStatusChangeSchema = z.object({
  status: z.enum(['succeeded', 'failed', 'cancelled', 'refunded', 'pending']),
});

export type PaymentActionState = { ok?: boolean; error?: string; id?: string };
