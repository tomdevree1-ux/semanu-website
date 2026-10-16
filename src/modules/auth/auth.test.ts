import { describe, it, expect } from 'vitest';
import { safeNext, emailHash } from './queries';
import { buildPasswordResetEmail } from './emails';
import { loginSchema, forgotPasswordSchema, setPasswordSchema } from './schema';

describe('safeNext (open-redirect guard)', () => {
  it('allows internal /app paths', () => {
    expect(safeNext('/app/dashboard')).toBe('/app/dashboard');
    expect(safeNext('/app/reset-password')).toBe('/app/reset-password');
  });
  it('rejects external / unsafe targets → default dashboard', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/app//evil', '/admin', '/', '', null, undefined, 'app/x', '/app/\\evil']) {
      expect(safeNext(bad as string)).toBe('/app/dashboard');
    }
  });
});

describe('emailHash (no raw PII)', () => {
  it('is deterministic + case-insensitive and never contains the address', () => {
    expect(emailHash('A@B.com')).toMatch(/^[0-9a-f]{64}$/);
    expect(emailHash('a@b.com')).toBe(emailHash('A@B.com'));
    expect(emailHash('a@b.com')).not.toBe(emailHash('c@b.com'));
    expect(emailHash('secret@x.com')).not.toContain('secret@x.com');
  });
});

describe('auth schemas', () => {
  it('login: valid lowercases email; invalid email fails', () => {
    const ok = loginSchema.safeParse({ email: 'User@X.com', password: 'pw' });
    expect(ok.success && ok.data.email).toBe('user@x.com');
    expect(loginSchema.safeParse({ email: 'nope', password: 'pw' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
  it('forgot: accepts a valid email, rejects junk', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(false);
  });
  it('set-password: enforces length + match', () => {
    expect(setPasswordSchema.safeParse({ password: 'short', confirm: 'short' }).success).toBe(false);
    expect(setPasswordSchema.safeParse({ password: 'abcdefghij', confirm: 'abcdefghij' }).success).toBe(true);
    expect(setPasswordSchema.safeParse({ password: 'abcdefghij', confirm: 'different00' }).success).toBe(false);
  });
});

describe('password reset email payload', () => {
  it('targets the outbox password_reset template with the action url', () => {
    const p = buildPasswordResetEmail({ to: 'a@b.com', firstName: 'Tom', actionUrl: 'https://amai.ch/app/auth/callback?code=x' });
    expect(p.template).toBe('password_reset');
    expect(p.to).toBe('a@b.com');
    expect(p.vars.actionUrl).toContain('/app/auth/callback');
    expect(p.vars.firstName).toBe('Tom');
  });
});
