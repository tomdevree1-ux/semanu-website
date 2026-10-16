import { canTransition } from '@/lib/status/types';
import { paymentStatusMachine, permissionForPaymentTransition, type PaymentStatus } from './status';

/** Pure, client-safe guard predicates for payment safety rails. */

export { permissionForPaymentTransition };

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalPaymentTransition(from: string, to: string): boolean {
  return canTransition(paymentStatusMachine, from as PaymentStatus, to as PaymentStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** An invoice may receive new payments unless it is void or archived (P10-D / req §11). */
export function invoiceAllowsPayment(invoiceStatus: string, invoiceArchivedAt: string | null): boolean {
  if (invoiceArchivedAt) return false;
  return invoiceStatus !== 'void' && invoiceStatus !== 'archived';
}

/** A payment is editable only while pending and non-archived (P10-D16/D19). */
export function paymentIsEditable(status: string, archivedAt: string | null): boolean {
  return status === 'pending' && !archivedAt;
}

/** Archivable only from inert states; never from succeeded (P10-D18). */
export function paymentIsArchivable(status: string): boolean {
  return status === 'pending' || status === 'failed' || status === 'cancelled' || status === 'refunded';
}

/** Only succeeded, non-archived payments count toward the invoice's amount_paid. */
export function paymentCounts(status: string, archivedAt: string | null): boolean {
  return status === 'succeeded' && !archivedAt;
}
