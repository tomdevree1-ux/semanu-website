import { describe, it, expect } from 'vitest';
import { AI_NATIVE_FAQ, getAiNativeFaq } from '@/content/aiNativeFaq';
import { getServiceDetail } from '@/content/serviceDetail';
import { FAQ_SERVICES } from '@/content/faqServices';

// Guards against German FAQ copy leaking into other locales (the ai-native and
// 3D configurator FAQs were once German in every locale).
const LOCALES = ['nl', 'en', 'de', 'fr', 'es'] as const;
const GERMAN_STOPWORDS = [
  'und', 'oder', 'nicht', 'Sie', 'Ihre', 'Ihr', 'Ihren', 'Ihrem', 'wir', 'der', 'das', 'ist',
  'ein', 'eine', 'einen', 'auf', 'für', 'sich', 'werden', 'können', 'kann', 'Unternehmen',
  'Unternehmenssoftware', 'Konfigurator', 'Offerten', 'Angebote', 'maßgeschneiderte',
];

function germanWords(text: string): string[] {
  const words = text.split(/[^\p{L}]+/u);
  return GERMAN_STOPWORDS.filter((w) => words.includes(w));
}

function faqsFor(locale: (typeof LOCALES)[number]) {
  return {
    'ai-native': getAiNativeFaq(locale),
    '3d-configurators': { title: getServiceDetail(locale, '3d-configurators')!.faqTitle, items: getServiceDetail(locale, '3d-configurators')!.faq },
  };
}

describe('FAQ content is localized', () => {
  for (const loc of LOCALES) {
    for (const [page, faq] of Object.entries(faqsFor(loc))) {
      it(`${loc}/${page} has non-empty questions and answers`, () => {
        expect(faq.title.trim()).not.toBe('');
        expect(faq.items.length).toBeGreaterThanOrEqual(4);
        for (const { q, a } of faq.items) {
          expect(q.trim(), `${loc}/${page} question`).not.toBe('');
          expect(a.trim(), `${loc}/${page} answer to "${q}"`).not.toBe('');
        }
      });
      if (loc !== 'de') {
        it(`${loc}/${page} contains no German`, () => {
          for (const { q, a } of [{ q: faq.title, a: '' }, ...faq.items]) {
            expect(germanWords(`${q} ${a}`), `${loc}/${page}: "${q}"`).toEqual([]);
          }
        });
      }
    }
  }

  it('same number of FAQ items in every locale', () => {
    const ai = LOCALES.map((l) => AI_NATIVE_FAQ[l].items.length);
    const conf = LOCALES.map((l) => getServiceDetail(l, '3d-configurators')!.faq.length);
    expect(new Set(ai).size).toBe(1);
    expect(new Set(conf).size).toBe(1);
  });

  it('the German blocks really are German (sanity check of the detector)', () => {
    expect(germanWords(AI_NATIVE_FAQ.de.items.map((i) => i.a).join(' ')).length).toBeGreaterThan(0);
  });

  it('unknown locale falls back to Dutch', () => {
    expect(getAiNativeFaq('xx')).toBe(AI_NATIVE_FAQ.nl);
  });

  it('FAQ page: same groups and question counts in every locale', () => {
    const shape = (l: (typeof LOCALES)[number]) =>
      FAQ_SERVICES[l].map((g) => `${g.id}:${g.faqs.length}`).join(',');
    for (const l of LOCALES) {
      expect(shape(l), l).toBe(shape('en'));
      expect(FAQ_SERVICES[l].map((g) => g.id)).toEqual([
        '3d-configurators',
        'business-software',
        'working-with-semanu',
      ]);
      for (const g of FAQ_SERVICES[l]) expect(g.faqs.length, `${l}/${g.id}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('FAQ page: no discontinued offers, prices or German leaking into other locales', () => {
    const banned = /webshop|website ?abo|36|google ads|e-?mail ?marketing|gratis|kostenlos|gratuit|free check|consultan|€|chf/i;
    for (const l of LOCALES) {
      for (const g of FAQ_SERVICES[l]) {
        for (const { q, a } of g.faqs) {
          // The 3D configurator FAQ may say a configurator connects to a webshop.
          const text = g.id === '3d-configurators' ? `${q} ${a}`.replace(/webshops?/gi, '') : `${q} ${a}`;
          expect(banned.test(text), `${l}/${g.id}: "${q}"`).toBe(false);
          if (l !== 'de') expect(germanWords(`${q} ${a}`), `${l}/${g.id}: "${q}"`).toEqual([]);
        }
      }
    }
  });

  it('copy rules: no em/en dashes and no comma before a coordinating conjunction', () => {
    const conj: Record<string, RegExp> = {
      nl: /, (en|of|maar|met) /,
      en: /, (and|or|but|with) /,
      fr: /, (et|ou|mais|avec) /,
      es: /, (y|o|pero|con) /,
    };
    for (const loc of ['nl', 'en', 'fr', 'es'] as const) {
      const faqPage = { items: FAQ_SERVICES[loc].flatMap((g) => g.faqs) };
      for (const faq of [...Object.values(faqsFor(loc)), faqPage]) {
        for (const { q, a } of faq.items) {
          const text = `${q} ${a}`;
          expect(/[–—]/.test(text), `${loc} dash: "${q}"`).toBe(false);
          expect(conj[loc].test(text), `${loc} comma before conjunction: "${q}"`).toBe(false);
        }
      }
    }
  });
});
