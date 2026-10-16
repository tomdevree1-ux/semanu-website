import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — subscription_change', () => {
  it('maps change-request statuses to the right tokens', () => {
    expect(statusTokenFor('subscription_change', 'draft')).toBe('draft');
    expect(statusTokenFor('subscription_change', 'previewed')).toBe('waiting');
    expect(statusTokenFor('subscription_change', 'executed')).toBe('done');
    expect(statusTokenFor('subscription_change', 'failed')).toBe('warning');
    expect(statusTokenFor('subscription_change', 'cancelled')).toBe('cancelled');
    expect(statusTokenFor('subscription_change', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="subscription_change" status="previewed" />);
    expect(screen.getByText('Previewed')).toBeTruthy();
  });
});

describe('audit display — subscription change events', () => {
  it('labels and colours the P12B1 events', () => {
    expect(auditLabel('subscription.change_requested')).toBe('Change requested');
    expect(auditLabel('subscription.change_previewed')).toBe('Change previewed');
    expect(auditLabel('subscription.change_failed')).toBe('Change failed');
    expect(auditLabel('subscription.change_archived')).toBe('Change archived');
    expect(auditColor('subscription.change_requested')).toBe('system');
    expect(auditColor('subscription.change_previewed')).toBe('sent');
    expect(auditColor('subscription.change_failed')).toBe('revoked');
    expect(auditColor('subscription.change_restored')).toBe('done');
  });
});

describe('subscription-change client components: no server-role / no Stripe secret', () => {
  const clientFiles = [
    'src/components/portal/subscription-changes/SubscriptionActionPanel.tsx',
    'src/components/portal/subscription-changes/ChangeRequestDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/Stripe-secret import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE|STRIPE_SECRET|sk_(live|test)|@\/lib\/stripe\/server|getStripe/);
    });
  }
  it('the subscription-detail panel exposes NO execution (request/preview only)', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/portal/subscription-changes/SubscriptionActionPanel.tsx'), 'utf8');
    expect(src).not.toContain('executeSubscriptionChange');
    expect(src).not.toMatch(/>\s*(Apply|Execute)\b/);
  });
  it('the request-detail execute control is gated (P12B2: admin permission + config flag + executable)', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/portal/subscription-changes/ChangeRequestDetailActions.tsx'), 'utf8');
    expect(src).toContain('executeSubscriptionChange');
    expect(src).toContain('canExecute');
    expect(src).toContain('executionEnabled');
  });
});
