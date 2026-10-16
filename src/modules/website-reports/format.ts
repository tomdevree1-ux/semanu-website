import type { WebsiteReportContent } from './schema';

/** Client-safe display helpers for website analysis reports (P14). */

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  fetching: 'Fetching',
  analyzing: 'Analyzing',
  succeeded: 'Generated',
  failed: 'Failed',
  review_needed: 'Review needed',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

export function websiteReportStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatScore(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toFixed(1);
}

export function formatCost(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toFixed(4);
}

const SECTION_ORDER: Array<[keyof WebsiteReportContent, string]> = [
  ['first_impression', 'First impression'],
  ['positioning_message', 'Positioning and message'],
  ['conversion_lead_generation', 'Conversion and lead generation'],
  ['ux_structure', 'UX and structure'],
  ['visual_design_impression', 'Visual and design impression'],
  ['seo_findability', 'SEO and findability'],
  ['performance_technical_impression', 'Performance and technical impression'],
  ['trust_proof', 'Trust and proof'],
  ['mobile_impression', 'Mobile impression'],
  ['commercial_conclusion', 'Commercial conclusion'],
];

/**
 * Deterministically render validated report content to markdown. The model never supplies markdown
 * directly; this builds it from the validated JSON so the stored document is predictable and safe.
 */
export function renderReportMarkdown(c: WebsiteReportContent): string {
  const lines: string[] = [];
  lines.push('# Website analysis report');
  lines.push('');
  lines.push('## Executive summary');
  lines.push(c.executive_summary.trim());
  lines.push('');

  lines.push('## Scorecard');
  const s = c.scorecard;
  const rows: Array<[string, number]> = [
    ['Overall', s.overall],
    ['SEO', s.seo],
    ['UX', s.ux],
    ['Conversion', s.conversion],
    ['Performance', s.performance],
    ['Trust', s.trust],
    ['Content', s.content],
    ['Mobile', s.mobile],
  ];
  lines.push('| Dimension | Score (0–10) |');
  lines.push('| --- | --- |');
  for (const [k, v] of rows) lines.push(`| ${k} | ${v.toFixed(1)} |`);
  lines.push('');

  for (const [key, heading] of SECTION_ORDER) {
    const val = c[key];
    if (typeof val === 'string' && val.trim()) {
      lines.push(`## ${heading}`);
      lines.push(val.trim());
      lines.push('');
    }
  }

  if (c.concrete_improvement_opportunities.length) {
    lines.push('## Concrete improvement opportunities');
    for (const item of c.concrete_improvement_opportunities) lines.push(`- ${item.trim()}`);
    lines.push('');
  }

  if (c.impact_effort_recommendations.length) {
    lines.push('## Impact vs effort recommendations');
    lines.push('| Recommendation | Impact | Effort |');
    lines.push('| --- | --- | --- |');
    for (const r of c.impact_effort_recommendations) {
      lines.push(`| ${r.title.replace(/\|/g, '/')} | ${r.impact} | ${r.effort} |`);
    }
    lines.push('');
    for (const r of c.impact_effort_recommendations) {
      if (r.rationale && r.rationale.trim()) lines.push(`- **${r.title.trim()}** — ${r.rationale.trim()}`);
    }
    lines.push('');
  }

  lines.push('## Internal sales note');
  lines.push('> Staff only. Not part of any customer-facing version.');
  lines.push('');
  lines.push(c.internal_sales_note.trim());
  lines.push('');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
