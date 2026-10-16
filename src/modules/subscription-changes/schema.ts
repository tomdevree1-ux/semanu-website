import { z } from 'zod';

/**
 * Validation for the Subscription-changes module (P12B1 — request + preview ONLY). No execution
 * inputs exist. Per-action payload requirements are enforced in a superRefine; the amount/proration
 * are computed by Stripe at preview time, never trusted from the client.
 */
export const CHANGE_ACTIONS = [
  'change_plan',
  'change_quantity',
  'cancel_at_period_end',
  'undo_cancel_at_period_end',
  'cancel_immediately',
  'pause_collection',
  'resume_collection',
] as const;
export type ChangeAction = (typeof CHANGE_ACTIONS)[number];

export const PRORATION_BEHAVIORS = ['create_prorations', 'none', 'always_invoice'] as const;

const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );

export const createChangeRequestSchema = z
  .object({
    customerSubscriptionId: z.string().uuid('Invalid subscription'),
    actionType: z.enum(CHANGE_ACTIONS),
    targetPlanKey: optStr(64),
    targetPriceId: z.preprocess(
      blankToNull,
      z.string().trim().regex(/^price_[A-Za-z0-9_]+$/, 'Invalid Stripe price id').nullable().optional(),
    ),
    targetQuantity: z.preprocess(blankToNull, z.coerce.number().int().positive('Quantity must be > 0').nullable().optional()),
    prorationBehavior: z.preprocess(blankToNull, z.enum(PRORATION_BEHAVIORS).nullable().optional()),
    subscriptionItemId: optStr(255),
    notes: optStr(10000),
  })
  .superRefine((v, ctx) => {
    if (v.actionType === 'change_plan' && !v.targetPlanKey && !v.targetPriceId) {
      ctx.addIssue({ code: 'custom', message: 'Choose a target plan or Stripe price.', path: ['targetPlanKey'] });
    }
    if (v.actionType === 'change_quantity' && v.targetQuantity == null) {
      ctx.addIssue({ code: 'custom', message: 'Enter a target quantity.', path: ['targetQuantity'] });
    }
  });
export type CreateChangeRequestInput = z.infer<typeof createChangeRequestSchema>;

export const changeRequestIdSchema = z.object({ id: z.string().uuid('Invalid request') });

export const changeRequestNotesSchema = z.object({
  notes: optStr(10000),
  internalNotes: optStr(10000),
});

export type ChangeRequestActionState = { ok?: boolean; error?: string; id?: string };
