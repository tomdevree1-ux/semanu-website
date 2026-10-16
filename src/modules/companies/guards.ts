import { canTransition } from '@/lib/status/types';
import { companyStatusMachine, type CompanyStatus } from './status';

/**
 * Pure, client-safe guard predicates for company CRM safety rails. The server
 * actions feed live values in; keeping the logic pure makes it unit-testable and
 * impossible to bypass from the UI.
 */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalCompanyTransition(from: string, to: string): boolean {
  return canTransition(companyStatusMachine, from as CompanyStatus, to as CompanyStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}
