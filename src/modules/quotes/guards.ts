import { canTransition } from '@/lib/status/types';
import { quoteStatusMachine, type QuoteStatus } from './status';

/** Pure, client-safe guard predicates for quote safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalQuoteTransition(from: string, to: string): boolean {
  return canTransition(quoteStatusMachine, from as QuoteStatus, to as QuoteStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** A chosen contact must belong to the quote's company. */
export function contactBelongsToCompany(contactCompanyId: string | null, quoteCompanyId: string): boolean {
  return contactCompanyId === quoteCompanyId;
}

/** A chosen project must belong to the quote's company. */
export function projectBelongsToCompany(projectCompanyId: string | null, quoteCompanyId: string): boolean {
  return projectCompanyId === quoteCompanyId;
}
