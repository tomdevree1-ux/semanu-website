import { z } from 'zod';
import type { Role, UserStatus } from '@/lib/types/database';

/**
 * Validation for the user-management module. The role/status enums are the
 * single source of truth for the UI dropdowns and the server-side checks, so
 * adding a role later (finance, project_manager, …) is one edit here plus the
 * matching DB role row.
 */
// Live role catalog (smallint roles): admin / analyst / sales / reviewer / read_only.
export const ROLES = ['admin', 'analyst', 'sales', 'reviewer', 'read_only'] as const satisfies readonly Role[];
export const USER_STATUSES = ['active', 'disabled', 'invited', 'archived'] as const satisfies readonly UserStatus[];

// Admin can only toggle between active/disabled (invited is set by the invite flow).
export const TOGGLE_STATUSES = ['active', 'disabled'] as const;

/** Display labels for the role catalog (mirrors public.roles.label). */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  analyst: 'Analyst',
  sales: 'Sales',
  reviewer: 'Reviewer',
  read_only: 'Read-only',
};

const name = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(80, 'Too long')
  .refine((v) => !v.includes('<') && !v.includes('>'), 'Please remove the < and > characters');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

/** Admin creates a new user (the auth user is created server-side after this). No phone in P3. */
export const createUserSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  role: z.enum(ROLES),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Admin edits a user's name only (role + status have dedicated actions). */
export const nameUpdateSchema = z.object({
  firstName: name,
  lastName: name,
});
export type NameUpdateInput = z.infer<typeof nameUpdateSchema>;

/** Admin changes a user's role. */
export const roleChangeSchema = z.object({ role: z.enum(ROLES) });
export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

/** Admin enables/disables a user (never sets `invited`). */
export const statusChangeSchema = z.object({ status: z.enum(TOGGLE_STATUSES) });
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

/** Admin resends an invite (invited user) or a password reset (active user). */
export const resendSchema = z.object({ kind: z.enum(['invite', 'password_reset']) });
export type ResendInput = z.infer<typeof resendSchema>;

/** Action result for useActionState, mirroring the P1/P2 form convention. */
export type UserActionState = { ok?: boolean; error?: string };
