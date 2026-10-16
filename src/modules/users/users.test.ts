import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createUserSchema,
  nameUpdateSchema,
  roleChangeSchema,
  statusChangeSchema,
  resendSchema,
  ROLES,
  ROLE_LABELS,
} from './schema';
import {
  isSelf,
  isSelfDemotion,
  wouldDisableLastAdmin,
  wouldRemoveLastAdmin,
  blocksSuperAdmin,
} from './guards';
import { auditLabel, auditColor } from '@/lib/audit/display';
import { userStatusToken } from '@/lib/status/colors';

describe('user schemas', () => {
  it('createUserSchema: valid input passes; email lowercased', () => {
    const ok = createUserSchema.safeParse({ firstName: 'Tom', lastName: 'de Vree', email: 'Tom@X.com', role: 'analyst' });
    expect(ok.success && ok.data.email).toBe('tom@x.com');
    expect(ok.success && ok.data.role).toBe('analyst');
  });
  it('createUserSchema: rejects bad email, long name, angle brackets, bad role', () => {
    expect(createUserSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'nope', role: 'analyst' }).success).toBe(false);
    expect(createUserSchema.safeParse({ firstName: 'a'.repeat(81), lastName: 'B', email: 'a@b.com', role: 'analyst' }).success).toBe(false);
    expect(createUserSchema.safeParse({ firstName: '<b>', lastName: 'B', email: 'a@b.com', role: 'analyst' }).success).toBe(false);
    expect(createUserSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'a@b.com', role: 'superuser' }).success).toBe(false);
  });
  it('nameUpdateSchema requires both names', () => {
    expect(nameUpdateSchema.safeParse({ firstName: 'Tom', lastName: 'V' }).success).toBe(true);
    expect(nameUpdateSchema.safeParse({ firstName: '', lastName: 'V' }).success).toBe(false);
  });
  it('roleChangeSchema only accepts catalog roles', () => {
    expect(roleChangeSchema.safeParse({ role: 'reviewer' }).success).toBe(true);
    expect(roleChangeSchema.safeParse({ role: 'owner' }).success).toBe(false);
  });
  it('statusChangeSchema only toggles active/disabled (never invited)', () => {
    expect(statusChangeSchema.safeParse({ status: 'disabled' }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ status: 'active' }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ status: 'invited' }).success).toBe(false);
  });
  it('resendSchema enumerates invite/password_reset', () => {
    expect(resendSchema.safeParse({ kind: 'invite' }).success).toBe(true);
    expect(resendSchema.safeParse({ kind: 'nope' }).success).toBe(false);
  });
  it('ROLE_LABELS covers every role', () => {
    for (const r of ROLES) expect(typeof ROLE_LABELS[r]).toBe('string');
  });
});

describe('lockout / privilege guards (pure)', () => {
  it('isSelf + isSelfDemotion', () => {
    expect(isSelf('a', 'a')).toBe(true);
    expect(isSelf('a', 'b')).toBe(false);
    expect(isSelfDemotion('a', 'a', 'analyst')).toBe(true);
    expect(isSelfDemotion('a', 'a', 'admin')).toBe(false); // staying admin is fine
    expect(isSelfDemotion('a', 'b', 'analyst')).toBe(false);
  });
  it('wouldDisableLastAdmin only when target is the sole active admin', () => {
    expect(wouldDisableLastAdmin('admin', true, 1)).toBe(true);
    expect(wouldDisableLastAdmin('admin', true, 2)).toBe(false);
    expect(wouldDisableLastAdmin('analyst', true, 1)).toBe(false);
    expect(wouldDisableLastAdmin('admin', false, 1)).toBe(false);
  });
  it('wouldRemoveLastAdmin only when demoting the sole active admin', () => {
    expect(wouldRemoveLastAdmin('admin', 'analyst', true, 1)).toBe(true);
    expect(wouldRemoveLastAdmin('admin', 'admin', true, 1)).toBe(false); // not a demotion
    expect(wouldRemoveLastAdmin('admin', 'analyst', true, 2)).toBe(false);
    expect(wouldRemoveLastAdmin('analyst', 'sales', true, 1)).toBe(false);
  });
  it('blocksSuperAdmin only blocks a non-super actor', () => {
    expect(blocksSuperAdmin(true, false)).toBe(true);
    expect(blocksSuperAdmin(true, true)).toBe(false);
    expect(blocksSuperAdmin(false, false)).toBe(false);
  });
});

describe('audit display + status mapping', () => {
  it('labels/colors resolve for P3 + P2 actions', () => {
    expect(auditLabel('user.role_changed')).toBe('Role changed');
    expect(auditLabel('user.invite_resent')).toBe('Invite resent');
    expect(auditLabel('profile.avatar_uploaded')).toBe('Photo updated');
    expect(auditColor('user.disabled')).toBe('revoked');
    expect(auditColor('user.created')).toBe('done');
    expect(auditColor('unknown.action')).toBe('system'); // graceful default
  });
  it('userStatusToken maps account states', () => {
    expect(userStatusToken('active')).toBe('done');
    expect(userStatusToken('invited')).toBe('waiting');
    expect(userStatusToken('disabled')).toBe('revoked');
  });
});

describe('client components never import the service-role client', () => {
  const root = process.cwd();
  const clientFiles = [
    'src/components/portal/users/UserForm.tsx',
    'src/components/portal/users/UserDetailActions.tsx',
    'src/components/portal/history/HistoryButton.tsx',
    'src/components/portal/history/HistoryDrawer.tsx',
    'src/components/portal/history/HistoryTimeline.tsx',
  ];
  it('contain "use client" and no admin/service-role references', () => {
    for (const rel of clientFiles) {
      const src = readFileSync(join(root, rel), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    }
  });
});
