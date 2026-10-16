/**
 * Pure, client-safe guard predicates for subscription change requests (P12B1). None of these touch
 * Stripe. The request row is a portal-local record; cancel/archive/restore are local-only.
 */

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** A request can be cancelled (a workflow cancel — NOT a Stripe cancel) only while still open. */
export function changeRequestIsCancellable(status: string): boolean {
  return status === 'draft' || status === 'previewed';
}

/** A request is archivable only from a terminal/inert status (never draft/approved/executing). */
export function changeRequestIsArchivable(status: string): boolean {
  return status === 'previewed' || status === 'cancelled' || status === 'failed' || status === 'executed';
}

/** A request row is archived when it has an `archived_at` stamp. */
export function changeRequestIsArchived(archivedAt: string | null): boolean {
  return !!archivedAt;
}

/**
 * P12B2 execution-state gate (pure). Plan/quantity execute only from `previewed`/`approved` (a fresh
 * preview is recomputed at execution time regardless). Cancel/undo/cancel_immediately execute from
 * `draft`/`previewed`/`approved`. Never from executing/executed/cancelled/archived; `failed` only via
 * the retry action.
 */
export function requestStatusExecutable(action: string, status: string): boolean {
  if (['executing', 'executed', 'cancelled', 'archived', 'failed'].includes(status)) return false;
  if (action === 'change_plan' || action === 'change_quantity') return status === 'previewed' || status === 'approved';
  if (['cancel_at_period_end', 'undo_cancel_at_period_end', 'cancel_immediately'].includes(action)) {
    return status === 'draft' || status === 'previewed' || status === 'approved';
  }
  return false; // pause/resume are not executable in P12B2
}

/** The execute permission key that gates a given action (P12B2). */
export function executePermissionFor(action: string): string | null {
  if (action === 'change_plan') return 'subscriptions.change_plan';
  if (action === 'change_quantity') return 'subscriptions.change_quantity';
  if (['cancel_at_period_end', 'undo_cancel_at_period_end', 'cancel_immediately'].includes(action)) return 'subscriptions.cancel';
  return null; // pause/resume deferred
}

/** A fresh Stripe idempotency key for a retry attempt (request id + a unique suffix). */
export function retryIdempotencyKey(requestId: string): string {
  return `${requestId}:r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
