import type { ChangeAction } from './schema';

/**
 * Subscription-change-request lifecycle (P12B1). The request row tracks *intent + outcome*; Stripe
 * stays authoritative for subscription state. P12B1 reaches only: draft → previewed; draft/previewed →
 * cancelled; previewed/cancelled/failed → archived (a dedicated action); restore → cancelled (inert,
 * never silently re-actionable). `approved`/`executing`/`executed` are **P12B2-reserved** and are never
 * set by P12B1 code. The semantic token mapping lives in `@/lib/status/colors`
 * (`subscriptionChangeStatusToken`); the StatusBadge entity is `'subscription_change'`.
 */
export const CHANGE_STATUSES = [
  'draft',
  'previewed',
  'approved',
  'executing',
  'executed',
  'failed',
  'cancelled',
  'archived',
] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

/** Actions that require a Stripe upcoming-invoice preview before any (future) execution. */
export const PREVIEW_ACTIONS: ReadonlySet<ChangeAction> = new Set(['change_plan', 'change_quantity']);

/** Statuses reachable by P12B1 code (the rest are P12B2-reserved, forward-compat only). */
export const P12B1_REACHABLE_STATUSES: ReadonlySet<ChangeStatus> = new Set([
  'draft',
  'previewed',
  'failed',
  'cancelled',
  'archived',
]);

export function actionNeedsPreview(action: string): boolean {
  return PREVIEW_ACTIONS.has(action as ChangeAction);
}
