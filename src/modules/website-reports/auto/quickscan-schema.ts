import { z } from 'zod';

/**
 * WAF-4 quickscan content schema + the engine `site` dict builder.
 *
 * The AI returns the analysis CONTENT (Swiss-German, validated here); `buildQuickscanSite` turns it into the
 * exact `site` dict the Python quickscan engine renders (see QUICKSCAN_PLAYBOOK.md section 6) — 8 scores,
 * 9 layers and 8 opportunities as arrays. Pure, no IO, unit-tested.
 */
const score = z.number().min(0).max(10); // rounded to an int in buildQuickscanSite
const scoreOrNull = z.union([z.number().min(0).max(10), z.null()]);
// Accept the three impact/effort labels case-insensitively — the model occasionally varies the casing.
const tag = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const k = v.trim().toLowerCase();
  return k === 'gering' ? 'Gering' : k === 'mittel' ? 'Mittel' : k === 'hoch' ? 'Hoch' : v;
}, z.enum(['Gering', 'Mittel', 'Hoch']));

export const quickscanLayerSchema = z.object({
  title: z.string().min(1).max(160),
  score: scoreOrNull,
  observation: z.string().min(1).max(2000),
  impact: z.string().min(1).max(2000),
  recommendation: z.string().min(1).max(2000),
});

export const quickscanImpSchema = z.object({
  title: z.string().min(1).max(200),
  observation: z.string().min(1).max(2000),
  why: z.string().min(1).max(2000),
  recommendation: z.string().min(1).max(2000),
  impact: tag,
  effort: tag,
});

export const quickscanContentSchema = z.object({
  firma: z.string().min(1).max(200),
  ort: z.string().max(120).default(''),
  beschrijving: z.string().max(300).default(''),
  scores: z.array(score).length(8),
  exec: z.string().min(1).max(4000),
  scorecard: z.string().min(1).max(800),
  algemene: z.string().min(1).max(3000),
  goed: z.array(z.string().min(1).max(500)).min(3).max(8),
  layers: z.array(quickscanLayerSchema).min(8).max(10),
  imps: z.array(quickscanImpSchema).min(6).max(10),
  impact_text: z.string().min(1).max(2500),
  conversie: z.string().min(1).max(2500),
  seo: z.array(z.string().min(1).max(500)).min(2).max(8),
  vertrouwen: z.string().min(1).max(2500),
  roadmap: z.array(z.string().min(1).max(1500)).min(2).max(4),
  conclusie: z.array(z.string().min(1).max(1500)).min(2).max(4),
});
export type QuickscanContent = z.infer<typeof quickscanContentSchema>;

/** The engine `site` dict — layers/imps as arrays (the renderer unpacks them by position). */
export type QuickscanSite = {
  slug: string;
  file: string;
  firma: string;
  meta: string;
  date_str: string;
  scores: number[];
  exec: string;
  scorecard: string;
  algemene: string;
  goed: string[];
  layers: Array<Array<string | number | null>>;
  imps: string[][];
  impact_text: string;
  conversie: string;
  seo: string[];
  vertrouwen: string;
  roadmap: string[];
  conclusie: string[];
};

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'site'
  );
}

const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export function germanDate(d = new Date()): string {
  return `${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`;
}

/** Map validated content -> the engine `site` dict. */
export function buildQuickscanSite(content: QuickscanContent, opts: { domain: string | null }): QuickscanSite {
  const domain = (opts.domain || '').trim();
  const meta = [domain, content.ort, content.beschrijving].map((p) => (p || '').trim()).filter(Boolean).join('  ·  ');
  return {
    slug: slugify(domain || content.firma),
    file: `Website Quickscan - ${content.firma} (DE).pdf`,
    firma: content.firma,
    meta,
    date_str: germanDate(),
    scores: content.scores.map((n) => Math.round(n)),
    exec: content.exec,
    scorecard: content.scorecard,
    algemene: content.algemene,
    goed: content.goed,
    layers: content.layers.map((l) => [l.title, l.score === null ? null : Math.round(l.score), l.observation, l.impact, l.recommendation]),
    imps: content.imps.map((i) => [i.title, i.observation, i.why, i.recommendation, i.impact, i.effort]),
    impact_text: content.impact_text,
    conversie: content.conversie,
    seo: content.seo,
    vertrouwen: content.vertrouwen,
    roadmap: content.roadmap,
    conclusie: content.conclusie,
  };
}

/**
 * Map the 8 quickscan axes (order: Erster Eindruck, Positionierung, Conversion, UX, Visuelles Design, SEO,
 * Vertrauen, Mobile) onto the report's score columns for the list/worklist. score_overall is the average.
 * Axes without a matching column (first impression, positioning) live in report_json only.
 */
export function quickscanScoreColumns(scores: number[]) {
  const [, , conversion, ux, visual, seo, trust, mobile] = scores;
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const r = (n: number) => Math.round(n);
  return {
    score_overall: overall,
    score_conversion: r(conversion),
    score_ux: r(ux),
    score_seo: r(seo),
    score_trust: r(trust),
    score_mobile: r(mobile),
    score_content: r(visual),
    score_performance: null,
  };
}

/** Readable markdown of the report for the in-portal detail view (the PDF stays the real deliverable). */
export function quickscanMarkdown(c: QuickscanContent): string {
  const list = (arr: string[]) => arr.map((x) => `- ${x}`).join('\n');
  const layers = c.layers
    .map((l) => `### ${l.title}${l.score === null ? ' (indikativ)' : ` — ${l.score}/10`}\n**Beobachtung.** ${l.observation}\n\n**Kommerzielle Wirkung.** ${l.impact}\n\n**Empfehlung.** ${l.recommendation}`)
    .join('\n\n');
  const imps = c.imps
    .map((i, n) => `${n + 1}. **${i.title}** — Wirkung: ${i.impact}, Aufwand: ${i.effort}\n   Beobachtung: ${i.observation}\n   Warum: ${i.why}\n   Empfehlung: ${i.recommendation}`)
    .join('\n');
  return [
    `## Executive Summary\n${c.exec}`,
    `## Website Scorecard\n${c.scorecard}`,
    `## Gesamteindruck\n${c.algemene}`,
    `## Was bereits gut funktioniert\n${list(c.goed)}`,
    `## Analyse pro Ebene\n${layers}`,
    `## Wichtigste Verbesserungschancen\n${imps}`,
    `## Wirkung und Aufwand\n${c.impact_text}`,
    `## Conversion Einschätzung\n${c.conversie}`,
    `## SEO und Content Chancen\n${list(c.seo)}`,
    `## Vertrauen und Professionalität\n${c.vertrouwen}`,
    `## Empfohlene Roadmap\n${c.roadmap.join('\n\n')}`,
    `## Kommerzielles Fazit\n${c.conclusie.join('\n\n')}`,
  ].join('\n\n');
}
