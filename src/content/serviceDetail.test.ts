import { describe, it, expect } from 'vitest';
import { SERVICE_SLUGS, serviceBySlug } from '@/content/services';
import { FLOW_BY_ID, getServiceDetail } from '@/content/serviceDetail';

const LOCALES = ['en', 'de', 'fr', 'es', 'nl'] as const;
const IDS = ['consultancy', 'marketing-automation', 'business-systems', '3d-configurators'];
// Services that render the Flow 3 "hub" signature (centre + >=5 module labels).
const HUB_IDS = ['business-systems'];

describe('service pages data completeness', () => {
  it('flow map + slugs cover all services', () => {
    expect(SERVICE_SLUGS.length).toBe(IDS.length);
    for (const id of IDS) expect(FLOW_BY_ID[id]).toBeTruthy();
  });
  for (const loc of LOCALES) {
    for (const id of IDS) {
      it(`${loc}/${id} has complete detail`, () => {
        const d = getServiceDetail(loc, id)!;
        expect(d).toBeTruthy();
        for (const k of ['metaTitle', 'metaDescription', 'ogDescription', 'heroHeadline', 'heroSub', 'engineTitle', 'engineText', 'buildsTitle', 'useCasesTitle', 'processTitle', 'outcomesTitle', 'faqTitle', 'finalTitle', 'finalText', 'finalCta', 'finalSecondaryLabel', 'finalSecondaryHref', 'visualCaption']) {
          expect(Boolean((d as Record<string, unknown>)[k]), `${loc}/${id}.${k}`).toBe(true);
        }
        expect(d.trust.length).toBeGreaterThanOrEqual(3);
        expect(d.problemCards.length).toBe(3);
        expect(d.useCases.length).toBeGreaterThanOrEqual(3);
        expect(d.process.length).toBe(4);
        expect(d.faq.length).toBeGreaterThanOrEqual(4);
        if (HUB_IDS.includes(id)) { expect(d.visual.length).toBeGreaterThanOrEqual(5); expect(d.hubCenter).toBeTruthy(); }
        else expect(d.visual.length).toBeGreaterThanOrEqual(5);
      });
    }
  }
  it('serviceBySlug resolves every slug in every locale with base data', () => {
    for (const loc of LOCALES) for (const slug of SERVICE_SLUGS) {
      const f = serviceBySlug(loc, slug);
      expect(f, `${loc}/${slug}`).toBeTruthy();
      expect(f!.service.builds.length).toBeGreaterThan(0);
      expect(f!.service.benefits.length).toBeGreaterThan(0);
      expect(f!.service.audience.length).toBeGreaterThan(0);
    }
  });
});
