import { z } from 'zod';

/**
 * Validation for the Subscriptions module (P12A — read / link / sync). Linking takes an
 * existing Stripe subscription id and optional CRM links; the snapshot fields are fetched
 * server-side from Stripe (never trusted from the client). No mutation inputs exist in P12A
 * (no plan/price/quantity/cancel/pause) — those belong to P12B.
 */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );

const optUuid = z.preprocess(blankToNull, z.string().uuid('Invalid selection').nullable().optional());

/** A Stripe subscription id (`sub_…`). Permissive on the suffix to survive id-format changes. */
const stripeSubscriptionId = z
  .string()
  .trim()
  .regex(/^sub_[A-Za-z0-9_]+$/, 'Enter a valid Stripe subscription id (sub_…)');

/** An optional Stripe customer id (`cus_…`); derived from Stripe when omitted. */
const optStripeCustomerId = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .regex(/^cus_[A-Za-z0-9_]+$/, 'Enter a valid Stripe customer id (cus_…)')
    .nullable()
    .optional(),
);

export const linkSubscriptionSchema = z.object({
  stripeSubscriptionId,
  stripeCustomerId: optStripeCustomerId,
  companyId: optUuid,
  contactId: optUuid,
  customerId: optUuid,
  notes: optStr(10000),
});
export type LinkSubscriptionInput = z.infer<typeof linkSubscriptionSchema>;

export const syncSubscriptionSchema = z.object({ id: z.string().uuid('Invalid subscription') });

export const syncForCustomerSchema = z.object({
  stripeCustomerId: z
    .string()
    .trim()
    .regex(/^cus_[A-Za-z0-9_]+$/, 'Enter a valid Stripe customer id (cus_…)'),
});

export const subscriptionNotesSchema = z.object({
  notes: optStr(10000),
  internalNotes: optStr(10000),
});

export const subscriptionCrmLinksSchema = z.object({
  companyId: optUuid,
  contactId: optUuid,
  customerId: optUuid,
});

export type SubscriptionActionState = { ok?: boolean; error?: string; id?: string };
