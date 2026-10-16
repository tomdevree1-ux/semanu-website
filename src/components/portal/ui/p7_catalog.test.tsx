import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';
import { formatCatalogPrice } from '@/modules/catalog/price';

describe('StatusBadge — catalog', () => {
  it('maps catalog statuses to the right tokens', () => {
    expect(statusTokenFor('catalog', 'draft')).toBe('draft');
    expect(statusTokenFor('catalog', 'active')).toBe('done');
    expect(statusTokenFor('catalog', 'inactive')).toBe('system');
    expect(statusTokenFor('catalog', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="catalog" status="inactive" />);
    expect(screen.getByText('Inactive')).toBeTruthy();
  });
});

describe('audit display — catalog events', () => {
  it('labels and colours catalog events', () => {
    expect(auditLabel('catalog.created')).toBe('Catalog item created');
    expect(auditLabel('catalog.archived')).toBe('Catalog item archived');
    expect(auditColor('catalog.archived')).toBe('revoked');
    expect(auditColor('catalog.created')).toBe('done');
    expect(auditColor('catalog.status_changed')).toBe('warning');
  });
});

describe('catalog price formatter', () => {
  it('renders on-request, from, one-time and recurring labels (no dashes)', () => {
    expect(formatCatalogPrice({ basePrice: null, currency: 'CHF', priceIsFrom: false, billingInterval: 'monthly' })).toBe('Price on request');
    expect(formatCatalogPrice({ basePrice: 200, currency: 'CHF', priceIsFrom: true, billingInterval: 'monthly' })).toBe('From CHF 200 per month');
    expect(formatCatalogPrice({ basePrice: 750, currency: 'CHF', priceIsFrom: false, billingInterval: 'one_time' })).toBe('CHF 750 one time');
    expect(formatCatalogPrice({ basePrice: 99, currency: 'CHF', priceIsFrom: false, billingInterval: 'yearly' })).toBe('CHF 99 per year');
  });
});

describe('catalog client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/catalog/CatalogForm.tsx',
    'src/components/portal/catalog/CatalogDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    });
  }
});
