import { z } from 'zod';

/**
 * Shared validation for the public lead forms. Used both server-side (the
 * /api/leads route) and client-side (form components) so messages stay
 * consistent. Both forms are forwarded server side to the SEMANU edge function
 * submit-contact, which creates company + person + card on the leads board.
 *
 * `website` (contact form) and `companyUrl` (analysis form) are honeypots.
 */

/** Service ids a visitor can tick on the contact form (internal service ids). */
export const CONTACT_INTERESTS = [
  'consultancy',
  'marketing-automation',
  'business-systems',
  '3d-configurators',
  'ai-native',
  'not-sure',
] as const;
export type ContactInterest = (typeof CONTACT_INTERESTS)[number];

/** Correspondence languages the SEMANU back end supports. */
export const CONTACT_LANGS = ['nl', 'en', 'de', 'fr'] as const;

const attribution = {
  sourceLocale: z.enum(['de', 'fr', 'en', 'es', 'nl']).optional(),
  // Last-touch marketing attribution (optional; captured client-side from the URL).
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
  gclid: z.string().trim().max(400).optional(),
  referrer: z.string().trim().max(500).optional(),
  pagePath: z.string().trim().max(300).optional(),
  turnstileToken: z.string().optional(),
  /** Epoch ms when the form was rendered (time trap in submit-contact). */
  renderedAt: z.number().int().nonnegative().optional(),
};

export const contactLeadSchema = z.object({
  formType: z.literal('contact'),
  firstname: z.string().trim().min(1, 'required').max(100),
  lastname: z.string().trim().min(1, 'required').max(100),
  email: z.string().trim().min(1, 'required').email('email').max(200),
  company: z.string().trim().min(1, 'required').max(150),
  phone: z
    .string()
    .trim()
    .min(1, 'required')
    .max(50)
    .regex(/^[0-9+().\/\s-]{6,}$/, 'invalid'),
  message: z.string().trim().min(1, 'required').max(4000),
  lang: z.enum(CONTACT_LANGS).default('nl'),
  // Which services the enquiry is about (multi-select on the contact form / ?interest=).
  interests: z.array(z.enum(CONTACT_INTERESTS)).max(CONTACT_INTERESTS.length).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent_required' }) }),
  website: z.string().max(0).optional(), // honeypot: must be empty
  ...attribution,
});

/**
 * Website analysis request (lead magnet on /website-analyse). `website` is the
 * REAL field (the site to analyse), so the honeypot is `companyUrl`.
 */
export const analysisLeadSchema = z.object({
  formType: z.literal('analysis'),
  firstName: z.string().trim().min(1, 'required').max(100),
  lastName: z.string().trim().min(1, 'required').max(100),
  email: z.string().trim().min(1, 'required').email('email').max(200),
  website: z.string().trim().min(1, 'required').max(300),
  consentPrivacy: z.literal(true, { errorMap: () => ({ message: 'consent_required' }) }),
  consentMarketing: z.boolean().optional().default(false),
  companyUrl: z.string().max(0).optional(), // honeypot: must be empty
  ...attribution,
});

export const leadSchema = z.discriminatedUnion('formType', [contactLeadSchema, analysisLeadSchema]);

export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type AnalysisLeadInput = z.infer<typeof analysisLeadSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
