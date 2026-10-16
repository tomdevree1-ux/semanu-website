import { z } from 'zod';

/**
 * Validation for the CRM companies module. Editable fields only — the
 * prospecting columns (lead_status, source pipeline, import/scan) are never
 * written here. `source` is forced to 'manual' on create in the action.
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

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

const optEmail = z.preprocess(
  blankToNull,
  z.string().trim().toLowerCase().email('Enter a valid email address').max(200).nullable().optional(),
);

export const COMPANY_LANGUAGES = ['de', 'fr', 'it', 'en'] as const;
const optLang = z.preprocess(blankToNull, z.enum(COMPANY_LANGUAGES).nullable().optional());

const country = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim().toUpperCase() : 'CH'),
  z.string().length(2, 'Use a 2 letter country code'),
);

export const companyCreateSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Too long')
    .refine(NO_ANGLE, 'Please remove the < and > characters'),
  domain: optStr(255),
  websiteUrl: optStr(500),
  email: optEmail,
  phone: optStr(50),
  city: optStr(120),
  canton: optStr(120),
  country,
  language: optLang,
  industry: optStr(120),
  notes: optStr(5000),
});
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;

/** Update adds the owner / account-manager assignment (status/archive are separate). */
export const companyUpdateSchema = companyCreateSchema.extend({
  ownerId: z.preprocess(blankToNull, z.string().uuid('Invalid owner').nullable().optional()),
});
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

/** Status values selectable via the generic status control (no `archived`). */
export const companyStatusChangeSchema = z.object({
  status: z.enum(['lead', 'qualified', 'active', 'dormant', 'lost', 'blocked']),
});

/** Action result for useActionState. `id` lets create flows redirect. */
export type CompanyActionState = { ok?: boolean; error?: string; id?: string };
