import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import {
  invoiceStatusMachine,
  INVOICE_TARGET_STATUSES,
  INVOICE_CONFIRM_STATUSES,
  permissionForStatus,
  permissionForTransition,
  legalNextStatuses,
} from './status';
import {
  isLegalInvoiceTransition,
  isArchivableStatus,
  confirmMatches,
  contactBelongsToCompany,
  projectBelongsToCompany,
  quoteBelongsToCompany,
} from './guards';
import { invoiceCreateSchema, invoiceUpdateSchema, invoiceItemCreateSchema, invoiceFromQuoteSchema } from './schema';
import { invoiceStatusToken } from '@/lib/status/colors';

describe('invoiceStatusMachine transitions', () => {
  it('allows the lifecycle + reopen moves', () => {
    expect(canTransition(invoiceStatusMachine, 'draft', 'issued')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'issued', 'paid')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'issued', 'overdue')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'issued', 'void')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'overdue', 'paid')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'overdue', 'void')).toBe(true);
    expect(canTransition(invoiceStatusMachine, 'paid', 'issued')).toBe(true); // admin un-pay
  });
  it('rejects illegal jumps, void terminality and any archived transition', () => {
    expect(canTransition(invoiceStatusMachine, 'draft', 'paid')).toBe(false);
    expect(canTransition(invoiceStatusMachine, 'draft', 'void')).toBe(false);
    expect(canTransition(invoiceStatusMachine, 'draft', 'archived')).toBe(false);
    expect(canTransition(invoiceStatusMachine, 'void', 'draft')).toBe(false); // terminal
    expect(canTransition(invoiceStatusMachine, 'void', 'issued')).toBe(false);
    expect(canTransition(invoiceStatusMachine, 'archived', 'draft')).toBe(false);
    expect(isLegalInvoiceTransition('draft', 'paid')).toBe(false);
    expect(isLegalInvoiceTransition('draft', 'issued')).toBe(true);
  });
  it('maps the right permission to each target / transition', () => {
    expect(permissionForStatus('issued')).toBe('invoices.issue');
    expect(permissionForStatus('paid')).toBe('invoices.mark_paid');
    expect(permissionForStatus('void')).toBe('invoices.void');
    expect(permissionForStatus('overdue')).toBe('invoices.update');
    // The un-pay correction needs mark_paid, NOT issue, even though the target is "issued".
    expect(permissionForTransition('draft', 'issued')).toBe('invoices.issue');
    expect(permissionForTransition('paid', 'issued')).toBe('invoices.mark_paid');
    expect(permissionForTransition('issued', 'overdue')).toBe('invoices.update');
  });
  it('target list excludes draft/archived; issued/paid/void confirm; overdue does not', () => {
    expect(INVOICE_TARGET_STATUSES).not.toContain('archived');
    expect(INVOICE_TARGET_STATUSES).not.toContain('draft');
    expect(INVOICE_CONFIRM_STATUSES.has('issued')).toBe(true);
    expect(INVOICE_CONFIRM_STATUSES.has('paid')).toBe(true);
    expect(INVOICE_CONFIRM_STATUSES.has('void')).toBe(true);
    expect(INVOICE_CONFIRM_STATUSES.has('overdue')).toBe(false);
  });
  it('legalNextStatuses drives the dropdown', () => {
    expect(legalNextStatuses('draft')).toEqual(['issued']);
    expect(legalNextStatuses('issued').sort()).toEqual(['overdue', 'paid', 'void']);
    expect(legalNextStatuses('void')).toEqual([]);
  });
});

describe('invoiceStatusToken mapping (Part V §V1)', () => {
  it('maps each status to its semantic token', () => {
    expect(invoiceStatusToken('draft')).toBe('draft');
    expect(invoiceStatusToken('issued')).toBe('sent');
    expect(invoiceStatusToken('paid')).toBe('done');
    expect(invoiceStatusToken('overdue')).toBe('warning');
    expect(invoiceStatusToken('void')).toBe('cancelled');
    expect(invoiceStatusToken('archived')).toBe('cancelled');
  });
});

