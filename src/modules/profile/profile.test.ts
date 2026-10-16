import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { profileUpdateSchema, deriveFullName } from './schema';
import { validateAvatarMeta, sniffImageMagic, avatarObjectPath } from '../../lib/security/upload';

describe('profileUpdateSchema', () => {
  it('trims, allows spaces/hyphens, maps empty to null', () => {
    const ok = profileUpdateSchema.safeParse({ first_name: '  Tom  ', last_name: 'de Vree' });
    expect(ok.success && ok.data.first_name).toBe('Tom');
    expect(ok.success && ok.data.last_name).toBe('de Vree');

    const hyphen = profileUpdateSchema.safeParse({ first_name: 'Marie-Claire', last_name: undefined });
    expect(hyphen.success && hyphen.data.first_name).toBe('Marie-Claire');
    expect(hyphen.success && hyphen.data.last_name).toBe(null);

    const emptyVals = profileUpdateSchema.safeParse({ first_name: '', last_name: '   ' });
    expect(emptyVals.success && emptyVals.data.first_name).toBe(null);
    expect(emptyVals.success && emptyVals.data.last_name).toBe(null);
  });

  it('rejects over-long names and angle brackets', () => {
    expect(profileUpdateSchema.safeParse({ first_name: 'a'.repeat(81) }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ first_name: '<script>' }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ last_name: 'a>b' }).success).toBe(false);
  });
});

describe('deriveFullName', () => {
  it('joins first + last, trims, nulls when empty', () => {
    expect(deriveFullName('Tom', 'de Vree')).toBe('Tom de Vree');
    expect(deriveFullName('Tom', null)).toBe('Tom');
    expect(deriveFullName(null, 'de Vree')).toBe('de Vree');
    expect(deriveFullName(null, null)).toBe(null);
    expect(deriveFullName('  ', '  ')).toBe(null);
  });
});

describe('validateAvatarMeta', () => {
  it('accepts png/jpeg/webp with the right ext', () => {
    expect(validateAvatarMeta({ type: 'image/png', size: 1000 })).toEqual({ ok: true, ext: 'png' });
    expect(validateAvatarMeta({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true, ext: 'jpg' });
    expect(validateAvatarMeta({ type: 'image/webp', size: 1000 })).toEqual({ ok: true, ext: 'webp' });
  });
  it('rejects wrong MIME and oversized files', () => {
    expect(validateAvatarMeta({ type: 'image/gif', size: 1000 }).ok).toBe(false);
    expect(validateAvatarMeta({ type: 'application/pdf', size: 1000 }).ok).toBe(false);
    expect(validateAvatarMeta({ type: 'image/png', size: 3 * 1024 * 1024 }).ok).toBe(false);
  });
});

describe('sniffImageMagic', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

  it('accepts real headers for the matching ext', () => {
    expect(sniffImageMagic(png, 'png')).toBe(true);
    expect(sniffImageMagic(jpg, 'jpg')).toBe(true);
    expect(sniffImageMagic(webp, 'webp')).toBe(true);
  });
  it('rejects forged / mismatched / truncated headers', () => {
    expect(sniffImageMagic(jpg, 'png')).toBe(false); // jpeg bytes claimed as png
    expect(sniffImageMagic(png, 'webp')).toBe(false);
    expect(sniffImageMagic(new Uint8Array([0x89]), 'png')).toBe(false); // too short
    expect(sniffImageMagic(new Uint8Array([0x00, 0x01, 0x02]), 'jpg')).toBe(false);
  });
});

describe('avatarObjectPath (path is server-derived, never client-controlled)', () => {
  it('always scopes to the user id folder', () => {
    expect(avatarObjectPath('user-123', 'png')).toBe('user-123/avatar.png');
    expect(avatarObjectPath('user-123', 'webp')).toBe('user-123/avatar.webp');
    // the function only accepts (userId, ext): there is no input through which a
    // caller could inject a different folder or "../" traversal.
  });
});

describe('client components never import the service-role client', () => {
  const root = process.cwd();
  const clientFiles = [
    'src/components/portal/profile/ProfileForm.tsx',
    'src/components/portal/profile/AvatarUpload.tsx',
    'src/components/portal/ui/Avatar.tsx',
  ];
  it('contain no admin / service-role references', () => {
    for (const rel of clientFiles) {
      const src = readFileSync(join(root, rel), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    }
  });
});
