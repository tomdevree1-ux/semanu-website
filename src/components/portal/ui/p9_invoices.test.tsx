import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — invoice', () => {
  it('maps invoice statuses to the right tokens', () => {
    expect(statusTokenFor('invoice', 'draft')).toBe('draft');
    expect(statusTokenFor('invoice', 'issued')).toBe('sent');
    expect(statusTokenFor('invoice', 'paid')).toBe('done');
    expect(statusTokenFor('invoice', 'overdue')).toBe('warning');
    expect(statusTokenFor('invoice', 'void')).toBe('cancelled');
    expect(statusTokenFor('invoice', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="invoice" status="overdue" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });
});

describe('audit display — invoice events', () => {
  it('labels and colours invoice + line events', () => {
    expect(auditLabel('invoice.created')).toBe('Invoice created');
    expect(auditLabel('invoice.created_from_quote')).toBe('Invoice created from quote');
    expect(auditLabel('invoice.item_added')).toBe('Line added');
    expect(auditLabel('invoice.items_reordered')).toBe('Lines reordered');
    expect(auditColor('invoice.archived')).toBe('revoked');
    expect(auditColor('invoice.status_changed')).toBe('warning');
    expect(auditColor('invoice.item_removed')).toBe('warning');
  });
});

describe('invoice client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/invoices/InvoiceForm.tsx',
    'src/components/portal/invoices/InvoiceDetailActions.tsx',
    'src/components/portal/invoices/LineItemEditor.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    });
  }
});
