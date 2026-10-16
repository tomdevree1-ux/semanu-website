/**
 * Website analysis report status model (P14 / WAF-2). Two independent fields: a machine
 * `generation_status` pipeline and a staff `review_status` lifecycle. The UI shows one derived badge
 * (see guards.websiteReportDisplayStatus + colors.websiteReportStatusToken).
 */
export const WEBSITE_REPORT_GENERATION_STATUSES = ['queued', 'fetching', 'analyzing', 'succeeded', 'failed'] as const;
export type WebsiteReportGenerationStatusValue = (typeof WEBSITE_REPORT_GENERATION_STATUSES)[number];

export const WEBSITE_REPORT_REVIEW_STATUSES = ['review_needed', 'approved', 'rejected'] as const;
export type WebsiteReportReviewStatusValue = (typeof WEBSITE_REPORT_REVIEW_STATUSES)[number];

/** Score axes (0..10, one decimal). `overall` plus seven dimensions for the radar. */
export const SCORE_AXES = ['overall', 'seo', 'ux', 'conversion', 'performance', 'trust', 'content', 'mobile'] as const;
export type ScoreAxis = (typeof SCORE_AXES)[number];

/** Current prompt version stored on each report (reproducibility). */
export const PROMPT_VERSION = 'wa-report-v1';

/** Safe `error_summary` codes (never raw network/AI detail). */
export const WEBSITE_REPORT_ERROR_CODES = [
  'url_blocked_ssrf',
  'dns_failed',
  'timeout',
  'too_large',
  'bad_content_type',
  'http_error',
  'unreachable',
  'ai_not_configured',
  'ai_invalid_output',
  'ai_request_failed',
  'cost_exceeded',
  'input_too_large',
  'unknown',
] as const;
export type WebsiteReportErrorCode = (typeof WEBSITE_REPORT_ERROR_CODES)[number];
