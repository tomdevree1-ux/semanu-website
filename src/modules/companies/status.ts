import type { StatusMachine, Transition } from '@/lib/status/types';
import type { CompanyCrmStatus } from '@/lib/types/database';

/**
 * Company CRM lifecycle machine (Part V §V1 — the first real domain machine).
 * Tokens: lead→draft, qualified→waiting, active→done, dormant→system,
 * lost→cancelled, blocked→revoked, archived→cancelled.
 *
 * `archived` is a valid state (for the badge) but is reached/left only via the
 * dedicated archive/restore actions — NOT via `changeCompanyStatus`. So the
 * transitions below cover the lifecycle among the non-archived states only.
 */
export type CompanyStatus = CompanyCrmStatus;

export const COMPANY_UPDATE_PERMISSION = 'companies.update';
const EMITS = 'company.status_changed';

/** Statuses a user may pick in the generic status control (archive is separate). */
export const COMPANY_SELECTABLE_STATUSES: readonly CompanyStatus[] = [
  'lead',
  'qualified',
  'active',
  'dormant',
  'lost',
  'blocked',
];

/** Status values that require an explicit confirm before applying. */
export const COMPANY_CONFIRM_STATUSES: ReadonlySet<CompanyStatus> = new Set(['blocked']);

const PAIRS: ReadonlyArray<[CompanyStatus, CompanyStatus]> = [
  ['lead', 'qualified'],
  ['qualified', 'lead'],
  ['qualified', 'active'],
  ['active', 'qualified'],
  ['active', 'dormant'],
  ['dormant', 'active'],
  ['dormant', 'qualified'],
  // lost (and reopen)
  ['lead', 'lost'],
  ['qualified', 'lost'],
  ['active', 'lost'],
  ['dormant', 'lost'],
  ['lost', 'lead'],
  // blocked (and unblock)
  ['lead', 'blocked'],
  ['qualified', 'blocked'],
  ['active', 'blocked'],
  ['dormant', 'blocked'],
  ['lost', 'blocked'],
  ['blocked', 'lead'],
];

export const companyStatusMachine: StatusMachine<CompanyStatus> = {
  states: {
    lead: { label: 'Lead', color: 'draft' },
    qualified: { label: 'Qualified', color: 'waiting' },
    active: { label: 'Active', color: 'done' },
    dormant: { label: 'Dormant', color: 'system' },
    lost: { label: 'Lost', color: 'cancelled' },
    blocked: { label: 'Blocked', color: 'revoked' },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<CompanyStatus> => ({
      from,
      to,
      permission: COMPANY_UPDATE_PERMISSION,
      emits: EMITS,
    }),
  ),
};
