import { z } from 'zod';

/**
 * Validation for the Projects module. `company_id` is required at create and not
 * editable afterward (P6-D9). `primary_contact_id` is optional; the action
 * enforces that the contact belongs to the project's company (P6-D3).
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

const optUuid = z.preprocess(blankToNull, z.string().uuid('Invalid selection').nullable().optional());
const optDate = z.preprocess(
  blankToNull,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date').nullable().optional(),
);

/** Editable project fields (shared by create + update). */
const projectFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(200, 'Too long')
    .refine(NO_ANGLE, 'Please remove the < and > characters'),
  description: optStr(5000),
  primaryContactId: optUuid,
  ownerId: optUuid,
  startDate: optDate,
  dueDate: optDate,
};

export const projectCreateSchema = z.object({
  companyId: z.string().uuid('Choose a company'),
  ...projectFields,
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

/** Update never changes company_id (P6-D9). */
export const projectUpdateSchema = z.object({ ...projectFields });
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectStatusChangeSchema = z.object({
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']),
});

export type ProjectActionState = { ok?: boolean; error?: string; id?: string };
