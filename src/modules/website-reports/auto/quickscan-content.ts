import 'server-only';
import { getAiProvider, type AiProvider, type AiUsage } from '@/lib/ai/provider';
import { tryParseJson } from '../generate';
import { quickscanContentSchema, type QuickscanContent } from './quickscan-schema';
import type { CrawlSnapshot, ReportInputContext } from '../types';

/**
 * WAF-4 quickscan CONTENT generation (the Swiss-German `site` dict content). Reuses the AI provider; the
 * caller renders the PDF via the external quickscan service. Same cost discipline as P14: one repair retry,
 * the per-report cost cap is enforced by the caller. Returns validated content or a safe reason.
 */
export const QS_PROMPT_VERSION = 'wa-quickscan-v1';
const MAX_OUTPUT_TOKENS = 7000;

const EXEC_DISCLAIMER =
  'Die Bewertungen sind eine fachliche Einschätzung auf Basis sichtbarer Website Elemente, nicht auf Basis von Analytics, Heatmaps oder Labdaten.';

const SYSTEM = [
  'Du bist ein erfahrener Schweizer Website Berater von amai! und schreibst einen kommerziellen Website Quickscan.',
  'Du schreibst ehrlich, klar und nicht zu technisch. Probleme bringst du als Chancen, nie uebertrieben negativ. Erfinde nie Probleme: eine starke Seite bekommt hohe Bewertungen und wenige, nuancierte Chancen.',
  '',
  'SPRACHE: Schweizer Hochdeutsch. Verwende immer "ss" statt "ss". Umlaute ä ö ü sind erlaubt.',
  'STILREGELN (strikt einhalten):',
  '- Keine Bindestriche in zusammengesetzten Woertern. Schreibe Woerter zusammen oder formuliere um (z.B. "Email" nicht "E-Mail", "Webshop", "Onlineshop").',
  '- Kein Komma vor einem nebenordnenden Bindewort: nie ", und" / ", oder" / ", aber" / ", mit" / ", denn" / ", sondern". In Aufzaehlungen also "A, B und C".',
  '- Technische Tokens duerfen Sonderzeichen behalten: og:image, x-default, JSON-LD, maximum-scale=1, aria-label, GA4, DE/FR/EN.',
  '',
  'BEWERTUNG: 8 Kategorien, ganze Zahlen 0 bis 10, in DIESER Reihenfolge:',
  '1 Erster Eindruck, 2 Positionierung, 3 Conversion, 4 UX und Struktur, 5 Visuelles Design, 6 SEO und Inhalt, 7 Vertrauen und Beleg, 8 Mobile Erfahrung.',
  'Sei ehrlich und konsistent mit dem Text. Ein Durchschnitt um 5 ist ein echter Interessent, um 7,5 eine bereits starke Seite.',
  '',
  'STRUKTUR der Ausgabe (NUR ein JSON Objekt, keine Erklaerung, kein Markdown):',
  '{',
  '  "firma": Markenname, "ort": Ort oder "", "beschrijving": kurze Beschreibung der Firma (eine Zeile),',
  '  "scores": [8 ganze Zahlen in obiger Reihenfolge],',
  '  "exec": Eine Zusammenfassung. Nenne die drei auffaelligsten Dinge. Beende den Text EXAKT mit diesem Satz: "' + EXEC_DISCLAIMER + '",',
  '  "scorecard": eine Zeile wichtigste Schlussfolgerung,',
  '  "algemene": Gesamteindruck, 4 bis 7 Saetze,',
  '  "goed": [4 bis 6 positive Punkte],',
  '  "layers": [GENAU 9 Objekte {title, score, observation, impact, recommendation}], Reihenfolge: Erster Eindruck, Positionierung, Conversion, UX und Struktur, Visuelles Design, SEO und Inhalt, Performance, Vertrauen und Beleg, Mobile Erfahrung. Setze score bei Performance auf null (keine Labmessung).',
  '  "imps": [GENAU 8 Objekte {title, observation, why, recommendation, impact, effort}], impact und effort je aus {"Gering","Mittel","Hoch"}. Waehle die Tags so, dass Quick Wins hohe Wirkung und geringen Aufwand haben.',
  '  "impact_text": Deutung unter der Matrix,',
  '  "conversie": Conversion Einschaetzung. Beende mit dem Hinweis, dass dies auf der sichtbaren Struktur beruht nicht auf Messdaten.',
  '  "seo": [3 bis 5 SEO und Contentchancen],',
  '  "vertrouwen": Vertrauen und Professionalitaet, eine Alinea,',
  '  "roadmap": [GENAU 3 Strings, jeder beginnt mit einem fettgedruckten Label via <b>...</b>: Quick Wins diese Woche, Mittelfristig diesen Monat, Wachstum dieses Quartal],',
  '  "conclusie": [2 bis 3 Strings, kommerzielles Fazit]',
  '}',
  'Verwende keine Markdown Syntax in den Strings (ausser <b>...</b> wo verlangt). Hedge was du nicht sehen konntest (z.B. Performance, hreflang): schreibe "pruefen" statt "fehlt".',
].join('\n');

