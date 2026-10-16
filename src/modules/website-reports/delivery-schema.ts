import { z } from 'zod';

/** Validation for the P15 delivery actions. */
export const deliverReportSchema = z.object({ reportId: z.string().uuid('Invalid report') });
export const deliveryIdSchema = z.object({ id: z.string().uuid('Invalid delivery') });

export const setFollowUpSchema = z.object({
  id: z.string().uuid('Invalid delivery'),
  // accepts a date (YYYY-MM-DD) or datetime string; coerced to a Date.
  at: z.coerce.date({ errorMap: () => ({ message: 'Pick a valid follow up date.' }) }),
});

export type DeliveryActionState = { ok?: boolean; error?: string; id?: string; signedUrl?: string };
