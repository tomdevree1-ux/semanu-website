import { canTransition } from '@/lib/status/types';
import { catalogStatusMachine, type CatalogStatus } from './status';

/** Pure, client-safe guard predicates for catalog safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalCatalogTransition(from: string, to: string): boolean {
  return canTransition(catalogStatusMachine, from as CatalogStatus, to as CatalogStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}
