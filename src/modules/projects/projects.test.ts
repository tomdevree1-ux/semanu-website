import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { projectStatusMachine, PROJECT_SELECTABLE_STATUSES, PROJECT_CONFIRM_STATUSES } from './status';
import { isLegalProjectTransition, confirmMatches, contactBelongsToCompany } from './guards';
import { projectCreateSchema, projectUpdateSchema } from './schema';
import { projectStatusToken } from '@/lib/status/colors';

describe('projectStatusMachine transitions', () => {
  it('allows the lifecycle + reopen moves', () => {
    expect(canTransition(projectStatusMachine, 'draft', 'active')).toBe(true);
    expect(canTransition(projectStatusMachine, 'active', 'on_hold')).toBe(true);
    expect(canTransition(projectStatusMachine, 'on_hold', 'active')).toBe(true);
    expect(canTransition(projectStatusMachine, 'active', 'completed')).toBe(true);
    expect(canTransition(projectStatusMachine, 'on_hold', 'completed')).toBe(true);
    expect(canTransition(projectStatusMachine, 'completed', 'active')).toBe(true); // reopen
    expect(canTransition(projectStatusMachine, 'active', 'cancelled')).toBe(true);
    expect(canTransition(projectStatusMachine, 'cancelled', 'draft')).toBe(true); // reopen
  });
  it('rejects illegal jumps and any archived transition (archive is a dedicated action)', () => {
    expect(canTransition(projectStatusMachine, 'draft', 'completed')).toBe(false);
    expect(canTransition(projectStatusMachine, 'draft', 'on_hold')).toBe(false);
    expect(canTransition(projectStatusMachine, 'draft', 'archived')).toBe(false);
    expect(canTransition(projectStatusMachine, 'archived', 'draft')).toBe(false);
    expect(isLegalProjectTransition('draft', 'completed')).toBe(false);
    expect(isLegalProjectTransition('draft', 'active')).toBe(true);
  });
  it('selectable statuses exclude archived; cancelled needs confirm', () => {
    expect(PROJECT_SELECTABLE_STATUSES).not.toContain('archived');
    expect(PROJECT_CONFIRM_STATUSES.has('cancelled')).toBe(true);
    expect(PROJECT_CONFIRM_STATUSES.has('completed')).toBe(false);
  });
});

describe('projectStatusToken mapping (Part V §V1)', () => {
  it('maps each status to its semantic token', () => {
    expect(projectStatusToken('draft')).toBe('draft');
    expect(projectStatusToken('active')).toBe('done');
    expect(projectStatusToken('on_hold')).toBe('waiting');
    expect(projectStatusToken('completed')).toBe('done');
    expect(projectStatusToken('cancelled')).toBe('cancelled');
    expect(projectStatusToken('archived')).toBe('cancelled');
  });
});

describe('project schema validation', () => {
  it('requires a company id and a name; dates optional', () => {
    const ok = projectCreateSchema.safeParse({ companyId: '11111111-1111-1111-1111-111111111111', name: 'Site rebuild' });
    expect(ok.success).toBe(true);
    expect(projectCreateSchema.safeParse({ companyId: 'nope', name: 'X' }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ companyId: '11111111-1111-1111-1111-111111111111', name: '' }).success).toBe(false);
  });
  it('accepts a valid date and rejects a malformed one', () => {
    const base = { companyId: '11111111-1111-1111-1111-111111111111', name: 'X' };
    expect(projectCreateSchema.safeParse({ ...base, dueDate: '2026-07-01' }).success).toBe(true);
    expect(projectCreateSchema.safeParse({ ...base, dueDate: '01-07-2026' }).success).toBe(false);
    expect(projectCreateSchema.safeParse({ ...base, dueDate: '' }).success).toBe(true);
  });
  it('update schema has no companyId field (company is fixed after create)', () => {
    expect(Object.keys(projectUpdateSchema.shape)).not.toContain('companyId');
  });
});

describe('guards', () => {
  it('contactBelongsToCompany + confirmMatches', () => {
    expect(contactBelongsToCompany('c1', 'c1')).toBe(true);
    expect(contactBelongsToCompany('c2', 'c1')).toBe(false);
    expect(contactBelongsToCompany(null, 'c1')).toBe(false);
    expect(confirmMatches('  Site Rebuild ', 'site rebuild')).toBe(true);
  });
});

describe('projects actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/projects/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createProject[\s\S]*?hasPermission\('projects\.create'\)/);
    expect(src).toMatch(/updateProject[\s\S]*?hasPermission\('projects\.update'\)/);
    expect(src).toMatch(/changeProjectStatus[\s\S]*?hasPermission\('projects\.update'\)/);
    expect(src).toMatch(/archiveProject[\s\S]*?hasPermission\('projects\.archive'\)/);
    expect(src).toMatch(/restoreProject[\s\S]*?hasPermission\('projects\.archive'\)/);
  });
  it('never hard-deletes; create pins draft + blocks archived company + validates the contact', () => {
    expect(src).not.toMatch(/\.delete\(/);
    expect(src).toContain("status: 'draft'");
    expect(src).toContain('archived company');
    expect(src).toContain('validateContact');
    expect(src).toContain('isLegalProjectTransition');
    expect(src).toContain('confirmMatches');
  });
  it('updateProject never writes company_id (P6-D9)', () => {
    const u = src.indexOf('export async function updateProject');
    const nextStart = src.indexOf('const next = {', u);
    const nextBlock = src.slice(nextStart, src.indexOf('};', nextStart));
    expect(nextBlock).not.toContain('company_id');
  });
  it('project.updated metadata carries changed field names + company_id only (no raw PII)', () => {
    const i = src.indexOf("action: 'project.updated'");
    const block = src.slice(i, src.indexOf('});', i) + 3);
    expect(block).toContain('metadata: { fields: changed, company_id: before.company_id }');
    const meta = block.slice(block.indexOf('metadata: {'), block.indexOf('},', block.indexOf('metadata: {')));
    expect(meta).not.toMatch(/name:|description:|email|phone/);
  });
});
