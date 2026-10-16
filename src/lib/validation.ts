import { z } from 'zod';

/**
 * Shared validation for the two lead forms. Used both server-side (API route)
 * and client-side (form components, Phase 2) so messages stay consistent.
 *
 * Forms (from the handoff):
 *  - Start modal  : firstname, lastname, email, message?, consent
 *  - Contact form : firstname, lastname, company?, phone?, email, message, lang, consent
 *
 * `website` is a honeypot field — real users never fill it.
 */
const shared = {
  firstname: z.string().trim().min(1, 'required').max(100),
  lastname: z.string().trim().min(1, 'required').max(100),
  email: z.string().trim().min(1, 'required').email('email').max(200),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'consent_required' }),
  }),
  website: z.string().max(0).optional(), // honeypot: must be empty
  turnstileToken: z.string().optional(),
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
};

/** Structured output of the website pricing configurator (client computed). */
export const configuratorPayloadSchema = z.object({
  title: z.string().trim().max(200),
  situation: z.enum(['new', 'existing']),
  monthly: z.number().nonnegative(),
  oneTime: z.number().nonnegative(),
  state: z.record(z.string(), z.unknown()),
  lines: z
    .array(z.object({ key: z.string().max(60), amount: z.number(), per: z.string().max(20) }))
    .max(60),
});
export type ConfiguratorPayload = z.infer<typeof configuratorPayloadSchema>;

export const startLeadSchema = z.object({
  formType: z.literal('start'),
  message: z.string().trim().max(5000).optional(),
  ...shared,
});

export const contactLeadSchema = z.object({
  formType: z.literal('contact'),
  company: z.string().trim().min(1, 'required').max(150),
  phone: z
    .string()
    .trim()
    .min(1, 'required')
    .max(50)
    .regex(/^[0-9+().\/\s-]{6,}$/, 'invalid'),
  message: z.string().trim().min(1, 'required').max(5000),
  lang: z.enum(['de', 'en']).default('de'),
  // Which services the enquiry is about (multi-select on the contact form / ?interest=).
  interests: z
    .array(
      z.enum([
        'websites',
        'email-marketing',
        'marketing-automation',
        'ai-native',
        'booking',
        'business-systems',
        'customer-portals',
        'crm',
        'ai-assistants',
        'not-sure',
      ]),
    )
    .max(9)
    .optional(),
  // Structured pricing configurator payload (optional). When present, the leads
  // endpoint creates a versioned configuration linked to this lead.
  config: configuratorPayloadSchema.optional(),
  ...shared,
});

export const leadSchema = z.discriminatedUnion('formType', [
  startLeadSchema,
  contactLeadSchema,
]);

export type StartLeadInput = z.infer<typeof startLeadSchema>;
export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Checkout (subscribe) form → /api/checkout. Customer picks a base plan (Starter,
 * Business or Webshop) and optionally adds Google Ads and/or the Logo add-on.
 * Software & Applications stays quote-based (routes to /kontakt, not a plan here).
 */
export const checkoutSchema = z.object({
  plan: z.enum(['starter', 'business', 'webshop']),
  addon: z.boolean().default(false), // Logo + brand guidelines (one-time)
  addonGoogleAds: z.boolean().default(false), // Google Ads management (monthly)
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(50).optional(),
  // Optional company website URL (informational; emailed + sent to Stripe metadata).
  companyWebsite: z.string().trim().max(300).optional(),
  // Optional broader-service interests to discuss (does NOT affect price/payment).
  interests: z
    .array(
      z.enum([
        'email-marketing',
        'marketing-automation',
        'ai-native',
        'booking',
        'business-systems',
        'ai-assistants',
      ]),
    )
    .max(6)
    .optional(),
  // B2B billing identity. customerType drives whether company fields are required.
  customerType: z.enum(['person', 'company']).default('person'),
  vatNumber: z.string().trim().max(64).optional(), // UID / MWST / VAT (not validated yet)
  billingStreet: z.string().trim().max(200).optional(),
  billingPostalCode: z.string().trim().max(20).optional(),
  billingCity: z.string().trim().max(120).optional(),
  billingCountry: z.string().trim().length(2).optional(), // ISO-3166 alpha-2
  ...shared,
}).superRefine((v, ctx) => {
  // A company order needs a billing identity (name + address) so we can invoice it.
  if (v.customerType === 'company') {
    const required: Array<[string, string | undefined]> = [
      ['company', v.company],
      ['billingStreet', v.billingStreet],
      ['billingPostalCode', v.billingPostalCode],
      ['billingCity', v.billingCity],
    ];
    for (const [path, val] of required) {
      if (!val || !val.trim()) ctx.addIssue({ code: 'custom', message: 'required', path: [path] });
    }
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Public website funnel / lead-magnet submission → /api/funnels/submit (P13). NOTE: `website` is a REAL
 * field (the site to analyse), so the honeypot is the separate `companyUrl` field (must be empty). Never
 * trust client status/owner/CRM-link fields — they are not part of this schema.
 */
export const funnelSubmitSchema = z
  .object({
    sourceType: z
      .enum(['website_analysis', 'website_cost_calculator', 'strategy_call', 'maintenance_security_scan'])
      .default('website_analysis'),
    firstName: z.string().trim().min(1, 'required').max(100),
    lastName: z.string().trim().min(1, 'required').max(100),
    email: z.string().trim().min(1, 'required').email('email').max(200),
    website: z.string().trim().max(300).optional(), // real field (the website to analyse)
    consentPrivacy: z.literal(true, { errorMap: () => ({ message: 'consent_required' }) }),
    consentMarketing: z.boolean().optional().default(false),
    companyUrl: z.string().max(0).optional(), // honeypot — must be empty (distinct from the real `website`)
    turnstileToken: z.string().optional(),
    locale: z.enum(['de', 'fr', 'en', 'es', 'nl']).optional(),
    utmSource: z.string().trim().max(200).optional(),
    utmMedium: z.string().trim().max(200).optional(),
    utmCampaign: z.string().trim().max(200).optional(),
    utmTerm: z.string().trim().max(200).optional(),
    utmContent: z.string().trim().max(200).optional(),
    referrer: z.string().trim().max(500).optional(),
    pagePath: z.string().trim().max(300).optional(),
    payload: z.record(z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])).optional().default({}),
  })
  .superRefine((v, ctx) => {
    if (v.sourceType === 'website_analysis' && (!v.website || !v.website.trim())) {
      ctx.addIssue({ code: 'custom', message: 'required', path: ['website'] });
    }
  });

export type FunnelSubmitInput = z.infer<typeof funnelSubmitSchema>;
