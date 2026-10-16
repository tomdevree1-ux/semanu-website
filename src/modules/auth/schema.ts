import { z } from 'zod';

/**
 * Validation for the auth flows. Kept separate from the UI so the same
 * schema validates on the client (instant feedback) and again on the
 * server (the authoritative check). Error messages are deliberately
 * generic so they never leak whether an account exists.
 */

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

// Supabase hashes with bcrypt (72-byte cap); 10 is a sensible floor.
const newPassword = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(72, 'Use at most 72 characters');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const setPasswordSchema = z
  .object({
    password: newPassword,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/** Shared result shape for the auth server actions (used by useActionState forms). */
export type AuthState = { error?: string; ok?: boolean };
