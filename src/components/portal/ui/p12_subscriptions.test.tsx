import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — subscription', () => {
  it('maps Stripe subscription statuses to the right tokens', () => {
    expect(statusTokenFor('subscription', 'active')).toBe('done');
    expect(statusTokenFor('subscription', 'trialing')).toBe('waiting');
    expect(statusTokenFor('subscription', 'past_due')).toBe('warning');
    expect(statusTokenFor('subscription', 'canceled')).toBe('cancelled');
    expect(statusTokenFor('subscription', 'paused')).toBe('waiting');
    expect(statusTokenFor('subscription', 'whatever')).toBe('warning');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="subscription" status="past_due" />);
    expect(screen.getByText('Past Due')).toBeTruthy();
  });
});

describe('audit display — subscription events', () => {
  it('labels and colours the subscription events', () => {
    expect(auditLabel('subscription.linked')).toBe('Subscription linked');
    expect(auditLabel('subscription.synced')).toBe('Synced from Stripe');
    expect(auditLabel('subscription.sync_failed')).toBe('Sync failed');
    expect(auditLabel('subscription.archived')).toBe('Subscription archived');
    expect(auditColor('subscription.linked')).toBe('done');
    expect(auditColor('subscription.synced')).toBe('done');
    expect(auditColor('subscription.sync_failed')).toBe('revoked');
    expect(auditColor('subscription.archived')).toBe('revoked');
    expect(auditColor('subscription.restored')).toBe('done');
  });
});

describe('subscription client components: no service-role / no Stripe secret / no Stripe SDK', () => {
  const clientFiles = [
    'src/components/portal/subscriptions/SubscriptionLinkForm.tsx',
    'src/components/portal/subscriptions/SubscriptionDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/Stripe import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE|STRIPE_SECRET|sk_(live|test)|@\/lib\/stripe\/server|getStripe/);
    });
  }
  it('server-rendered subscription components do not import the Stripe secret client or admin role', () => {
    for (const f of [
      'src/components/portal/subscriptions/SubscriptionTable.tsx',
      'src/components/portal/subscriptions/CompanySubscriptionsSection.tsx',
    ]) {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).not.toMatch(/@\/lib\/stripe\/server|getStripe|createAdminClient|STRIPE_SECRET/);
    }
  });
});
