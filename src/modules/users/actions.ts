'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createHash, randomUUID } from 'node:crypto';
import { createAdminClient, authAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission, isPlatformSuperAdmin } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { checkRateLimit, userIdentifier, emailIdentifier } from '@/lib/security/ratelimit';
import { enqueueEmail, emailDedupeKey, type OutboxEmailPayload } from '@/lib/outbox/enqueue';
import { processPending } from '@/lib/outbox/worker';
import { deriveFullName } from '@/modules/profile/schema';
import { buildPasswordResetEmail } from '@/modules/auth/emails';
import { buildInviteEmail } from './emails';
import { AVATAR_BUCKET } from '@/lib/security/upload';
import {
  createUserSchema,
  nameUpdateSchema,
  roleChangeSchema,
  statusChangeSchema,
  type UserActionState,
} from './schema';
import { countActiveAdmins, getUserRoleKey, isTargetPlatformSuperAdmin, roleIdByKey } from './queries';
import {
  isSelf,
  isSelfDemotion,
  wouldDisableLastAdmin,
  wouldRemoveLastAdmin,
  wouldArchiveLastAdmin,
  blocksSuperAdmin,
} from './guards';
import { env } from '@/lib/env';
import type { Role } from '@/lib/types/database';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
const RATE = 'Too many requests. Please try again later.';

function sha16(v: string): string {
  return createHash('sha256').update(v).digest('hex').slice(0, 16);
}

function confirmUrl(tokenHash: string, type: 'invite' | 'recovery', next: string): string {
  return (
    `${env.siteUrl}/app/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=${type}&next=${encodeURIComponent(next)}`
  );
}

/** Enqueue + deliver now (Vercel Hobby has no minute cron). Best-effort; the daily cron retries. */
async function deliver(payload: OutboxEmailPayload, dedupeKey: string): Promise<void> {
  await enqueueEmail(payload, dedupeKey);
  try {
    await processPending(5, 'admin-inline');
  } catch {
    /* swallowed — the daily cron sweeps any failures */
  }
}

/** Per actor+target (5/h) and per actor globally (30/h), hashed identifiers only. */
async function rateLimitResend(actorId: string, email: string): Promise<boolean> {
  const perTarget = await checkRateLimit(
    'admin_user_email',
    `${userIdentifier(actorId)}|${emailIdentifier(email)}`,
    5,
    3600,
  );
  const perActor = await checkRateLimit('admin_user_email', userIdentifier(actorId), 30, 3600);
  return perTarget.allowed && perActor.allowed;
}

/** Create + invite a new user. Redirects to the detail page on success. */
export async function createUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.create'))) return { error: NOT_ALLOWED };

  const parsed = createUserSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { firstName, lastName, email, role } = parsed.data;

  const admin = createAdminClient();
  const roleId = await roleIdByKey(role);
  if (!roleId) return { error: GENERIC };

  const created = await authAdmin().createUser({
    email,
    email_confirm: false,
    user_metadata: { first_name: firstName, last_name: lastName, status: 'invited', created_by: actor.id },
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message?.toLowerCase() ?? '';
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return { error: 'A user with this email already exists.' };
    }
    return { error: GENERIC };
  }
  const newId = created.data.user.id;
  const fullName = deriveFullName(firstName, lastName);

  // handle_new_user already created the profile from metadata; set exact values.
  await admin
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, full_name: fullName, status: 'invited', created_by: actor.id })
    .eq('id', newId);

  // One role per user.
  await admin.from('user_roles').delete().eq('user_id', newId);
  await admin.from('user_roles').insert({ user_id: newId, role_id: roleId });

  await logEvent({
    action: 'user.created',
    actorId: actor.id,
    entityType: 'profile',
    entityId: newId,
    entityDisplayName: fullName ?? email,
    metadata: { role },
    source: 'portal',
  });

  // Best-effort branded invite — never blocks user creation (resend available on detail).
  try {
    const link = await authAdmin().generateLink({ type: 'invite', email });
    const tokenHash = link.data?.properties?.hashed_token ?? '';
    if (tokenHash) {
      await deliver(
        buildInviteEmail({ to: email, firstName, actionUrl: confirmUrl(tokenHash, 'invite', '/app/reset-password') }),
        emailDedupeKey('invite', email, sha16(tokenHash)),
      );
      await logEvent({ action: 'user.invited', actorId: actor.id, entityType: 'profile', entityId: newId, source: 'portal' });
    }
  } catch {
    /* invite can be resent from the detail page */
  }

  revalidatePath('/app/users');
  redirect(`/app/users/${newId}`);
}

