import { z } from 'zod';

/**
 * One self-service name field: trims, caps length, blocks angle brackets
 * (defense in depth on top of React escaping), and maps an empty value to null.
 * Spaces, hyphens and apostrophes are allowed (real names). Output: string | null.
 */
const nameField = z
  .string()
  .trim()
  .max(80, 'Use 80 characters or fewer')
  .refine((v) => !v.includes('<') && !v.includes('>'), 'Please remove the < and > characters')
  .optional()
  .transform((v) => {
    const t = (v ?? '').trim();
    return t.length ? t : null;
  });

/** A normal user may edit only their first and last name (avatar is separate). */
export const profileUpdateSchema = z.object({
  first_name: nameField,
  last_name: nameField,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Action result for useActionState, mirroring the P1 auth-form convention. */
export type ProfileFormState = { ok?: boolean; error?: string };

/** Server-side derivation: keep full_name consistent with first + last name. */
export function deriveFullName(first: string | null, last: string | null): string | null {
  const parts = [first, last].map((s) => (s ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}
