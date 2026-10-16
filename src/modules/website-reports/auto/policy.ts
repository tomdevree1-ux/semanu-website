/**
 * WAF-4 auto-generation policy — PURE logic, no IO (unit tested).
 *
 * Decides whether a funnel submission may trigger an automatic website-report generation. The cost wall is
 * the global daily cap; per-domain dedup prevents re-analysing the same site (and re-spending) within the
 * recency window. `decideAutoGeneration` is evaluated at the WORKER, immediately before any AI spend, so the
 * cap reflects reports already generated today. `shouldEnqueueAutoGeneration` is the cheap, context-free
 * pre-check used at submit time (before the job row exists).
 */

export type AutoGenSkipReason =
  | 'disabled'
  | 'not_website_analysis'
  | 'no_website'
  | 'duplicate_domain'
  | 'daily_cap_reached';

export type AutoGenDecision = { allowed: true } | { allowed: false; reason: AutoGenSkipReason };

/** Number of days a freshly generated report for a domain suppresses a new auto-generation for that domain. */
export const AUTO_DEDUP_WINDOW_DAYS = 30;

export function decideAutoGeneration(input: {
  enabled: boolean;
  sourceType: string;
  hasWebsiteUrl: boolean;
  domainHasRecentReport: boolean;
  todayAutoCount: number;
  dailyCap: number;
}): AutoGenDecision {
  if (!input.enabled) return { allowed: false, reason: 'disabled' };
  if (input.sourceType !== 'website_analysis') return { allowed: false, reason: 'not_website_analysis' };
  if (!input.hasWebsiteUrl) return { allowed: false, reason: 'no_website' };
  if (input.domainHasRecentReport) return { allowed: false, reason: 'duplicate_domain' };
  if (input.todayAutoCount >= input.dailyCap) return { allowed: false, reason: 'daily_cap_reached' };
  return { allowed: true };
}

/** Cheap pre-check at enqueue time: only the context-free gates (flag + source + a website to analyse). */
export function shouldEnqueueAutoGeneration(input: {
  enabled: boolean;
  sourceType: string;
  hasWebsiteUrl: boolean;
}): boolean {
  return input.enabled && input.sourceType === 'website_analysis' && input.hasWebsiteUrl;
}
