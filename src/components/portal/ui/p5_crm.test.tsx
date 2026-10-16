import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — CRM entities', () => {
  it('maps company + contact statuses to the right tokens', () => {
    expect(statusTokenFor('company', 'lead')).toBe('draft');
    expect(statusTokenFor('company', 'active')).toBe('done');
    expect(statusTokenFor('company', 'lost')).toBe('cancelled');
    expect(statusTokenFor('contact', 'blocked')).toBe('revoked');
    expect(statusTokenFor('contact', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label', () => {
    render(<StatusBadge entityType="company" status="qualified" />);
    expect(screen.getByText('Qualified')).toBeTruthy();
  });
});

describe('audit display — CRM events', () => {
  it('labels and colours company + contact events', () => {
    expect(auditLabel('company.created')).toBe('Company created');
    expect(auditLabel('contact.archived')).toBe('Contact archived');
    expect(auditColor('company.archived')).toBe('revoked');
    expect(auditColor('contact.created')).toBe('done');
    expect(auditColor('company.status_changed')).toBe('warning');
  });
});

describe('CRM client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/companies/CompanyForm.tsx',
    'src/components/portal/companies/CompanyDetailActions.tsx',
    'src/components/portal/contacts/ContactForm.tsx',
    'src/components/portal/contacts/ContactDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    });
  }
});
