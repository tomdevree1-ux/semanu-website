import type { StatusMachine, Transition } from '@/lib/status/types';
import type { QuoteStatus as QuoteStatusType } from '@/lib/types/database';

/**
 * Quote lifecycle machine (Part V §V1). Tokens: draft→draft, sent→sent,
 * accepted→done, declined→cancelled, expired→warning, archived→cancelled.
 * `archived` is reached/left only via the dedicated archive/restore actions.
 * `expired` is set manually (no cron). No side effects on any transition.
 */
export type QuoteStatus = QuoteStatusType;

const EMITS = 'quote.status_changed';

/** Statuses selectable via the generic status control (archive is a dedicated action). */
export const QUOTE_SELECTABLE_STATUSES: readonly QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
];

/** Status changes that require a confirm step. */
export const QUOTE_CONFIRM_STATUSES: ReadonlySet<QuoteStatus> = new Set(['accepted', 'declined']);

/** The specific permission a target status needs (in addition to the base quotes.update). */
export function permissionForStatus(to: QuoteStatus): string {
  if (to === 'sent') return 'quotes.send';
  if (to === 'accepted' || to === 'declined') return 'quotes.accept';
  return 'quotes.update';
}

const PAIRS: ReadonlyArray<[QuoteStatus, QuoteStatus]> = [
  ['draft', 'sent'],
  ['sent', 'draft'],
  ['sent', 'accepted'],
  ['sent', 'declined'],
  ['sent', 'expired'],
  ['accepted', 'draft'], // reopen
  ['declined', 'draft'], // reopen
  ['expired', 'draft'], // reopen
];

export const quoteStatusMachine: StatusMachine<QuoteStatus> = {
  states: {
    draft: { label: 'Draft', color: 'draft' },
    sent: { label: 'Sent', color: 'sent' },
    accepted: { label: 'Accepted', color: 'done' },
    declined: { label: 'Declined', color: 'cancelled' },
    expired: { label: 'Expired', color: 'warning' },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<QuoteStatus> => ({ from, to, permission: permissionForStatus(to), emits: EMITS }),
  ),
};