/** Edit a user's first/last name (full_name derived). */
export async function updateUserName(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.update'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { error: GENERIC };

  const parsed = nameUpdateSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { firstName, lastName } = parsed.data;
  const fullName = deriveFullName(firstName, lastName);

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('profiles')
    .select('first_name,last_name,full_name')
    .eq('id', userId)
    .maybeSingle();
  if (!before) return { error: 'User not found.' };

  const { error } = await admin
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, full_name: fullName })
    .eq('id', userId);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'user.updated',
    actorId: actor.id,
    entityType: 'profile',
    entityId: userId,
    oldValues: { first_name: before.first_name, last_name: before.last_name, full_name: before.full_name },
    newValues: { first_name: firstName, last_name: lastName, full_name: fullName },
    source: 'portal',
  });

  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}

/** Change a user's role with lockout + super-admin protections. */
export async function changeUserRole(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.change_role'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  const parsed = roleChangeSchema.safeParse({ role: formData.get('role') });
  if (!userId || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid role.' };
  const newRole = parsed.data.role as Role;

  if (isSelfDemotion(actor.id, userId, newRole)) return { error: 'You cannot remove your own admin role.' };
  if (blocksSuperAdmin(await isTargetPlatformSuperAdmin(userId), await isPlatformSuperAdmin())) {
    return { error: 'Only a platform super-admin can manage this user.' };
  }

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('status').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  const currentRole = await getUserRoleKey(userId);
  if (wouldRemoveLastAdmin(currentRole, newRole, tp.status === 'active', await countActiveAdmins())) {
    return { error: 'You cannot change the role of the last remaining admin.' };
  }
  if (currentRole === newRole) return { ok: true };

  const roleId = await roleIdByKey(newRole);
  if (!roleId) return { error: GENERIC };
  await admin.from('user_roles').delete().eq('user_id', userId);
  const { error } = await admin.from('user_roles').insert({ user_id: userId, role_id: roleId });
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'user.role_changed',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'profile',
    entityId: userId,
    oldValues: { role: currentRole },
    newValues: { role: newRole },
    source: 'portal',
  });

  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}

/** Enable/disable a user. Status is authoritative; ban is a best-effort immediate revoke. */
export async function setUserStatus(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.disable'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  const parsed = statusChangeSchema.safeParse({ status: formData.get('status') });
  if (!userId || !parsed.success) return { error: parsed.success ? GENERIC : 'Invalid status.' };
  const next = parsed.data.status; // 'active' | 'disabled'

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('status').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };

  if (next === 'disabled') {
    if (isSelf(actor.id, userId)) return { error: 'You cannot disable your own account.' };
    if (blocksSuperAdmin(await isTargetPlatformSuperAdmin(userId), await isPlatformSuperAdmin())) {
      return { error: 'Only a platform super-admin can manage this user.' };
    }
    const currentRole = await getUserRoleKey(userId);
    if (wouldDisableLastAdmin(currentRole, tp.status === 'active', await countActiveAdmins())) {
      return { error: 'You cannot disable the last remaining admin.' };
    }
  }

  const { error } = await admin.from('profiles').update({ status: next }).eq('id', userId);
  if (error) return { error: GENERIC };

  // Best-effort immediate ban/unban. requireAuth() (live status) is the authoritative block,
  // so a failure here is logged-and-ignored, never rolled back.
  try {
    await authAdmin().updateUserById(userId, { ban_duration: next === 'disabled' ? '876600h' : 'none' });
  } catch {
    /* next-request requireAuth() still blocks; nothing to roll back */
  }

  await logEvent({
    action: next === 'disabled' ? 'user.disabled' : 'user.enabled',
    actorId: actor.id,
    severity: next === 'disabled' ? 'warning' : 'info',
    entityType: 'profile',
    entityId: userId,
    oldStatus: tp.status,
    newStatus: next,
    source: 'portal',
  });

  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}

