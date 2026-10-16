import { canTransition } from '@/lib/status/types';
import { contactStatusMachine, type ContactStatus } from './status';

/** Pure, client-safe guard predicates for contact CRM safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalContactTransition(from: string, to: string): boolean {
  return canTransition(contactStatusMachine, from as ContactStatus, to as ContactStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}
