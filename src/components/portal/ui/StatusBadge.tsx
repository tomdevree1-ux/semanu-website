import {
  statusColor,
  userStatusToken,
  companyStatusToken,
  contactStatusToken,
  projectStatusToken,
  catalogStatusToken,
  quoteStatusToken,
  invoiceStatusToken,
  paymentStatusToken,
  paymentLinkStatusToken,
  subscriptionStatusToken,
  subscriptionChangeStatusToken,
  funnelStatusToken,
  websiteReportStatusToken,
  reportDeliveryStatusToken,
  type StatusToken,
} from '@/lib/status/colors';

/**
 * Entities that carry a status. UI-only union — extend as modules ship (no DB
 * change needed to add a mapping here).
 */
export type StatusEntity =
  | 'user'
  | 'invite'
  | 'email'
  | 'company'
  | 'contact'
  | 'project'
  | 'catalog'
  | 'quote'
  | 'product'
  | 'invoice'
  | 'payment'
  | 'payment_link'
  | 'subscription'
  | 'subscription_change'
  | 'funnel'
  | 'website_report'
  | 'report_delivery'
  | 'document';

/**
 * Map an entity status value to a shared semantic token. Unknown → 'system'.
 * `user` reuses `userStatusToken`; `archived` is a future-ready UI mapping only
 * (no such DB value exists yet — P3.5 introduces none).
 */
export function statusTokenFor(entity: StatusEntity, status: string): StatusToken {
  if (entity === 'user') {
    if (status === 'archived') return 'cancelled';
    return userStatusToken(status);
  }
  if (entity === 'company') return companyStatusToken(status);
  if (entity === 'contact') return contactStatusToken(status);
  if (entity === 'project') return projectStatusToken(status);
  if (entity === 'catalog') return catalogStatusToken(status);
  if (entity === 'quote') return quoteStatusToken(status);
  if (entity === 'invoice') return invoiceStatusToken(status);
  if (entity === 'payment') return paymentStatusToken(status);
  if (entity === 'payment_link') return paymentLinkStatusToken(status);
  if (entity === 'subscription') return subscriptionStatusToken(status);
  if (entity === 'subscription_change') return subscriptionChangeStatusToken(status);
  if (entity === 'funnel') return funnelStatusToken(status);
  if (entity === 'website_report') return websiteReportStatusToken(status);
  if (entity === 'report_delivery') return reportDeliveryStatusToken(status);
  return 'system';
}

/** Title-case a status value, removing underscores/hyphens (no dashed labels). */
export function statusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generic, shared status pill (presentational, server-safe). Colour + text label. */
export function StatusBadge({
  entityType,
  status,
  label,
  size = 'sm',
}: {
  entityType: StatusEntity;
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const c = statusColor(statusTokenFor(entityType, status));
  const text = label ?? statusLabel(status);
  const sizing = size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`rounded-pill font-medium ${sizing}`} style={{ background: c.bg, color: c.fg }}>
      {text}
    </span>
  );
}
