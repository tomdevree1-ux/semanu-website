import type { StatusMachine, Transition } from '@/lib/status/types';
import type { ContactStatus as ContactStatusType } from '@/lib/types/database';

/**
 * Contact CRM lifecycle machine (Part V §V1; no `lost`). Tokens: lead→draft,
 * qualified→waiting, active→done, dormant→system, blocked→revoked,
 * archived→cancelled. `archived` is reached/left only via the dedicated
 * archive/restore actions, not via `changeContactStatus`.
 */
export type ContactStatus = ContactStatusType;

export const CONTACT_UPDATE_PERMISSION = 'contacts.update';
const EMITS = 'contact.status_changed';

export const CONTACT_SELECTABLE_STATUSES: readonly ContactStatus[] = [
  'lead',
  'qualified',
  'active',
  'dormant',
  'blocked',
];

export const CONTACT_CONFIRM_STATUSES: ReadonlySet<ContactStatus> = new Set(['blocked']);

const PAIRS: ReadonlyArray<[ContactStatus, ContactStatus]> = [
  ['lead', 'qualified'],
  ['qualified', 'lead'],
  ['qualified', 'active'],
  ['active', 'qualified'],
  ['active', 'dormant'],
  ['dormant', 'active'],
  ['dormant', 'qualified'],
  ['lead', 'blocked'],
  ['qualified', 'blocked'],
  ['active', 'blocked'],
  ['dormant', 'blocked'],
  ['blocked', 'lead'],
];

export const contactStatusMachine: StatusMachine<ContactStatus> = {
  states: {
    lead: { label: 'Lead', color: 'draft' },
    qualified: { label: 'Qualified', color: 'waiting' },
    active: { label: 'Active', color: 'done' },
    dormant: { label: 'Dormant', color: 'system' },
    blocked: { label: 'Blocked', color: 'revoked' },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<ContactStatus> => ({
      from,
      to,
      permission: CONTACT_UPDATE_PERMISSION,
      emits: EMITS,
    }),
  ),
};