function buildPrompt(crawl: CrawlSnapshot, ctx: ReportInputContext): string {
  const who = [ctx.company?.name, ctx.contact?.name].filter(Boolean).join(' / ');
  return [
    `Analysiere diese Website und schreibe den Quickscan als JSON.`,
    `Domain: ${ctx.normalized_domain || ctx.website_url}`,
    who ? `Bekannter Kontext: ${who}` : '',
    `Eingereicht von: ${[ctx.funnel.first_name, ctx.funnel.last_name].filter(Boolean).join(' ') || 'unbekannt'} (${ctx.funnel.email}).`,
    '',
    'Sichtbare Website Daten (gekuerzt, server-seitig geholt):',
    '```json',
    JSON.stringify(crawl).slice(0, 26000),
    '```',
  ]
    .filter(Boolean)
    .join('\n');
}

function addUsage(a: AiUsage, b: AiUsage): AiUsage {
  return { input: a.input + b.input, output: a.output + b.output, total: a.total + b.total };
}

export type QuickscanGenDeps = { getProvider?: () => AiProvider };
export type QuickscanGenResult =
  | { ok: true; content: QuickscanContent; usage: AiUsage; cost: number; model: string; provider: string }
  | { ok: false; reason: 'ai_not_configured' | 'ai_request_failed' | 'ai_invalid_output'; detail?: string; usage: AiUsage; cost: number };

export async function generateQuickscanContent(
  crawl: CrawlSnapshot,
  ctx: ReportInputContext,
  deps: QuickscanGenDeps = {},
): Promise<QuickscanGenResult> {
  let provider: AiProvider;
  try {
    provider = deps.getProvider ? deps.getProvider() : getAiProvider();
  } catch {
    return { ok: false, reason: 'ai_not_configured', usage: { input: 0, output: 0, total: 0 }, cost: 0 };
  }

  const userPrompt = buildPrompt(crawl, ctx);
  let usage: AiUsage = { input: 0, output: 0, total: 0 };
  let cost = 0;
  let lastInvalid = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nDeine vorherige Antwort war kein gueltiges JSON nach dem Schema. Gib NUR das korrigierte JSON Objekt zurueck.`;
    let r;
    try {
      r = await provider.generate({ system: SYSTEM, prompt, maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 });
    } catch (e) {
      return { ok: false, reason: 'ai_request_failed', detail: e instanceof Error ? e.message : 'unknown', usage, cost };
    }
    usage = addUsage(usage, r.usage);
    cost += r.costEstimate;
    const parsed = tryParseJson(r.text);
    if (parsed) {
      const val = quickscanContentSchema.safeParse(parsed);
      if (val.success) return { ok: true, content: val.data, usage, cost, model: r.model, provider: r.provider };
      lastInvalid = val.error.issues.slice(0, 4).map((i) => `${i.path.join('.') || '(root)'}:${i.code}`).join('; ');
    } else {
      lastInvalid = `not_json (len ${r.text.length})`;
    }
  }
  return { ok: false, reason: 'ai_invalid_output', detail: lastInvalid || undefined, usage, cost };
}
