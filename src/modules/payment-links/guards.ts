import { canTransition } from '@/lib/status/types';
import { paymentLinkStatusMachine, type PaymentLinkStatus } from './status';

/** Pure, client-safe guard predicates for payment-link safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalLinkTransition(from: string, to: string): boolean {
  return canTransition(paymentLinkStatusMachine, from as PaymentLinkStatus, to as PaymentLinkStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * An invoice may have a payment link generated only when it is issued/overdue,
 * non-archived, non-void, with a positive balance (P11-D6/D7 + relationship rules).
 */
export function invoiceAllowsLink(invoiceStatus: string, invoiceArchivedAt: string | null, balanceDue: number): boolean {
  if (invoiceArchivedAt) return false;
  if (invoiceStatus !== 'issued' && invoiceStatus !== 'overdue') return false;
  return balanceDue > 0;
}

/** A link is active (a live, payable Stripe session). */
export function linkIsActive(status: string): boolean {
  return status === 'active';
}

/** Archivable only from terminal/inert states; never from active or draft (P11 status rules). */
export function linkIsArchivable(status: string): boolean {
  return status === 'cancelled' || status === 'expired' || status === 'failed' || status === 'paid';
}

/** A link's snapshotted amount is stale if it no longer matches the invoice balance. */
export function linkIsStale(linkAmount: number, invoiceBalanceDue: number): boolean {
  return Math.round(linkAmount * 100) !== Math.round(invoiceBalanceDue * 100);
}
