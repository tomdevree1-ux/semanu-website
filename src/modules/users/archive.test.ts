import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wouldArchiveLastAdmin, wouldDisableLastAdmin } from './guards';
import { USER_STATUSES } from './schema';
import { verifyTurnstile, clientIp } from '@/lib/security/turnstile';

describe('archive guards + statuses', () => {
  it('wouldArchiveLastAdmin matches wouldDisableLastAdmin', () => {
    expect(wouldArchiveLastAdmin).toBe(wouldDisableLastAdmin);
    expect(wouldArchiveLastAdmin('admin', true, 1)).toBe(true);
    expect(wouldArchiveLastAdmin('admin', true, 2)).toBe(false);
    expect(wouldArchiveLastAdmin('analyst', true, 1)).toBe(false);
  });
  it('USER_STATUSES includes archived', () => {
    expect(USER_STATUSES).toContain('archived');
  });
});

describe('Turnstile verify (fail-safe when unconfigured)', () => {
  it('returns true when no secret is configured (forms keep working)', async () => {
    // TURNSTILE_SECRET_KEY is unset in tests → fail-safe true, no network call.
    expect(await verifyTurnstile(undefined)).toBe(true);
    expect(await verifyTurnstile('whatever')).toBe(true);
  });
  it('clientIp prefers cf-connecting-ip, then x-forwarded-for', () => {
    expect(clientIp(new Request('http://x', { headers: { 'cf-connecting-ip': '9.9.9.9' } }))).toBe('9.9.9.9');
    expect(clientIp(new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }))).toBe('1.2.3.4');
    expect(clientIp(new Request('http://x'))).toBe('unknown');
  });
});

describe('anonymize never logs PII in the audit event', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/users/actions.ts'), 'utf8');
  // Isolate the anonymizeUser logEvent block.
  const anonLog = src.slice(src.indexOf("action: 'user.anonymized'"));
  const block = anonLog.slice(0, anonLog.indexOf('});') + 3);
  it('user.anonymized metadata is only { scope } and contains no PII fields', () => {
    expect(block).toContain("metadata: { scope: 'pii' }");
    expect(block).not.toMatch(/email|first_name|last_name|full_name|placeholder|avatar/);
  });
});

describe('archive UI: ConfirmDialog is a client component with no service-role', () => {
  const src = readFileSync(join(process.cwd(), 'src/components/portal/ui/ConfirmDialog.tsx'), 'utf8');
  it('uses use client and imports no admin/service-role client', () => {
    expect(src).toContain("'use client'");
    expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role/);
  });
});
