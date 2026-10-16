import type { CrawlSnapshot, ReportInputContext } from '../types';

/**
 * Prompt wa-report-v1 for the website analysis report (P14). The model is instructed to return a single
 * JSON object matching the report content schema (validated by zod after generation), in the submission
 * language, with 0..10 scores. The report is INTERNAL and is never sent automatically.
 */
export const PROMPT_VERSION = 'wa-report-v1';

const LANGUAGE_NAME: Record<string, string> = { de: 'German', fr: 'French', en: 'English' };

export function buildSystemPrompt(locale: 'de' | 'fr' | 'en'): string {
  const lang = LANGUAGE_NAME[locale] ?? 'German';
  return [
    'You are a senior Swiss web consultant producing an internal website analysis report for the amai team.',
    `Write all human-readable text in ${lang}.`,
    'You are given only safe, pre-extracted data from a single homepage fetch (no scripts, no private data) plus minimal lead context. Base your analysis only on that data and reasonable professional judgement. Do not invent specific metrics you cannot infer. When evidence is thin, say so plainly.',
    'This report is INTERNAL and review-gated. It is not sent to the customer automatically. Keep the internal_sales_note strictly internal (commercial angle, fit, next step).',
    'Scores are 0 to 10 with one decimal, where 10 is excellent.',
    'Return ONE JSON object and nothing else. No markdown, no code fences, no commentary before or after.',
    'The JSON object MUST have exactly these keys:',
    'executive_summary (string), scorecard (object with numeric keys overall, seo, ux, conversion, performance, trust, content, mobile), first_impression, positioning_message, conversion_lead_generation, ux_structure, visual_design_impression, seo_findability, performance_technical_impression, trust_proof, mobile_impression (all strings), concrete_improvement_opportunities (array of strings), impact_effort_recommendations (array of objects with title (string), impact ("low"|"medium"|"high"), effort ("low"|"medium"|"high"), rationale (string)), commercial_conclusion (string), internal_sales_note (string).',
  ].join('\n');
}

export function buildUserPrompt(crawl: CrawlSnapshot, context: ReportInputContext): string {
  const payload = {
    website: { url: context.website_url, domain: context.normalized_domain },
    lead: {
      name: [context.funnel.first_name, context.funnel.last_name].filter(Boolean).join(' ') || null,
      company: context.company?.name ?? null,
    },
    homepage: {
      final_url: crawl.final_url,
      http_status: crawl.http_status,
      title: crawl.title,
      meta_description: crawl.meta_description,
      headings: crawl.headings,
      counts: crawl.counts,
      has_viewport: crawl.has_viewport,
      has_og: crawl.has_og,
      detected_language: crawl.detected_language,
      same_domain_links: crawl.same_domain_links,
      visible_text: crawl.visible_text,
    },
  };
  return [
    'Analyse this website homepage and produce the internal report as specified.',
    'Here is the extracted, safe homepage data and lead context (JSON):',
    JSON.stringify(payload),
  ].join('\n');
}
