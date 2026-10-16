/**
 * Website report delivery status model (P15 / WAF-3). Single `status` lifecycle (the email send is async via
 * the cron worker) plus a separate `follow_up_status`. The StatusBadge entity is `report_delivery`; the token
 * mapping lives in `@/lib/status/colors` (`reportDeliveryStatusToken`).
 */
export const REPORT_DELIVERY_STATUSES = ['queued', 'rendering', 'sending', 'sent', 'failed', 'bounced', 'cancelled'] as const;
export type ReportDeliveryStatusValue = (typeof REPORT_DELIVERY_STATUSES)[number];

export const REPORT_DELIVERY_FOLLOW_UP_STATUSES = ['none', 'planned', 'done'] as const;
export type ReportDeliveryFollowUpStatusValue = (typeof REPORT_DELIVERY_FOLLOW_UP_STATUSES)[number];

/** Display status for the badge: `archived` when archived, else the row status. */
export function reportDeliveryDisplayStatus(r: { status: string; archived_at: string | null }): string {
  return r.archived_at ? 'archived' : r.status;
}

/** Statuses a delivery may be cancelled from (before the worker has sent it). */
export const CANCELLABLE_DELIVERY_STATUSES = new Set(['queued', 'rendering', 'sending']);

/** Funnel statuses from which a successful delivery may advance the funnel forward to `report_sent`. */
export const FUNNEL_ADVANCE_TO_REPORT_SENT_FROM = new Set(['new', 'to_review', 'qualified', 'in_progress', 'analyzed']);

/** Terminal funnel statuses that must never be advanced (forward-only, never change these). */
export const FUNNEL_TERMINAL_STATUSES = new Set(['converted', 'closed_not_relevant', 'archived']);

/** Safe error_summary codes (never raw provider/storage detail). */
export const DELIVERY_ERROR_CODES = [
  'no_contact', 'not_approved', 'pdf_failed', 'pdf_too_large', 'enqueue_failed', 'send_failed', 'disabled', 'unknown',
] as const;
export type DeliveryErrorCode = (typeof DELIVERY_ERROR_CODES)[number];
