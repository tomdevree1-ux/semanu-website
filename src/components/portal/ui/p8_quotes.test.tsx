import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — quote', () => {
  it('maps quote statuses to the right tokens', () => {
    expect(statusTokenFor('quote', 'draft')).toBe('draft');
    expect(statusTokenFor('quote', 'sent')).toBe('sent');
    expect(statusTokenFor('quote', 'accepted')).toBe('done');
    expect(statusTokenFor('quote', 'declined')).toBe('cancelled');
    expect(statusTokenFor('quote', 'expired')).toBe('warning');
    expect(statusTokenFor('quote', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="quote" status="accepted" />);
    expect(screen.getByText('Accepted')).toBeTruthy();
  });
});

describe('audit display — quote events', () => {
  it('labels and colours quote + line events', () => {
    expect(auditLabel('quote.created')).toBe('Quote created');
    expect(auditLabel('quote.item_added')).toBe('Line added');
    expect(auditLabel('quote.items_reordered')).toBe('Lines reordered');
    expect(auditColor('quote.archived')).toBe('revoked');
    expect(auditColor('quote.status_changed')).toBe('warning');
    expect(auditColor('quote.item_removed')).toBe('warning');
  });
});

describe('quote client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/quotes/QuoteForm.tsx',
    'src/components/portal/quotes/QuoteDetailActions.tsx',
    'src/components/portal/quotes/LineItemEditor.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    });
  }
});
