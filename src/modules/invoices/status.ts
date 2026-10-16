import type { StatusMachine, Transition } from '@/lib/status/types';
import type { InvoiceStatus as InvoiceStatusType } from '@/lib/types/database';

/**
 * Invoice lifecycle machine (Part V §V1, reconciled). Tokens: draft→draft,
 * issued→sent, paid→done, overdue→warning, void→cancelled, archived→cancelled.
 * `archived` is reached/left only via the dedicated archive/restore actions and
 * is allowed only from draft or void. `overdue` is set manually (no cron). Money-
 * moving transitions are confirmed + permissioned. No side effects (no email/
 * order/quote/payment/Stripe/checkout) on any transition.
 */
export type InvoiceStatus = InvoiceStatusType;

const EMITS = 'invoice.status_changed';

/** Statuses a user can pick as a transition target (archive is a dedicated action; draft is never a target). */
export const INVOICE_TARGET_STATUSES: readonly InvoiceStatus[] = ['issued', 'paid', 'overdue', 'void'];

/** Target statuses that require a confirm step (issuing + money-moving + terminal). */
export const INVOICE_CONFIRM_STATUSES: ReadonlySet<InvoiceStatus> = new Set(['issued', 'paid', 'void']);

/** The permission a target status needs (in addition to the base invoices.update). */
export function permissionForStatus(to: InvoiceStatus): string {
  if (to === 'issued') return 'invoices.issue';
  if (to === 'paid') return 'invoices.mark_paid';
  if (to === 'void') return 'invoices.void';
  return 'invoices.update';
}

/**
 * The permission a specific transition needs. Same as `permissionForStatus`
 * except the `paid → issued` correction (un-pay), which requires invoices.mark_paid
 * (not invoices.issue), because it reverses a payment record.
 */
export function permissionForTransition(from: InvoiceStatus, to: InvoiceStatus): string {
  if (from === 'paid' && to === 'issued') return 'invoices.mark_paid';
  return permissionForStatus(to);
}

const PAIRS: ReadonlyArray<[InvoiceStatus, InvoiceStatus]> = [
  ['draft', 'issued'],
  ['issued', 'paid'],
  ['issued', 'overdue'],
  ['issued', 'void'],
  ['overdue', 'paid'],
  ['overdue', 'void'],
  ['paid', 'issued'], // admin correction (un-pay)
];

export const invoiceStatusMachine: StatusMachine<InvoiceStatus> = {
  states: {
    draft: { label: 'Draft', color: 'draft' },
    issued: { label: 'Issued', color: 'sent' },
    paid: { label: 'Paid', color: 'done' },
    overdue: { label: 'Overdue', color: 'warning' },
    void: { label: 'Void', color: 'cancelled', terminal: true },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<InvoiceStatus> => ({ from, to, permission: permissionForTransition(from, to), emits: EMITS }),
  ),
};

/** Legal target statuses from the current status (drives the status control dropdown). */
export function legalNextStatuses(from: InvoiceStatus): InvoiceStatus[] {
  return invoiceStatusMachine.transitions.filter((t) => t.from === from).map((t) => t.to);
}