/** Resend the invite to an invited user. */
export async function resendInvite(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.create'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('email,status,first_name').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  if (tp.status !== 'invited') return { error: 'This user is not awaiting an invite.' };
  if (!(await rateLimitResend(actor.id, tp.email))) return { error: RATE };

  try {
    const link = await authAdmin().generateLink({ type: 'invite', email: tp.email });
    const tokenHash = link.data?.properties?.hashed_token ?? '';
    if (!tokenHash) return { error: GENERIC };
    await deliver(
      buildInviteEmail({ to: tp.email, firstName: tp.first_name, actionUrl: confirmUrl(tokenHash, 'invite', '/app/reset-password') }),
      emailDedupeKey('invite', tp.email, sha16(tokenHash)),
    );
  } catch {
    return { error: GENERIC };
  }

  await logEvent({ action: 'user.invite_resent', actorId: actor.id, entityType: 'profile', entityId: userId, source: 'portal' });
  revalidatePath(`/app/users/${userId}`);
  return { ok: true };
}

/** Send a password reset to an active user. */
export async function sendUserPasswordReset(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.update'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('email,status,first_name').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  if (tp.status !== 'active') return { error: 'Password reset is only available for active users.' };
  if (!(await rateLimitResend(actor.id, tp.email))) return { error: RATE };

  try {
    const link = await authAdmin().generateLink({ type: 'recovery', email: tp.email });
    const tokenHash = link.data?.properties?.hashed_token ?? '';
    if (!tokenHash) return { error: GENERIC };
    await deliver(
      buildPasswordResetEmail({ to: tp.email, firstName: tp.first_name, actionUrl: confirmUrl(tokenHash, 'recovery', '/app/reset-password') }),
      emailDedupeKey('password_reset', tp.email, sha16(tokenHash)),
    );
  } catch {
    return { error: GENERIC };
  }

  await logEvent({ action: 'user.password_reset_sent', actorId: actor.id, entityType: 'profile', entityId: userId, source: 'portal' });
  revalidatePath(`/app/users/${userId}`);
  return { ok: true };
}

/**
 * Archive a user (the default "delete"). No hard delete of auth.users. Removes
 * role grants, archives the profile + org memberships, bans the auth user. Keeps
 * the avatar (deleted only on anonymize). Type-to-confirm by target email.
 */
export async function archiveUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.archive'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  const confirmationEmail = String(formData.get('confirmationEmail') ?? '').trim().toLowerCase();
  if (!userId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('email, status').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  if (tp.status === 'archived') return { ok: true };
  if (confirmationEmail !== tp.email.toLowerCase()) return { error: 'The email you typed does not match.' };
  if (isSelf(actor.id, userId)) return { error: 'You cannot archive your own account.' };
  if (blocksSuperAdmin(await isTargetPlatformSuperAdmin(userId), await isPlatformSuperAdmin())) {
    return { error: 'Only a platform super-admin can manage this user.' };
  }
  const removedRole = await getUserRoleKey(userId);
  if (wouldArchiveLastAdmin(removedRole, tp.status === 'active', await countActiveAdmins())) {
    return { error: 'You cannot archive the last remaining admin.' };
  }

  await admin.from('user_roles').delete().eq('user_id', userId);
  const { error } = await admin
    .from('profiles')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id })
    .eq('id', userId);
  if (error) return { error: GENERIC };
  await admin.from('organization_members').update({ status: 'archived' }).eq('user_id', userId);

  // Best-effort permanent ban (status is the authoritative block via requireAuth()).
  try {
    await authAdmin().updateUserById(userId, { ban_duration: '876600h' });
  } catch {
    /* requireAuth() blocks regardless; not rolled back */
  }

  await logEvent({
    action: 'user.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'profile',
    entityId: userId,
    oldStatus: tp.status,
    newStatus: 'archived',
    metadata: removedRole ? { removed_role: removedRole } : null,
    source: 'portal',
  });
  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}

