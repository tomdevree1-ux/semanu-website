/**
 * Semantic status palette (client-safe), reused across badges, timelines and
 * tables in every module. These are intentionally semantic (not brand-red) so
 * statuses read correctly; brand colours stay for chrome.
 */
export type StatusToken =
  | 'draft'
  | 'sent'
  | 'waiting'
  | 'opened'
  | 'done'
  | 'cancelled'
  | 'revoked'
  | 'failed'
  | 'system'
  | 'warning'
  | 'critical';

export const STATUS_COLORS: Record<StatusToken, { bg: string; fg: string; label: string }> = {
  draft: { bg: '#E7ECF3', fg: '#2C4641', label: 'Draft' },
  sent: { bg: '#E3ECF7', fg: '#1F4E79', label: 'Sent' },
  waiting: { bg: '#FBEED0', fg: '#8A5A00', label: 'Waiting' },
  opened: { bg: '#ECE3F7', fg: '#5B3A87', label: 'Opened' },
  done: { bg: '#DFF1E6', fg: '#1F8A4C', label: 'Done' },
  cancelled: { bg: '#E7ECF3', fg: '#2C4641', label: 'Cancelled' },
  revoked: { bg: '#F7E0DD', fg: '#B3261E', label: 'Revoked' },
  failed: { bg: '#F7E0DD', fg: '#B3261E', label: 'Failed' },
  system: { bg: '#ECECEC', fg: '#555555', label: 'System' },
  warning: { bg: '#FBEED0', fg: '#8A5A00', label: 'Warning' },
  critical: { bg: '#F7E0DD', fg: '#B3261E', label: 'Critical' },
};

export function statusColor(token: StatusToken) {
  return STATUS_COLORS[token];
}

/** Map a user account status (active/invited/disabled) to a semantic token. */
export function userStatusToken(status: string): StatusToken {
  switch (status) {
    case 'active':
      return 'done';
    case 'invited':
      return 'waiting';
    case 'disabled':
      return 'revoked';
    default:
      return 'system';
  }
}

/** Map a CRM company lifecycle status to a semantic token (Part V §V1). */
export function companyStatusToken(status: string): StatusToken {
  switch (status) {
    case 'lead':
      return 'draft';
    case 'qualified':
      return 'waiting';
    case 'active':
      return 'done';
    case 'dormant':
      return 'system';
    case 'lost':
      return 'cancelled';
    case 'blocked':
      return 'revoked';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a CRM contact lifecycle status to a semantic token (Part V §V1; no `lost`). */
export function contactStatusToken(status: string): StatusToken {
  switch (status) {
    case 'lead':
      return 'draft';
    case 'qualified':
      return 'waiting';
    case 'active':
      return 'done';
    case 'dormant':
      return 'system';
    case 'blocked':
      return 'revoked';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a project lifecycle status to a semantic token (Part V §V1). */
export function projectStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'active':
      return 'done';
    case 'on_hold':
      return 'waiting';
    case 'completed':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a catalog item lifecycle status to a semantic token (Part V §V1). */
export function catalogStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'active':
      return 'done';
    case 'inactive':
      return 'system';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a quote lifecycle status to a semantic token (Part V §V1). */
export function quoteStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'sent':
      return 'sent';
    case 'accepted':
      return 'done';
    case 'declined':
      return 'cancelled';
    case 'expired':
      return 'warning';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map an invoice lifecycle status to a semantic token (Part V §V1, reconciled). */
export function invoiceStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'issued':
      return 'sent';
    case 'paid':
      return 'done';
    case 'overdue':
      return 'warning';
    case 'void':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a payment lifecycle status to a semantic token (P10). `succeeded` is the completed state. */
export function paymentStatusToken(status: string): StatusToken {
  switch (status) {
    case 'pending':
      return 'waiting';
    case 'succeeded':
      return 'done';
    case 'failed':
      return 'cancelled';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'warning';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/**
 * Map a Stripe subscription status to a semantic token (P12A). The registry mirrors the raw
 * Stripe status (open set), so unknown/future values fall back to 'warning' (attention) rather
 * than the neutral 'system'. Internal archive is shown separately via `archived_at`, not here.
 */
export function subscriptionStatusToken(status: string): StatusToken {
  switch (status) {
    case 'active':
      return 'done';
    case 'trialing':
      return 'waiting';
    case 'paused':
      return 'waiting';
    case 'incomplete':
      return 'warning';
    case 'past_due':
      return 'warning';
    case 'unpaid':
      return 'warning';
    case 'incomplete_expired':
      return 'cancelled';
    case 'canceled':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'warning';
  }
}

/**
 * Map a subscription-change-request lifecycle status to a semantic token (P12B1). `executing`/
 * `executed` are P12B2-reserved (not reachable in P12B1) but mapped for forward-compatibility.
 */
export function subscriptionChangeStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'previewed':
      return 'waiting';
    case 'approved':
      return 'waiting';
    case 'executing':
      return 'warning';
    case 'executed':
      return 'done';
    case 'failed':
      return 'warning';
    case 'cancelled':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map a website-funnel submission status to a semantic token (P13). */
export function funnelStatusToken(status: string): StatusToken {
  switch (status) {
    case 'new':
      return 'draft';
    case 'to_review':
      return 'waiting';
    case 'in_progress':
      return 'waiting';
    case 'follow_up_planned':
      return 'waiting';
    case 'qualified':
      return 'sent';
    case 'contacted':
      return 'sent';
    case 'analyzed':
      return 'done';
    case 'report_sent':
      return 'done';
    case 'converted':
      return 'done';
    case 'closed_not_relevant':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/** Map an invoice payment-link lifecycle status to a semantic token (P11). */
export function paymentLinkStatusToken(status: string): StatusToken {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'active':
      return 'waiting';
    case 'paid':
      return 'done';
    case 'expired':
      return 'warning';
    case 'cancelled':
      return 'cancelled';
    case 'failed':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/**
 * Map a website analysis report DISPLAY status (P14 / WAF-2) to a semantic token. The display status is a
 * single derived value (archived → 'archived'; else the generation_status while not succeeded; else the
 * review_status) computed by `websiteReportDisplayStatus()` in the website-reports module.
 */
export function websiteReportStatusToken(status: string): StatusToken {
  switch (status) {
    case 'queued':
      return 'draft';
    case 'fetching':
      return 'waiting';
    case 'analyzing':
      return 'opened';
    case 'failed':
      return 'failed';
    case 'review_needed':
      return 'waiting';
    case 'approved':
      return 'done';
    case 'rejected':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}

/**
 * Map a website report delivery status (P15 / WAF-3) to a semantic token. The display status is the row
 * `status`, or `archived` when `archived_at` is set (computed by the deliveries module).
 */
export function reportDeliveryStatusToken(status: string): StatusToken {
  switch (status) {
    case 'queued':
      return 'draft';
    case 'rendering':
      return 'waiting';
    case 'sending':
      return 'waiting';
    case 'sent':
      return 'done';
    case 'failed':
      return 'failed';
    case 'bounced':
      return 'revoked';
    case 'cancelled':
      return 'cancelled';
    case 'archived':
      return 'cancelled';
    default:
      return 'system';
  }
}
