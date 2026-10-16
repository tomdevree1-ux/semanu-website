import { z } from 'zod';
import { FUNNEL_STATUSES } from './status';

/** Validation for the PORTAL funnel actions (the public ingest uses `funnelSubmitSchema` in validation.ts). */
const NO_ANGLE = (v: string) => !v.includes('<') && !v.includes('>');
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, 'Too long').refine(NO_ANGLE, 'Please remove the < and > characters').nullable().optional(),
  );
const optUuid = z.preprocess(blankToNull, z.string().uuid('Invalid selection').nullable().optional());

export const funnelIdSchema = z.object({ id: z.string().uuid('Invalid submission') });

export const funnelStatusSchema = z.object({
  id: z.string().uuid('Invalid submission'),
  status: z.enum(FUNNEL_STATUSES),
});

export const funnelNotesSchema = z.object({
  notes: optStr(10000),
  internalNotes: optStr(10000),
});

export const funnelAssignSchema = z.object({
  id: z.string().uuid('Invalid submission'),
  ownerId: optUuid,
});

export const funnelLinkContactSchema = z.object({
  id: z.string().uuid('Invalid submission'),
  contactId: z.string().uuid('Invalid contact'),
});

export const funnelLinkCompanySchema = z.object({
  id: z.string().uuid('Invalid submission'),
  companyId: z.string().uuid('Invalid company'),
});

export const funnelCreateContactSchema = z.object({
  id: z.string().uuid('Invalid submission'),
  companyId: z.string().uuid('Pick a company first'),
});

export type FunnelActionState = { ok?: boolean; error?: string; id?: string };
