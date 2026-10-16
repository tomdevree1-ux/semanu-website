import { canTransition } from '@/lib/status/types';
import { projectStatusMachine, type ProjectStatus } from './status';

/** Pure, client-safe guard predicates for project safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalProjectTransition(from: string, to: string): boolean {
  return canTransition(projectStatusMachine, from as ProjectStatus, to as ProjectStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** A chosen contact must belong to the project's company. */
export function contactBelongsToCompany(contactCompanyId: string | null, projectCompanyId: string): boolean {
  return contactCompanyId === projectCompanyId;
}
