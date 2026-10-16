import type { StatusMachine, Transition } from '@/lib/status/types';
import type { PaymentStatus as PaymentStatusType } from '@/lib/types/database';

/**
 * Payment lifecycle machine (P10). Uses `succeeded` (not `paid`) to avoid confusion
 * with the invoice's `paid` lifecycle state. Only `succeeded` non-archived payments
 * count toward the invoice's amount_paid. Tokens: pending→waiting, succeeded→done,
 * failed→cancelled, cancelled→cancelled, refunded→warning, archived→cancelled.
 * `archived` is reached/left only via the dedicated archive/restore actions. No
 * Stripe API calls or side effects on any transition.
 */
export type PaymentStatus = PaymentStatusType;

const EMITS = 'payment.status_changed';

/** Statuses selectable as a transition target (archive is a dedicated action). */
export const PAYMENT_TARGET_STATUSES: readonly PaymentStatus[] = ['succeeded', 'failed', 'cancelled', 'refunded', 'pending'];

/** Target statuses that require a confirm step. */
export const PAYMENT_CONFIRM_STATUSES: ReadonlySet<PaymentStatus> = new Set(['succeeded', 'refunded', 'cancelled']);

/** The permission a specific transition needs (in addition to the base payments.update). */
export function permissionForPaymentTransition(_from: PaymentStatus, to: PaymentStatus): string {
  if (to === 'succeeded') return 'payments.mark_succeeded';
  if (to === 'refunded') return 'payments.refund';
  if (to === 'cancelled') return 'payments.cancel';
  return 'payments.update'; // pending (reopen) / failed
}

const PAIRS: ReadonlyArray<[PaymentStatus, PaymentStatus]> = [
  ['pending', 'succeeded'],
  ['pending', 'failed'],
  ['pending', 'cancelled'],
  ['failed', 'pending'], // reopen
  ['cancelled', 'pending'], // reopen
  ['succeeded', 'refunded'],
];

export const paymentStatusMachine: StatusMachine<PaymentStatus> = {
  states: {
    pending: { label: 'Pending', color: 'waiting' },
    succeeded: { label: 'Succeeded', color: 'done' },
    failed: { label: 'Failed', color: 'cancelled' },
    cancelled: { label: 'Cancelled', color: 'cancelled' },
    refunded: { label: 'Refunded', color: 'warning', terminal: true },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<PaymentStatus> => ({ from, to, permission: permissionForPaymentTransition(from, to), emits: EMITS }),
  ),
};

/** Legal target statuses from the current status (drives the status control dropdown). */
export function legalNextPaymentStatuses(from: PaymentStatus): PaymentStatus[] {
  return paymentStatusMachine.transitions.filter((t) => t.from === from).map((t) => t.to);
}
