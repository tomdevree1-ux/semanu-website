import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { catalogStatusMachine, CATALOG_SELECTABLE_STATUSES, CATALOG_CONFIRM_STATUSES } from './status';
import { isLegalCatalogTransition, confirmMatches } from './guards';
import { catalogCreateSchema } from './schema';
import { catalogStatusToken } from '@/lib/status/colors';

describe('catalogStatusMachine transitions', () => {
  it('allows the lifecycle moves', () => {
    expect(canTransition(catalogStatusMachine, 'draft', 'active')).toBe(true);
    expect(canTransition(catalogStatusMachine, 'active', 'draft')).toBe(true);
    expect(canTransition(catalogStatusMachine, 'active', 'inactive')).toBe(true);
    expect(canTransition(catalogStatusMachine, 'inactive', 'active')).toBe(true);
  });
  it('rejects illegal jumps and any archived transition (archive is a dedicated action)', () => {
    expect(canTransition(catalogStatusMachine, 'draft', 'inactive')).toBe(false);
    expect(canTransition(catalogStatusMachine, 'draft', 'archived')).toBe(false);
    expect(canTransition(catalogStatusMachine, 'archived', 'draft')).toBe(false);
    expect(isLegalCatalogTransition('draft', 'inactive')).toBe(false);
    expect(isLegalCatalogTransition('active', 'inactive')).toBe(true);
  });
  it('selectable statuses exclude archived; no status needs confirm', () => {
    expect(CATALOG_SELECTABLE_STATUSES).not.toContain('archived');
    expect(CATALOG_CONFIRM_STATUSES.size).toBe(0);
  });
});

describe('catalogStatusToken mapping (Part V §V1)', () => {
  it('maps each status to its semantic token', () => {
    expect(catalogStatusToken('draft')).toBe('draft');
    expect(catalogStatusToken('active')).toBe('done');
    expect(catalogStatusToken('inactive')).toBe('system');
    expect(catalogStatusToken('archived')).toBe('cancelled');
  });
});

describe('catalog schema validation', () => {
  it('requires name + item_type; defaults currency CHF, billing one_time, price_is_from false', () => {
    const ok = catalogCreateSchema.safeParse({ name: 'Starter', itemType: 'subscription' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.currency).toBe('CHF');
      expect(ok.data.billingInterval).toBe('one_time');
      expect(ok.data.priceIsFrom).toBe(false);
      expect(ok.data.basePrice ?? null).toBeNull();
    }
    expect(catalogCreateSchema.safeParse({ name: '', itemType: 'service' }).success).toBe(false);
    expect(catalogCreateSchema.safeParse({ name: 'X', itemType: 'nope' }).success).toBe(false);
  });
  it('price: nullable, coerced from string, rejects negative + non-numeric', () => {
    const base = { name: 'X', itemType: 'service' };
    const p = catalogCreateSchema.safeParse({ ...base, basePrice: '39.50' });
    expect(p.success && p.data.basePrice).toBe(39.5);
    expect(catalogCreateSchema.safeParse({ ...base, basePrice: '' }).success).toBe(true);
    expect(catalogCreateSchema.safeParse({ ...base, basePrice: '-5' }).success).toBe(false);
    expect(catalogCreateSchema.safeParse({ ...base, basePrice: 'abc' }).success).toBe(false);
  });
  it('code accepts a SKU and rejects spaces; currency must be CHF', () => {
    const base = { name: 'X', itemType: 'service' };
    expect(catalogCreateSchema.safeParse({ ...base, code: 'starter_1' }).success).toBe(true);
    expect(catalogCreateSchema.safeParse({ ...base, code: 'star ter' }).success).toBe(false);
    expect(catalogCreateSchema.safeParse({ ...base, currency: 'USD' }).success).toBe(false);
  });
});

describe('confirmMatches (type-to-confirm)', () => {
  it('is case/space-insensitive', () => {
    expect(confirmMatches('  Starter ', 'starter')).toBe(true);
    expect(confirmMatches('Other', 'Starter')).toBe(false);
  });
});

describe('catalog actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/catalog/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createCatalogItem[\s\S]*?hasPermission\('catalog\.create'\)/);
    expect(src).toMatch(/updateCatalogItem[\s\S]*?hasPermission\('catalog\.update'\)/);
    expect(src).toMatch(/changeCatalogItemStatus[\s\S]*?hasPermission\('catalog\.update'\)/);
    expect(src).toMatch(/archiveCatalogItem[\s\S]*?hasPermission\('catalog\.archive'\)/);
    expect(src).toMatch(/restoreCatalogItem[\s\S]*?hasPermission\('catalog\.archive'\)/);
  });
  it('never hard-deletes; create pins draft; checks code uniqueness; never calls Stripe/checkout', () => {
    expect(src).not.toMatch(/\.delete\(/);
    expect(src).toContain("status: 'draft'");
    expect(src).toContain('codeTaken');
    expect(src).toContain('isLegalCatalogTransition');
    expect(src).toContain('confirmMatches');
    expect(src).not.toMatch(/stripe|checkout|\.from\('orders'\)|\.from\('subscriptions'\)|\.from\('payments'\)/i);
  });
  it('catalog.updated metadata is changed field names only (no commercial price values)', () => {
    const i = src.indexOf("action: 'catalog.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('metadata: { fields: changed }');
    const meta = block.slice(block.indexOf('metadata: {'), block.indexOf('},', block.indexOf('metadata: {')));
    expect(meta).not.toMatch(/base_price|setup_fee|price|currency/);
  });
});
