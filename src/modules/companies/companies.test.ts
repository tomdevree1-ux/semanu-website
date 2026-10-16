import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { companyStatusMachine, COMPANY_SELECTABLE_STATUSES, COMPANY_CONFIRM_STATUSES } from './status';
import { isLegalCompanyTransition, confirmMatches } from './guards';
import { companyCreateSchema, companyUpdateSchema } from './schema';
import { companyStatusToken } from '@/lib/status/colors';

describe('companyStatusMachine transitions', () => {
  it('allows the lifecycle forward + back moves', () => {
    expect(canTransition(companyStatusMachine, 'lead', 'qualified')).toBe(true);
    expect(canTransition(companyStatusMachine, 'qualified', 'active')).toBe(true);
    expect(canTransition(companyStatusMachine, 'active', 'dormant')).toBe(true);
    expect(canTransition(companyStatusMachine, 'dormant', 'active')).toBe(true);
    expect(canTransition(companyStatusMachine, 'active', 'lost')).toBe(true);
    expect(canTransition(companyStatusMachine, 'lost', 'lead')).toBe(true);
    expect(canTransition(companyStatusMachine, 'active', 'blocked')).toBe(true);
    expect(canTransition(companyStatusMachine, 'blocked', 'lead')).toBe(true);
  });
  it('rejects illegal jumps and any archived transition (archive is a dedicated action)', () => {
    expect(canTransition(companyStatusMachine, 'lead', 'active')).toBe(false);
    expect(canTransition(companyStatusMachine, 'lead', 'archived')).toBe(false);
    expect(canTransition(companyStatusMachine, 'archived', 'lead')).toBe(false);
    expect(isLegalCompanyTransition('lead', 'active')).toBe(false);
    expect(isLegalCompanyTransition('qualified', 'lead')).toBe(true);
  });
  it('selectable statuses exclude archived; blocked needs confirm', () => {
    expect(COMPANY_SELECTABLE_STATUSES).not.toContain('archived');
    expect(COMPANY_SELECTABLE_STATUSES).toContain('lost');
    expect(COMPANY_CONFIRM_STATUSES.has('blocked')).toBe(true);
  });
});

describe('companyStatusToken mapping (Part V §V1)', () => {
  it('maps each status to its semantic token', () => {
    expect(companyStatusToken('lead')).toBe('draft');
    expect(companyStatusToken('qualified')).toBe('waiting');
    expect(companyStatusToken('active')).toBe('done');
    expect(companyStatusToken('dormant')).toBe('system');
    expect(companyStatusToken('lost')).toBe('cancelled');
    expect(companyStatusToken('blocked')).toBe('revoked');
    expect(companyStatusToken('archived')).toBe('cancelled');
  });
});

describe('companyCreateSchema validation', () => {
  it('requires a company name and defaults country to CH', () => {
    const ok = companyCreateSchema.safeParse({ companyName: 'Acme AG', country: '' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.country).toBe('CH');
      expect(ok.data.domain ?? null).toBeNull();
    }
    expect(companyCreateSchema.safeParse({ companyName: '' }).success).toBe(false);
  });
  it('rejects a malformed email but accepts a blank one', () => {
    expect(companyCreateSchema.safeParse({ companyName: 'X', email: 'nope' }).success).toBe(false);
    const blank = companyCreateSchema.safeParse({ companyName: 'X', email: '' });
    expect(blank.success).toBe(true);
  });
  it('update accepts an owner id or a blank owner', () => {
    expect(companyUpdateSchema.safeParse({ companyName: 'X', ownerId: '' }).success).toBe(true);
    expect(companyUpdateSchema.safeParse({ companyName: 'X', ownerId: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('confirmMatches (type-to-confirm)', () => {
  it('is case/space-insensitive', () => {
    expect(confirmMatches('  Acme AG ', 'acme ag')).toBe(true);
    expect(confirmMatches('Other', 'Acme AG')).toBe(false);
  });
});

describe('companies actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/companies/actions.ts'), 'utf8');
  it('is a server module that gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createCompany[\s\S]*?hasPermission\('companies\.create'\)/);
    expect(src).toMatch(/updateCompany[\s\S]*?hasPermission\('companies\.update'\)/);
    expect(src).toMatch(/changeCompanyStatus[\s\S]*?hasPermission\('companies\.update'\)/);
    expect(src).toMatch(/archiveCompany[\s\S]*?hasPermission\('companies\.archive'\)/);
    expect(src).toMatch(/restoreCompany[\s\S]*?hasPermission\('companies\.archive'\)/);
  });
  it('never hard-deletes; uses the transition guard + type-to-confirm', () => {
    expect(src).not.toMatch(/\.delete\(/);
    expect(src).toContain('isLegalCompanyTransition');
    expect(src).toContain('confirmMatches');
  });
  it('createCompany pins source=manual, crm_status=lead, lead_status=waiting_for_review (audit #1)', () => {
    const c = src.indexOf('export async function createCompany');
    const insertBlock = src.slice(src.indexOf('.insert(', c), src.indexOf('.select(', c));
    expect(insertBlock).toContain("source: 'manual'");
    expect(insertBlock).toContain("crm_status: 'lead'");
    expect(insertBlock).toContain("lead_status: 'waiting_for_review'");
  });
  it('lead_status is written ONLY by createCompany; update/status/archive/restore never touch it', () => {
    // The single `lead_status:` assignment is the createCompany insert above.
    expect((src.match(/lead_status:/g) ?? []).length).toBe(1);
    const u = src.indexOf('export async function updateCompany');
    const updateBlock = src.slice(u, src.indexOf('export async function changeCompanyStatus'));
    expect(updateBlock).not.toContain('lead_status');
  });
  it('company.updated audit metadata carries only changed field names (no raw values)', () => {
    const i = src.indexOf("action: 'company.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('metadata: { fields: changed }');
  });
});
