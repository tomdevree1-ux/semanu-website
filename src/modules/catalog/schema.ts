import { z } from 'zod';

/**
 * Validation for the Products & Services Catalog. Prices are net (ex-VAT), CHF,
 * nullable ("on request"). `code` is an optional SKU, unique case-insensitively
 * (enforced by the DB index; pre-checked in the action).
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const bool = (v: unknown) => v === 'on' || v === 'true' || v === true;

const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(max, 'Too long')
      .refine(NO_ANGLE, 'Please remove the < and > characters')
      .nullable()
      .optional(),
  );

/** CHF amount: blank → null; strings (incl. comma decimals) coerced to a number. */
const optMoney = z.preprocess(
  (v) => {
    if (v === '' || v == null) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(',', '.').trim());
      return Number.isNaN(n) ? v : n;
    }
    return v;
  },
  z.number({ invalid_type_error: 'Enter a valid amount' }).min(0, 'Must be 0 or more').nullable().optional(),
);

export const CATALOG_ITEM_TYPES = ['subscription', 'service', 'addon', 'product'] as const;
export const CATALOG_BILLING_INTERVALS = ['monthly', 'yearly', 'one_time'] as const;

const catalogFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Too long')
    .refine(NO_ANGLE, 'Please remove the < and > characters'),
  code: z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(60, 'Too long')
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, _ or - only')
      .nullable()
      .optional(),
  ),
  description: optStr(5000),
  itemType: z.enum(CATALOG_ITEM_TYPES),
  category: optStr(120),
  basePrice: optMoney,
  currency: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim().toUpperCase() : 'CHF'),
    z.literal('CHF'),
  ),
  priceIsFrom: z.preprocess(bool, z.boolean()).default(false),
  billingInterval: z.enum(CATALOG_BILLING_INTERVALS).default('one_time'),
  setupFee: optMoney,
  isPublic: z.preprocess(bool, z.boolean()).default(false),
};

export const catalogCreateSchema = z.object({ ...catalogFields });
export type CatalogCreateInput = z.infer<typeof catalogCreateSchema>;

export const catalogUpdateSchema = z.object({ ...catalogFields });
export type CatalogUpdateInput = z.infer<typeof catalogUpdateSchema>;

export const catalogStatusChangeSchema = z.object({
  status: z.enum(['draft', 'active', 'inactive']),
});

export type CatalogActionState = { ok?: boolean; error?: string; id?: string };
