import type { WebsiteReportContent } from './schema';

/**
 * Pure, client-safe helpers for the website-reports module (P14). The display status collapses the two
 * status fields into one value for the StatusBadge (see colors.websiteReportStatusToken).
 */
export function websiteReportDisplayStatus(r: {
  generation_status: string;
  review_status: string;
  archived_at: string | null;
}): string {
  if (r.archived_at) return 'archived';
  if (r.generation_status !== 'succeeded') return r.generation_status;
  return r.review_status;
}

/** A report is archivable when not already archived. */
export function reportIsArchivable(archivedAt: string | null): boolean {
  return !archivedAt;
}

/**
 * Funnel statuses from which a first successful report may advance the funnel forward to `analyzed`.
 * Excludes anything already analysed or further along (analyzed/report_sent/converted), sales stages
 * (contacted/follow_up_planned) and terminal/archived — so the funnel status is never moved backward.
 */
const ADVANCE_TO_ANALYZED_FROM = new Set(['new', 'to_review', 'qualified', 'in_progress']);
export function shouldAdvanceFunnelToAnalyzed(funnelStatus: string): boolean {
  return ADVANCE_TO_ANALYZED_FROM.has(funnelStatus);
}

/** Round a 0..10 score to one decimal (numeric(4,1)); clamps; null/NaN → null. */
export function roundScore(n: number | null | undefined): number | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  const clamped = Math.max(0, Math.min(10, n));
  return Math.round(clamped * 10) / 10;
}

/** Pull the rounded per-axis scores out of a validated report content scorecard. */
export function scoresFromContent(c: WebsiteReportContent) {
  const s = c.scorecard;
  return {
    score_overall: roundScore(s.overall),
    score_seo: roundScore(s.seo),
    score_ux: roundScore(s.ux),
    score_conversion: roundScore(s.conversion),
    score_performance: roundScore(s.performance),
    score_trust: roundScore(s.trust),
    score_content: roundScore(s.content),
    score_mobile: roundScore(s.mobile),
  };
}
