import { describe, it, expect } from 'vitest';
import { ipIdentifier, emailIdentifier, userIdentifier } from './security/ratelimit';
import { validateAvatarMeta } from './security/upload';
import { emailDedupeKey } from './outbox/enqueue';
import { canTransition, type StatusMachine } from './status/types';
import { auditLabel, auditColor } from './audit/display';

describe('rate-limit identifiers (C7: no raw PII)', () => {
  it('hashes email + ip, leaves user id plain', () => {
    expect(emailIdentifier('User@X.com')).toMatch(/^email_hash:[0-9a-f]{64}$/);
    expect(ipIdentifier('1.2.3.4')).toMatch(/^ip_hash:[0-9a-f]{64}$/);
    expect(userIdentifier('uuid-1')).toBe('user:uuid-1');
  });
  it('is deterministic and case-insensitive for email; differs by value', () => {
    expect(emailIdentifier('a@b.com')).toBe(emailIdentifier('A@B.com'));
    expect(emailIdentifier('a@b.com')).not.toBe(emailIdentifier('c@b.com'));
  });
  it('never embeds the raw address', () => {
    expect(emailIdentifier('secret@x.com')).not.toContain('secret@x.com');
  });
});

describe('avatar validation', () => {
  it('accepts png/jpeg/webp under the size cap', () => {
    expect(validateAvatarMeta({ type: 'image/png', size: 1000 })).toEqual({ ok: true, ext: 'png' });
    expect(validateAvatarMeta({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true, ext: 'jpg' });
    expect(validateAvatarMeta({ type: 'image/webp', size: 1000 })).toEqual({ ok: true, ext: 'webp' });
  });
  it('rejects wrong type and oversize', () => {
    expect(validateAvatarMeta({ type: 'image/gif', size: 1000 }).ok).toBe(false);
    expect(validateAvatarMeta({ type: 'image/png', size: 3 * 1024 * 1024 }).ok).toBe(false);
  });
});

describe('outbox dedupe key (C6)', () => {
  it('is deterministic + lowercased', () => {
    expect(emailDedupeKey('password_reset', 'User@X.com', 'jti1')).toBe('password_reset:user@x.com:jti1');
  });
});

describe('status machine', () => {
  const m: StatusMachine<'draft' | 'sent' | 'done'> = {
    states: { draft: { label: 'Draft', color: 'draft' }, sent: { label: 'Sent', color: 'sent' }, done: { label: 'Done', color: 'done', terminal: true } },
    transitions: [
      { from: 'draft', to: 'sent', permission: 'x.send' },
      { from: 'sent', to: 'done' },
    ],
  };
  it('allows declared transitions, forbids the rest', () => {
    expect(canTransition(m, 'draft', 'sent')).toBe(true);
    expect(canTransition(m, 'sent', 'done')).toBe(true);
    expect(canTransition(m, 'draft', 'done')).toBe(false);
    expect(canTransition(m, 'done', 'draft')).toBe(false);
  });
});

describe('audit display', () => {
  it('maps known actions and falls back gracefully', () => {
    expect(auditLabel('user.created')).toBe('User created');
    expect(auditLabel('foo.bar_baz')).toBe('foo bar baz');
    expect(auditColor('user.disabled')).toBe('revoked');
    expect(auditColor('something.unknown')).toBe('system');
  });
});
