import { z } from 'zod';

/**
 * Validation for the Invoices module. Money is CHF, net (ex-VAT), >= 0; quantity
 * > 0. Company is required at create and not editable afterward. Status,
 * invoice_number and computed money (subtotal/total/amount_paid/balance_due/
 * paid_at) are never set through these schemas.
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );

const optUuid = z.preprocess(blankToNull, z.string().uuid('Invalid selection').nullable().optional());
const optDate = z.preprocess(
  blankToNull,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date').nullable().optional(),
);

const toNumber = (fallback: number) => (v: unknown) => {
  if (v === '' || v == null) return fallback;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').trim());
    return Number.isNaN(n) ? v : n;
  }
  return v;
};

/** Money field, default 0, >= 0. */
const money0 = z.preprocess(toNumber(0), z.number({ invalid_type_error: 'Enter a valid amount' }).min(0, 'Must be 0 or more'));
/** Quantity, default 1, > 0. */
const quantity = z.preprocess(toNumber(1), z.number({ invalid_type_error: 'Enter a valid quantity' }).gt(0, 'Must be greater than 0'));
const optBillingInterval = z.preprocess(blankToNull, z.enum(['monthly', 'yearly', 'one_time']).nullable().optional());

const title = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Too long')
  .refine(NO_ANGLE, 'Please remove the < and > characters');

export const invoiceCreateSchema = z.object({
  title,
  companyId: z.string().uuid('Choose a company'),
  contactId: optUuid,
  projectId: optUuid,
  quoteId: optUuid,
  dueDate: optDate,
});
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;

export const invoiceFromQuoteSchema = z.object({
  quoteId: z.string().uuid('Choose a quote'),
});

/** Update: editable header fields (NOT company_id, invoice_number, status or computed money). */
export const invoiceUpdateSchema = z.object({
  title,
  contactId: optUuid,
  projectId: optUuid,
  quoteId: optUuid,
  dueDate: optDate,
  notes: optStr(10000),
  internalNotes: optStr(10000),
  discountAmount: money0,
  taxAmount: money0,
});
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

export const invoiceStatusChangeSchema = z.object({
  status: z.enum(['issued', 'paid', 'overdue', 'void']),
});

const itemName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(200, 'Too long')
  .refine(NO_ANGLE, 'Please remove the < and > characters');

export const invoiceItemCreateSchema = z.object({
  catalogItemId: optUuid,
  name: itemName,
  description: optStr(2000),
  quantity,
  unitPrice: money0,
  billingInterval: optBillingInterval,
});
export type InvoiceItemCreateInput = z.infer<typeof invoiceItemCreateSchema>;

export const invoiceItemUpdateSchema = z.object({
  name: itemName,
  description: optStr(2000),
  quantity,
  unitPrice: money0,
  billingInterval: optBillingInterval,
});
export type InvoiceItemUpdateInput = z.infer<typeof invoiceItemUpdateSchema>;

export type InvoiceActionState = { ok?: boolean; error?: string; id?: string };