describe('invoice schema validation', () => {
  it('create requires title + company', () => {
    expect(invoiceCreateSchema.safeParse({ title: 'Invoice A', companyId: '11111111-1111-1111-1111-111111111111' }).success).toBe(true);
    expect(invoiceCreateSchema.safeParse({ title: '', companyId: '11111111-1111-1111-1111-111111111111' }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ title: 'X', companyId: 'nope' }).success).toBe(false);
  });
  it('from-quote requires a quote uuid', () => {
    expect(invoiceFromQuoteSchema.safeParse({ quoteId: '11111111-1111-1111-1111-111111111111' }).success).toBe(true);
    expect(invoiceFromQuoteSchema.safeParse({ quoteId: 'nope' }).success).toBe(false);
  });
  it('update money: discount/tax default 0, >= 0', () => {
    const ok = invoiceUpdateSchema.safeParse({ title: 'X' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.discountAmount).toBe(0);
      expect(ok.data.taxAmount).toBe(0);
    }
    expect(invoiceUpdateSchema.safeParse({ title: 'X', discountAmount: '-5' }).success).toBe(false);
  });
  it('line item: name required, quantity > 0, unit_price >= 0', () => {
    const base = { name: 'Line', quantity: '2', unitPrice: '39' };
    expect(invoiceItemCreateSchema.safeParse(base).success).toBe(true);
    expect(invoiceItemCreateSchema.safeParse({ ...base, name: '' }).success).toBe(false);
    expect(invoiceItemCreateSchema.safeParse({ ...base, quantity: '0' }).success).toBe(false);
    expect(invoiceItemCreateSchema.safeParse({ ...base, unitPrice: '-1' }).success).toBe(false);
  });
});

describe('guards', () => {
  it('relationship + confirm + archivable helpers', () => {
    expect(contactBelongsToCompany('c1', 'c1')).toBe(true);
    expect(contactBelongsToCompany('c2', 'c1')).toBe(false);
    expect(projectBelongsToCompany('c1', 'c1')).toBe(true);
    expect(quoteBelongsToCompany('c1', 'c1')).toBe(true);
    expect(quoteBelongsToCompany('c2', 'c1')).toBe(false);
    expect(confirmMatches('  INV-00001 ', 'inv-00001')).toBe(true);
    expect(isArchivableStatus('draft')).toBe(true);
    expect(isArchivableStatus('void')).toBe(true);
    expect(isArchivableStatus('issued')).toBe(false);
    expect(isArchivableStatus('paid')).toBe(false);
  });
});

describe('invoices actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/invoices/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createInvoice\b[\s\S]*?hasPermission\('invoices\.create'\)/);
    expect(src).toMatch(/createInvoiceFromQuote[\s\S]*?hasPermission\('invoices\.create'\)/);
    expect(src).toMatch(/updateInvoice[\s\S]*?hasPermission\('invoices\.update'\)/);
    expect(src).toMatch(/changeInvoiceStatus[\s\S]*?hasPermission\('invoices\.update'\)/);
    expect(src).toContain('permissionForTransition');
    expect(src).toMatch(/archiveInvoice[\s\S]*?hasPermission\('invoices\.archive'\)/);
    expect(src).toMatch(/addInvoiceItem[\s\S]*?hasPermission\('invoices\.update'\)/);
    expect(src).toMatch(/removeInvoiceItem[\s\S]*?hasPermission\('invoices\.update'\)/);
  });
  it('enforces draft-only editing + archivable-only-from-draft/void', () => {
    expect(src).toContain('requireEditableInvoice');
    expect(src).toContain("status !== 'draft'");
    expect(src).toContain('isArchivableStatus');
  });
  it('mark-paid sets amount_paid + paid_at; un-pay clears them', () => {
    expect(src).toContain('amount_paid');
    expect(src).toContain('paid_at');
    expect(src).toContain('recalcTotals');
  });
  it('invoices are never hard-deleted; only line items can be; no Stripe/checkout/orders/subs/payments/customers', () => {
    expect(src).not.toContain("from('invoices').delete");
    expect(src).toContain("from('invoice_items').delete"); // line-item removal is allowed
    expect(src).toContain("status: 'archived'"); // invoice archive is soft
    expect(src).not.toMatch(/stripe|checkout|\.from\('orders'\)|\.from\('subscriptions'\)|\.from\('payments'\)|\.from\('payment_links'\)|\.from\('customers'\)/i);
  });
  it('snapshots quote items when creating from a quote', () => {
    expect(src).toContain('quote_item_id');
    expect(src).toMatch(/created_from_quote/);
  });
  it('no raw money VALUES in ordinary audit metadata (field-name strings are fine)', () => {
    const metas = src.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      // A money key used as an object PROPERTY (key: value) would leak an amount;
      // a quoted field NAME like 'unit_price' inside a fields list is allowed.
      expect(m).not.toMatch(/\b(unit_price|line_total|line_subtotal|subtotal|total_amount|discount_amount|tax_amount|amount_paid|balance_due)\s*:/);
    }
    const i = src.indexOf("action: 'invoice.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('metadata: { fields: changed }');
  });
});
