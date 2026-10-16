/**
 * Website-funnel submission status model (P13). Flexible, staff-driven (no strict transition machine).
 * `analyzed`/`report_sent` are reserved for P14/P15. `spam_status` is separate from the workflow status.
 * The semantic token mapping lives in `@/lib/status/colors` (`funnelStatusToken`); the StatusBadge entity
 * is `'funnel'`.
 */
export const FUNNEL_SOURCE_TYPES = [
  'website_analysis',
  'website_cost_calculator',
  'strategy_call',
  'maintenance_security_scan',
] as const;
export type FunnelSourceTypeValue = (typeof FUNNEL_SOURCE_TYPES)[number];

export const FUNNEL_STATUSES = [
  'new',
  'to_review',
  'qualified',
  'in_progress',
  'analyzed',
  'report_sent',
  'contacted',
  'follow_up_planned',
  'converted',
  'closed_not_relevant',
  'archived',
] as const;
export type FunnelStatusValue = (typeof FUNNEL_STATUSES)[number];

/** Statuses a staff member may set from the status editor (archive/restore are dedicated actions). */
export const FUNNEL_EDITABLE_STATUSES = FUNNEL_STATUSES.filter((s) => s !== 'archived');

export const FUNNEL_SPAM_STATUSES = ['pending', 'ham', 'suspected', 'spam'] as const;
export type FunnelSpamStatusValue = (typeof FUNNEL_SPAM_STATUSES)[number];
