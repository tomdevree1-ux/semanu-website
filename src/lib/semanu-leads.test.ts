import { describe, it, expect, beforeEach } from 'vitest';
import { analysisPayload, contactPayload } from '@/lib/semanu-leads';
import { contactLeadSchema, leadSchema } from '@/lib/validation';
import { hitRateLimit, resetRateLimits } from '@/lib/security/memory-ratelimit';

const base = {
  formType: 'contact' as const,
  firstname: 'Anna',
  lastname: 'Peeters',
  email: 'anna@example.be',
  company: 'Peeters BV',
  phone: '+32 3 123 45 67',
  message: 'Wij zoeken een configurator.',
  consent: true as const,
  lang: 'nl' as const,
};

describe('contact form → submit-contact payload', () => {
  it('maps the fields onto the submit-contact contract', () => {
    const d = contactLeadSchema.parse({
      ...base,
      interests: ['3d-configurators', 'consultancy'],
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'kast',
      pagePath: '/nl/kontakt',
      renderedAt: 1000,
    });
    const p = contactPayload(d);
    expect(p.name).toBe('Anna Peeters');
    expect(p.email).toBe('anna@example.be');
    expect(p.company).toBe('Peeters BV');
    expect(p.topic).toBe('configurator');
    expect(p.topic_label).toBe('3D-configurator, Consultancy');
    expect(p.lang).toBe('nl');
    expect(p.utm_source).toBe('google');
    expect(p.utm_campaign).toBe('kast');
    expect(p._ts).toBe(1000);
    expect(p._company_url).toBe('');
    expect(p.message).toContain('Telefoon: +32 3 123 45 67');
    expect(p.message).toContain('site: semanu.eu');
    expect(p.message).toContain('pagina: /nl/kontakt');
    expect(p.message.length).toBeLessThanOrEqual(5000);
  });

  it('business software maps to custom, nothing ticked to the consultancy default', () => {
    expect(contactPayload(contactLeadSchema.parse({ ...base, interests: ['ai-native'] })).topic).toBe('custom');
    expect(contactPayload(contactLeadSchema.parse({ ...base, interests: [] })).topic).toBe('');
  });

  it('falls back to a 5 s old timestamp when the form sent none', () => {
    expect(contactPayload(contactLeadSchema.parse(base), 100_000)._ts).toBe(95_000);
  });

  it('rejects an unknown correspondence language', () => {
    expect(contactLeadSchema.safeParse({ ...base, lang: 'it' }).success).toBe(false);
  });
});

describe('website analysis → submit-contact payload', () => {
  it('carries the website and maps es to en', () => {
    const d = leadSchema.parse({
      formType: 'analysis',
      firstName: 'Jan',
      lastName: 'Smit',
      email: 'jan@example.nl',
      website: 'example.nl',
      consentPrivacy: true,
      sourceLocale: 'es',
    });
    if (d.formType !== 'analysis') throw new Error('wrong branch');
    const p = analysisPayload(d);
    expect(p.topic).toBe('website-analyse');
    expect(p.lang).toBe('en');
    expect(p.message).toContain('example.nl');
  });
});

describe('in-memory rate limit', () => {
  beforeEach(() => resetRateLimits());
  it('allows max hits per window and resets after it', () => {
    for (let i = 0; i < 5; i++) expect(hitRateLimit('k', 5, 60, 0)).toBe(true);
    expect(hitRateLimit('k', 5, 60, 1000)).toBe(false);
    expect(hitRateLimit('k', 5, 60, 61_000)).toBe(true);
  });
});
