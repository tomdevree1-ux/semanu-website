import { z } from 'zod';

/**
 * Validation for the Payment-links module (P11). Generation takes only the invoice
 * id — the amount is the invoice's `balance_due` snapshotted server-side (never a
 * client value). Only notes are user-editable.
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );

export const linkCreateSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice'),
});

export const linkNotesSchema = z.object({
  notes: optStr(10000),
  internalNotes: optStr(10000),
});
export type LinkNotesInput = z.infer<typeof linkNotesSchema>;

export type PaymentLinkActionState = { ok?: boolean; error?: string; id?: string };
