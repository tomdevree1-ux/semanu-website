/**
 * Pure, client-safe guard predicates for the subscription registry (P12A). None of these
 * touch Stripe — the registry is a CRM-link + synced snapshot; archive/restore are LOCAL
 * registry operations only and never cancel or change the Stripe subscription.
 */

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** A registry row is archived when it has an `archived_at` stamp. */
export function subscriptionIsArchived(archivedAt: string | null): boolean {
  return !!archivedAt;
}

/**
 * A registry row can be archived only when it is not already archived. Archiving hides the
 * CRM link locally; it does NOT cancel or modify the Stripe subscription (Stripe is
 * authoritative). Any live/terminal Stripe status is archivable.
 */
export function subscriptionLinkIsArchivable(archivedAt: string | null): boolean {
  return !archivedAt;
}

/** Whether a registry row may be (re)synced. Archived rows can still be synced (the snapshot
 * refreshes; `archived_at` is preserved) — see actions.syncSubscriptionFromStripe. */
export function subscriptionIsSyncable(): boolean {
  return true;
}
