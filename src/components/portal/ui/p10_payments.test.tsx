import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — payment', () => {
  it('maps payment statuses to the right tokens', () => {
    expect(statusTokenFor('payment', 'pending')).toBe('waiting');
    expect(statusTokenFor('payment', 'succeeded')).toBe('done');
    expect(statusTokenFor('payment', 'failed')).toBe('cancelled');
    expect(statusTokenFor('payment', 'cancelled')).toBe('cancelled');
    expect(statusTokenFor('payment', 'refunded')).toBe('warning');
    expect(statusTokenFor('payment', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="payment" status="succeeded" />);
    expect(screen.getByText('Succeeded')).toBeTruthy();
  });
});

describe('audit display — payment events', () => {
  it('labels and colours payment + invoice payment-state events', () => {
    expect(auditLabel('payment.created')).toBe('Payment created');
    expect(auditLabel('payment.status_changed')).toBe('Payment status changed');
    expect(auditLabel('invoice.payment_state_updated')).toBe('Payment state updated');
    expect(auditColor('payment.archived')).toBe('revoked');
    expect(auditColor('payment.status_changed')).toBe('warning');
    expect(auditColor('invoice.payment_state_updated')).toBe('system');
  });
});

describe('payment client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/payments/PaymentForm.tsx',
    'src/components/portal/payments/PaymentDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE|STRIPE_SECRET|sk_(live|test)/);
    });
  }
  it('InvoicePaymentsSection (server) has no admin/service-role import', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/portal/payments/InvoicePaymentsSection.tsx'), 'utf8');
    expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
  });
});
