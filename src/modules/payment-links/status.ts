import type { StatusMachine, Transition } from '@/lib/status/types';
import type { PaymentLinkStatus as PaymentLinkStatusType } from '@/lib/types/database';

/**
 * Invoice payment-link lifecycle machine (P11). A link becomes `active` only after
 * the Stripe Checkout Session is created; it is never marked `paid` automatically in
 * P11 (webhook processing is deferred — P11-D10/D12). Tokens: draft→draft,
 * active→waiting, paid→done, expired→warning, cancelled→cancelled, failed→cancelled,
 * archived→cancelled. Archive/restore are dedicated actions. No invoice payment-state
 * mutation on any transition.
 */
export type PaymentLinkStatus = PaymentLinkStatusType;

const EMITS = 'payment_link.status_changed';

/** Status changes that require a confirm step (cancel). */
export const PAYMENT_LINK_CONFIRM_STATUSES: ReadonlySet<PaymentLinkStatus> = new Set(['cancelled']);

const PAIRS: ReadonlyArray<[PaymentLinkStatus, PaymentLinkStatus]> = [
  ['draft', 'active'], // Stripe session created
  ['active', 'paid'], // manual link to a succeeded P10 payment / future webhook
  ['active', 'expired'], // future webhook checkout.session.expired
  ['active', 'cancelled'], // cancel action
  ['active', 'failed'], // Stripe failure after draft
];

export const paymentLinkStatusMachine: StatusMachine<PaymentLinkStatus> = {
  states: {
    draft: { label: 'Draft', color: 'draft' },
    active: { label: 'Active', color: 'waiting' },
    paid: { label: 'Paid', color: 'done', terminal: true },
    expired: { label: 'Expired', color: 'warning', terminal: true },
    cancelled: { label: 'Cancelled', color: 'cancelled', terminal: true },
    failed: { label: 'Failed', color: 'cancelled', terminal: true },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(([from, to]): Transition<PaymentLinkStatus> => ({ from, to, emits: EMITS })),
};
