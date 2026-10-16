/**
 * Avatar upload validation. The MIME + size gate runs here; the actual
 * magic-byte check on the file buffer is enforced in the P2 upload action
 * (it needs the bytes). Kept dependency-free so it is usable on client + server.
 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type AvatarMime = (typeof AVATAR_MIME)[number];

export type AvatarValidation = { ok: true; ext: 'png' | 'jpg' | 'webp' } | { ok: false; error: string };

export function validateAvatarMeta(file: { type: string; size: number }): AvatarValidation {
  if (!AVATAR_MIME.includes(file.type as AvatarMime)) {
    return { ok: false, error: 'Only PNG, JPEG or WebP images are allowed' };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: 'Image must be 2 MB or smaller' };
  }
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  return { ok: true, ext };
}

/** The private storage bucket that holds user avatars. */
export const AVATAR_BUCKET = 'avatars';

/**
 * Server-derived object path for a user's avatar. The folder segment is ALWAYS
 * the user id (own-folder storage RLS), so a client can never influence it.
 */
export function avatarObjectPath(userId: string, ext: 'png' | 'jpg' | 'webp'): string {
  return `${userId}/avatar.${ext}`;
}

/**
 * Magic-byte check on the real file bytes: confirms the leading bytes match the
 * declared extension, so a renamed/forged file (e.g. a script served with an
 * image MIME) is rejected. Covers only the three accepted formats.
 */
export function sniffImageMagic(bytes: Uint8Array, ext: 'png' | 'jpg' | 'webp'): boolean {
  if (ext === 'png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    );
  }
  if (ext === 'jpg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  // webp: "RIFF" .... "WEBP"
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  );
}
