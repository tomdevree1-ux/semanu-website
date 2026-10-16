import { describe, it, expect } from 'vitest';
import {
  buildQuickscanSite,
  quickscanScoreColumns,
  slugify,
  germanDate,
  quickscanContentSchema,
  type QuickscanContent,
} from './quickscan-schema';

const content: QuickscanContent = {
  firma: 'Muster AG',
  ort: 'Bern',
  beschrijving: 'Autoservice und Pneuhandel',
  scores: [6, 5, 4, 6, 6, 4, 5, 7],
  exec: 'Eine solide Seite mit klaren Chancen.',
  scorecard: 'Solide Basis mit Hebel bei Conversion.',
  algemene: 'Sachlich und vertrauenswuerdig.',
  goed: ['Sauberes Logo', 'HTTPS vorhanden', 'Telefon sichtbar', 'Echte Fotos'],
  layers: Array.from({ length: 9 }, (_, i) => ({
    title: 'Ebene ' + i,
    score: i === 6 ? null : 6,
    observation: 'o',
    impact: 'i',
    recommendation: 'r',
  })),
  imps: Array.from({ length: 8 }, (_, i) => ({
    title: 'Chance ' + i,
    observation: 'o',
    why: 'w',
    recommendation: 'r',
    impact: 'Hoch',
    effort: 'Gering',
  })),
  impact_text: 'Quick wins zuerst.',
  conversie: 'Informiert gut.',
  seo: ['Meta Description', 'Eigene Dienstseiten', 'Strukturierte Daten'],
  vertrouwen: 'Ehrlich und gepflegt.',
  roadmap: ['<b>Quick wins.</b> a', '<b>Mittelfristig.</b> b', '<b>Wachstum.</b> c'],
  conclusie: ['Solide Seite.', 'Gewinn bei Conversion.'],
};

describe('buildQuickscanSite', () => {
  it('maps content to the engine site dict (layers/imps as positional arrays)', () => {
    const site = buildQuickscanSite(content, { domain: 'muster.ch' });
    expect(site.scores).toHaveLength(8);
    expect(site.layers).toHaveLength(9);
    expect(site.imps).toHaveLength(8);
    expect(site.layers[0]).toEqual(['Ebene 0', 6, 'o', 'i', 'r']);
    expect(site.layers[6][1]).toBeNull(); // performance score stays indicative (null)
    expect(site.imps[0]).toEqual(['Chance 0', 'o', 'w', 'r', 'Hoch', 'Gering']);
    expect(site.meta).toContain('muster.ch');
    expect(site.meta).toContain('Bern');
    expect(site.file).toContain('Muster AG');
    expect(site.slug).toBe('muster-ch');
  });
});

describe('quickscanScoreColumns', () => {
  it('sets overall=avg, maps the matching axes, performance null', () => {
    const c = quickscanScoreColumns([6, 5, 4, 6, 6, 4, 5, 7]); // avg 5.375 -> 5
    expect(c.score_overall).toBe(5);
    expect(c.score_conversion).toBe(4);
    expect(c.score_ux).toBe(6);
    expect(c.score_seo).toBe(4);
    expect(c.score_trust).toBe(5);
    expect(c.score_mobile).toBe(7);
    expect(c.score_performance).toBeNull();
  });
});

describe('slugify', () => {
  it('lower-cases, strips diacritics + junk, kebab-cases', () => {
    expect(slugify('Müster Garage AG!')).toBe('muster-garage-ag');
    expect(slugify('muster.ch')).toBe('muster-ch');
    expect(slugify('')).toBe('site');
  });
});

describe('germanDate', () => {
  it('formats a German long date', () => {
    expect(germanDate(new Date(2026, 5, 13))).toBe('13. Juni 2026');
  });
});

describe('quickscanContentSchema', () => {
  it('accepts a valid content object', () => {
    expect(quickscanContentSchema.safeParse(content).success).toBe(true);
  });
  it('rejects the wrong number of scores', () => {
    expect(quickscanContentSchema.safeParse({ ...content, scores: [1, 2, 3] }).success).toBe(false);
  });
  it('rejects an invalid impact/effort tag', () => {
    const bad = { ...content, imps: content.imps.map((i, n) => (n === 0 ? { ...i, impact: 'Massive' } : i)) };
    expect(quickscanContentSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects the wrong number of layers', () => {
    expect(quickscanContentSchema.safeParse({ ...content, layers: content.layers.slice(0, 6) }).success).toBe(false);
  });
});
