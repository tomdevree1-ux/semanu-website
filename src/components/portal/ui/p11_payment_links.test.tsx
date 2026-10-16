import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — payment_link', () => {
  it('maps payment-link statuses to the right tokens', () => {
    expect(statusTokenFor('payment_link', 'draft')).toBe('draft');
    expect(statusTokenFor('payment_link', 'active')).toBe('waiting');
    expect(statusTokenFor('payment_link', 'paid')).toBe('done');
    expect(statusTokenFor('payment_link', 'expired')).toBe('warning');
    expect(statusTokenFor('payment_link', 'cancelled')).toBe('cancelled');
    expect(statusTokenFor('payment_link', 'failed')).toBe('cancelled');
    expect(statusTokenFor('payment_link', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="payment_link" status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
});

describe('audit display — payment-link events', () => {
  it('labels and colours payment-link + invoice-side events', () => {
    expect(auditLabel('payment_link.created')).toBe('Payment link created');
    expect(auditLabel('payment_link.stripe_created')).toBe('Stripe link created');
    expect(auditLabel('payment_link.cancelled')).toBe('Payment link cancelled');
    expect(auditLabel('invoice.payment_link_created')).toBe('Payment link created');
    expect(auditColor('payment_link.created')).toBe('done');
    expect(auditColor('payment_link.cancelled')).toBe('warning');
    expect(auditColor('payment_link.failed')).toBe('revoked');
    expect(auditColor('payment_link.archived')).toBe('revoked');
  });
});

describe('payment-link client components: no server-role / no Stripe secret / no Stripe SDK', () => {
  const clientFiles = [
    'src/components/portal/payment-links/InvoicePaymentLinksSection.tsx',
    'src/components/portal/payment-links/PaymentLinkDetailActions.tsx',
    'src/components/portal/payment-links/CopyLinkButton.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/Stripe import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE|STRIPE_SECRET|sk_(live|test)|@\/lib\/stripe\/server|getStripe/);
    });
  }
});
