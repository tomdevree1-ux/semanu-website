import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { quoteStatusMachine, QUOTE_SELECTABLE_STATUSES, QUOTE_CONFIRM_STATUSES, permissionForStatus } from './status';
import { isLegalQuoteTransition, confirmMatches, contactBelongsToCompany, projectBelongsToCompany } from './guards';
import { quoteCreateSchema, quoteUpdateSchema, quoteItemCreateSchema } from './schema';
import { quoteStatusToken } from '@/lib/status/colors';

describe('quoteStatusMachine transitions', () => {
  it('allows the lifecycle + reopen moves', () => {
    expect(canTransition(quoteStatusMachine, 'draft', 'sent')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'sent', 'draft')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'sent', 'accepted')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'sent', 'declined')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'sent', 'expired')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'accepted', 'draft')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'declined', 'draft')).toBe(true);
    expect(canTransition(quoteStatusMachine, 'expired', 'draft')).toBe(true);
  });
  it('rejects illegal jumps and any archived transition', () => {
    expect(canTransition(quoteStatusMachine, 'draft', 'accepted')).toBe(false);
    expect(canTransition(quoteStatusMachine, 'draft', 'archived')).toBe(false);
    expect(canTransition(quoteStatusMachine, 'archived', 'draft')).toBe(false);
    expect(isLegalQuoteTransition('draft', 'accepted')).toBe(false);
    expect(isLegalQuoteTransition('draft', 'sent')).toBe(true);
  });
  it('maps the right permission to each target status', () => {
    expect(permissionForStatus('sent')).toBe('quotes.send');
    expect(permissionForStatus('accepted')).toBe('quotes.accept');
    expect(permissionForStatus('declined')).toBe('quotes.accept');
    expect(permissionForStatus('draft')).toBe('quotes.update');
    expect(permissionForStatus('expired')).toBe('quotes.update');
  });
  it('selectable excludes archived; accepted/declined confirm', () => {
    expect(QUOTE_SELECTABLE_STATUSES).not.toContain('archived');
    expect(QUOTE_CONFIRM_STATUSES.has('accepted')).toBe(true);
    expect(QUOTE_CONFIRM_STATUSES.has('declined')).toBe(true);
    expect(QUOTE_CONFIRM_STATUSES.has('sent')).toBe(false);
  });
});

describe('quoteStatusToken mapping (Part V §V1)', () => {
  it('maps each status to its semantic token', () => {
    expect(quoteStatusToken('draft')).toBe('draft');
    expect(quoteStatusToken('sent')).toBe('sent');
    expect(quoteStatusToken('accepted')).toBe('done');
    expect(quoteStatusToken('declined')).toBe('cancelled');
    expect(quoteStatusToken('expired')).toBe('warning');
    expect(quoteStatusToken('archived')).toBe('cancelled');
  });
});

describe('quote schema validation', () => {
  it('create requires title + company', () => {
    expect(quoteCreateSchema.safeParse({ title: 'Offer A', companyId: '11111111-1111-1111-1111-111111111111' }).success).toBe(true);
    expect(quoteCreateSchema.safeParse({ title: '', companyId: '11111111-1111-1111-1111-111111111111' }).success).toBe(false);
    expect(quoteCreateSchema.safeParse({ title: 'X', companyId: 'nope' }).success).toBe(false);
  });
  it('update money: discount/tax default 0, >= 0', () => {
    const ok = quoteUpdateSchema.safeParse({ title: 'X' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.discountAmount).toBe(0);
      expect(ok.data.taxAmount).toBe(0);
    }
    expect(quoteUpdateSchema.safeParse({ title: 'X', discountAmount: '-5' }).success).toBe(false);
    expect(quoteUpdateSchema.safeParse({ title: 'X', taxAmount: '8.10' }).success).toBe(true);
  });
  it('line item: name required, quantity > 0, unit_price >= 0', () => {
    const base = { name: 'Line', quantity: '2', unitPrice: '39' };
    const ok = quoteItemCreateSchema.safeParse(base);
    expect(ok.success && ok.data.quantity).toBe(2);
    expect(quoteItemCreateSchema.safeParse({ ...base, name: '' }).success).toBe(false);
    expect(quoteItemCreateSchema.safeParse({ ...base, quantity: '0' }).success).toBe(false);
    expect(quoteItemCreateSchema.safeParse({ ...base, unitPrice: '-1' }).success).toBe(false);
  });
});

describe('guards', () => {
  it('relationship + confirm helpers', () => {
    expect(contactBelongsToCompany('c1', 'c1')).toBe(true);
    expect(contactBelongsToCompany('c2', 'c1')).toBe(false);
    expect(projectBelongsToCompany('c1', 'c1')).toBe(true);
    expect(confirmMatches('  Q-00001 ', 'q-00001')).toBe(true);
  });
});

describe('quotes actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/quotes/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createQuote[\s\S]*?hasPermission\('quotes\.create'\)/);
    expect(src).toMatch(/updateQuote[\s\S]*?hasPermission\('quotes\.update'\)/);
    expect(src).toMatch(/changeQuoteStatus[\s\S]*?hasPermission\('quotes\.update'\)/);
    expect(src).toContain('permissionForStatus');
    expect(src).toMatch(/archiveQuote[\s\S]*?hasPermission\('quotes\.archive'\)/);
    expect(src).toMatch(/addQuoteItem[\s\S]*?hasPermission\('quotes\.update'\)/);
    expect(src).toMatch(/removeQuoteItem[\s\S]*?hasPermission\('quotes\.update'\)/);
  });
  it('quotes are never hard-deleted; only line items can be deleted; no Stripe/checkout/orders/subs', () => {
    expect(src).not.toContain("from('quotes').delete");
    expect(src).toContain("from('quote_items').delete"); // line-item removal is allowed
    expect(src).toContain("status: 'archived'"); // quote archive is soft
    expect(src).toContain('recalcTotals');
    expect(src).not.toMatch(/stripe|checkout|\.from\('orders'\)|\.from\('subscriptions'\)|\.from\('payments'\)|\.from\('payment_links'\)/i);
  });
  it('no raw money VALUES in ordinary audit metadata (field-name strings are fine)', () => {
    const metas = src.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      // A money key used as an object PROPERTY (key: value) would leak an amount;
      // a quoted field NAME like 'unit_price' inside a fields list is allowed.
      expect(m).not.toMatch(/\b(unit_price|line_total|line_subtotal|subtotal|total_amount|discount_amount|tax_amount)\s*:/);
    }
    // quote.updated metadata is changed field NAMES only.
    const i = src.indexOf("action: 'quote.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('metadata: { fields: changed }');
  });
});