/** Restore an archived user to `disabled` (re-enable to active is a separate step). No role re-grant. */
export async function restoreUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('users.archive'))) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('status').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  if (tp.status !== 'archived') return { error: 'This user is not archived.' };
  if (blocksSuperAdmin(await isTargetPlatformSuperAdmin(userId), await isPlatformSuperAdmin())) {
    return { error: 'Only a platform super-admin can manage this user.' };
  }

  const { error } = await admin
    .from('profiles')
    .update({ status: 'disabled', archived_at: null, archived_by: null })
    .eq('id', userId);
  if (error) return { error: GENERIC };
  await admin.from('organization_members').update({ status: 'disabled' }).eq('user_id', userId);
  try {
    await authAdmin().updateUserById(userId, { ban_duration: 'none' });
  } catch {
    /* will be unbanned on next enable if needed */
  }

  await logEvent({
    action: 'user.restored',
    actorId: actor.id,
    entityType: 'profile',
    entityId: userId,
    oldStatus: 'archived',
    newStatus: 'disabled',
    source: 'portal',
  });
  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}

/**
 * GDPR anonymize an ALREADY-ARCHIVED user. Platform-super-admin only. Irreversible:
 * scrubs profile + auth email + names + avatar, scrubs the denormalised audit actor
 * PII (keeping actor_id/action/timestamps), keeps the auth row banned (no hard delete).
 */
export async function anonymizeUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAuth();
  if (!(await isPlatformSuperAdmin())) return { error: NOT_ALLOWED };
  const userId = String(formData.get('userId') ?? '');
  const confirmationEmail = String(formData.get('confirmationEmail') ?? '').trim().toLowerCase();
  if (!userId) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: tp } = await admin.from('profiles').select('email, status, avatar_url').eq('id', userId).maybeSingle();
  if (!tp) return { error: 'User not found.' };
  if (tp.status !== 'archived') return { error: 'Only archived users can be anonymized.' };
  if (confirmationEmail !== tp.email.toLowerCase()) return { error: 'The email you typed does not match.' };

  const placeholder = `deleted-${randomUUID()}@anonymized.invalid`;

  // Delete avatar object(s) from the private bucket.
  if (tp.avatar_url) {
    try {
      const { data: existing } = await admin.storage.from(AVATAR_BUCKET).list(userId);
      const toRemove = (existing ?? [])
        .filter((o) => o.name.startsWith('avatar.'))
        .map((o) => `${userId}/${o.name}`);
      if (toRemove.length) await admin.storage.from(AVATAR_BUCKET).remove(toRemove);
    } catch {
      /* non-fatal; profile scrub still proceeds */
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ email: placeholder, first_name: null, last_name: null, full_name: null, avatar_url: null })
    .eq('id', userId);
  if (error) return { error: GENERIC };

  // Scrub the Supabase Auth email too (the real login PII); keep the user banned.
  try {
    await authAdmin().updateUserById(userId, { email: placeholder, email_confirm: false });
  } catch {
    /* profile scrub already applied; report nothing sensitive */
  }

  // Approved GDPR exception: scrub denormalised actor PII in audit_logs (service-role RPC),
  // keeping actor_id, action, created_at and entity data intact.
  try {
    await admin.rpc('anonymize_audit_actor', { p_actor_id: userId });
  } catch {
    /* non-fatal */
  }

  await logEvent({
    action: 'user.anonymized',
    actorId: actor.id,
    severity: 'critical',
    entityType: 'profile',
    entityId: userId,
    metadata: { scope: 'pii' },
    source: 'portal',
  });
  revalidatePath(`/app/users/${userId}`);
  revalidatePath('/app/users');
  return { ok: true };
}
