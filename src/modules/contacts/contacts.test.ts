import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { contactStatusMachine, CONTACT_SELECTABLE_STATUSES, CONTACT_CONFIRM_STATUSES } from './status';
import { isLegalContactTransition } from './guards';
import { contactCreateSchema, contactUpdateSchema } from './schema';
import { contactStatusToken } from '@/lib/status/colors';

describe('contactStatusMachine transitions (no `lost`)', () => {
  it('allows the lifecycle moves', () => {
    expect(canTransition(contactStatusMachine, 'lead', 'qualified')).toBe(true);
    expect(canTransition(contactStatusMachine, 'qualified', 'active')).toBe(true);
    expect(canTransition(contactStatusMachine, 'active', 'dormant')).toBe(true);
    expect(canTransition(contactStatusMachine, 'active', 'blocked')).toBe(true);
    expect(canTransition(contactStatusMachine, 'blocked', 'lead')).toBe(true);
  });
  it('rejects illegal jumps, lost, and archived transitions', () => {
    expect(canTransition(contactStatusMachine, 'lead', 'active')).toBe(false);
    expect(isLegalContactTransition('lead', 'lost')).toBe(false);
    expect(isLegalContactTransition('lead', 'archived')).toBe(false);
    expect(CONTACT_SELECTABLE_STATUSES).not.toContain('lost');
    expect(CONTACT_SELECTABLE_STATUSES).not.toContain('archived');
    expect(CONTACT_CONFIRM_STATUSES.has('blocked')).toBe(true);
  });
});

describe('contactStatusToken mapping', () => {
  it('maps each status to its semantic token', () => {
    expect(contactStatusToken('lead')).toBe('draft');
    expect(contactStatusToken('qualified')).toBe('waiting');
    expect(contactStatusToken('active')).toBe('done');
    expect(contactStatusToken('dormant')).toBe('system');
    expect(contactStatusToken('blocked')).toBe('revoked');
    expect(contactStatusToken('archived')).toBe('cancelled');
  });
});

describe('contact schema validation', () => {
  it('requires a company id and a name', () => {
    const ok = contactCreateSchema.safeParse({ companyId: '11111111-1111-1111-1111-111111111111', name: 'Jane' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.isPrimary).toBe(false);
    expect(contactCreateSchema.safeParse({ companyId: 'not-a-uuid', name: 'Jane' }).success).toBe(false);
    expect(contactCreateSchema.safeParse({ companyId: '11111111-1111-1111-1111-111111111111', name: '' }).success).toBe(false);
  });
  it('parses the primary checkbox value', () => {
    const on = contactUpdateSchema.safeParse({ name: 'Jane', isPrimary: 'on' });
    expect(on.success && on.data.isPrimary).toBe(true);
  });
});

describe('contacts actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/contacts/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createContact[\s\S]*?hasPermission\('contacts\.create'\)/);
    expect(src).toMatch(/updateContact[\s\S]*?hasPermission\('contacts\.update'\)/);
    expect(src).toMatch(/changeContactStatus[\s\S]*?hasPermission\('contacts\.update'\)/);
    expect(src).toMatch(/archiveContact[\s\S]*?hasPermission\('contacts\.archive'\)/);
    expect(src).toMatch(/restoreContact[\s\S]*?hasPermission\('contacts\.archive'\)/);
  });
  it('never hard-deletes, requires a company, and confirms before archive', () => {
    expect(src).not.toMatch(/\.delete\(/);
    expect(src).toContain('isLegalContactTransition');
    expect(src).toContain('confirmMatches');
    expect(src).toContain('You cannot add a contact to an archived company');
  });
  it('contact.created references the parent company in metadata', () => {
    const i = src.indexOf("action: 'contact.created'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('company_id: company.id');
  });
  it('contact.updated metadata is field names + company_id only (no raw PII values)', () => {
    const i = src.indexOf("action: 'contact.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    // Exact metadata shape proves only field NAMES + the company id are present.
    expect(block).toContain('metadata: { fields: changed, company_id: before.company_id }');
    // The metadata object itself must not carry raw PII values.
    const meta = block.slice(block.indexOf('metadata: {'), block.indexOf('},', block.indexOf('metadata: {')));
    expect(meta).not.toMatch(/email|phone|name:/);
  });
});
