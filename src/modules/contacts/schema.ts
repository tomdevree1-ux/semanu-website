import { z } from 'zod';

/**
 * Validation for the CRM contacts module. A contact always belongs to one
 * company (company_id required — decision P5-D3). The company link is set at
 * creation and is not editable in P5.
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

const isPrimary = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).default(false);

/** Editable contact fields (shared by create + update). */
const contactFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Too long')
    .refine(NO_ANGLE, 'Please remove the < and > characters'),
  email: optEmail,
  phone: optStr(50),
  role: optStr(120),
  isPrimary,
};

export const contactCreateSchema = z.object({
  companyId: z.string().uuid('Choose a company'),
  ...contactFields,
});
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

export const contactUpdateSchema = z.object({ ...contactFields });
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

export const contactStatusChangeSchema = z.object({
  status: z.enum(['lead', 'qualified', 'active', 'dormant', 'blocked']),
});

export type ContactActionState = { ok?: boolean; error?: string; id?: string };
