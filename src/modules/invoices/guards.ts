import { canTransition } from '@/lib/status/types';
import { invoiceStatusMachine, type InvoiceStatus } from './status';

/** Pure, client-safe guard predicates for invoice safety rails. */

/** Legal lifecycle transition (archive/restore are dedicated actions, not here). */
export function isLegalInvoiceTransition(from: string, to: string): boolean {
  return canTransition(invoiceStatusMachine, from as InvoiceStatus, to as InvoiceStatus);
}

/** Type-to-confirm comparison (case/space-insensitive). */
export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** An invoice may be archived only from a financially inert state. */
export function isArchivableStatus(status: string): boolean {
  return status === 'draft' || status === 'void';
}

/** A chosen contact must belong to the invoice's company. */
export function contactBelongsToCompany(contactCompanyId: string | null, invoiceCompanyId: string): boolean {
  return contactCompanyId === invoiceCompanyId;
}

/** A chosen project must belong to the invoice's company. */
export function projectBelongsToCompany(projectCompanyId: string | null, invoiceCompanyId: string): boolean {
  return projectCompanyId === invoiceCompanyId;
}

/** A chosen quote must belong to the invoice's company. */
export function quoteBelongsToCompany(quoteCompanyId: string | null, invoiceCompanyId: string): boolean {
  return quoteCompanyId === invoiceCompanyId;
}
