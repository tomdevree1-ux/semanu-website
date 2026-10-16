import type { CustomerSubscriptionSyncStatus } from '@/lib/types/database';

/**
 * Subscription status model (P12A). The registry MIRRORS the raw Stripe subscription status —
 * it is an OPEN set on purpose (Stripe may add statuses; a sync must never fail on an unseen
 * value). There is NO local status machine and NO local transition: `status` only ever changes
 * by syncing from Stripe (Stripe is authoritative). Internal archive is a separate `archived_at`
 * flag, never an overwrite of the Stripe status. The semantic token mapping lives in
 * `@/lib/status/colors` (`subscriptionStatusToken`); the StatusBadge entity is `'subscription'`.
 */

/** Known Stripe subscription statuses (for display/filtering). Unknown values still render. */
export const SUBSCRIPTION_STATUSES = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
  'unknown',
] as const;
export type KnownSubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Terminal Stripe states (no further lifecycle in Stripe). Informational only in P12A. */
export const SUBSCRIPTION_TERMINAL_STATUSES: ReadonlySet<string> = new Set(['canceled', 'incomplete_expired']);

/**
 * Statuses that WOULD permit a mutation in a future P12B (change plan/quantity, cancel, pause).
 * P12A performs NO mutations — this is documentation the detail UI can surface as a hint only.
 */
export const SUBSCRIPTION_MUTABLE_STATUSES: ReadonlySet<string> = new Set(['active', 'trialing', 'past_due', 'paused']);

export function isKnownSubscriptionStatus(status: string): status is KnownSubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as ReadonlyArray<string>).includes(status);
}

/** Internal sync-state values (closed set; has a DB CHECK). */
export const SYNC_STATUSES: ReadonlyArray<CustomerSubscriptionSyncStatus> = ['pending', 'synced', 'failed', 'stale'];
