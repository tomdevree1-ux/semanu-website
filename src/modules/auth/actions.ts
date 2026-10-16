'use server';

import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient, authAdmin } from '@/lib/supabase/admin';
import { loginSchema, forgotPasswordSchema, setPasswordSchema, type AuthState } from './schema';
import { requestContext, emailHash, safeNext } from './queries';
import { checkRateLimit, ipIdentifier, emailIdentifier } from '@/lib/security/ratelimit';
import { logEvent } from '@/lib/audit/log';
import { enqueueEmail, emailDedupeKey } from '@/lib/outbox/enqueue';
import { processPending } from '@/lib/outbox/worker';
import { buildPasswordResetEmail } from './emails';
import { LOGIN_PATH } from '@/lib/security/rbac';
import { env } from '@/lib/env';

const LOGIN_ERROR = 'Invalid email or password.';
const RATE_ERROR = 'Too many attempts. Please try again later.';
const DISABLED_ERROR = 'Your account has been deactivated. Contact your administrator.';
const RESET_LINK_BAD = 'This link is invalid or has expired. Request a new one.';

/** Email + password sign-in. Generic errors; disabled accounts rejected. */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: LOGIN_ERROR };
  const { email, password } = parsed.data;
  const next = safeNext(formData.get('next')?.toString());
  const { ip, userAgent } = await requestContext();

  const ipOk = (await checkRateLimit('login', ipIdentifier(ip), 10, 900)).allowed;
  const emailOk = (await checkRateLimit('login', emailIdentifier(email), 5, 900)).allowed;
  if (!ipOk || !emailOk) return { error: RATE_ERROR };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await logEvent({
      action: 'auth.login_failed',
      severity: 'warning',
      source: 'portal',
      metadata: { email_hash: emailHash(email) },
      ip,
      userAgent,
    });
    return { error: LOGIN_ERROR };
  }

  // Disabled-user gate (service role, no RLS/session timing surprises).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('status')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut();
    await logEvent({ action: 'auth.disabled_user_blocked', severity: 'warning', actorId: data.user.id, ip, userAgent });
    return { error: DISABLED_ERROR };
  }

  await admin.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);
  await logEvent({ action: 'auth.login_success', actorId: data.user.id, ip, userAgent });
  redirect(next);
}

/** Sign out and return to the login page. */
export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) await logEvent({ action: 'auth.logout', actorId: user.id });
  redirect(LOGIN_PATH);
}

/** Request a password reset. Always returns the same generic result (no enumeration). */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { ok: true };
  const { email } = parsed.data;
  const { ip, userAgent } = await requestContext();

  const ipOk = (await checkRateLimit('password_reset', ipIdentifier(ip), 20, 3600)).allowed;
  const emailOk = (await checkRateLimit('password_reset', emailIdentifier(email), 5, 3600)).allowed;
  if (!ipOk || !emailOk) return { ok: true };

  await logEvent({
    action: 'auth.password_reset_requested',
    source: 'portal',
    metadata: { email_hash: emailHash(email) },
    ip,
    userAgent,
  });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, first_name, status')
    .eq('email', email)
    .maybeSingle();

  if (profile && profile.status === 'active') {
    const { data: link } = await authAdmin().generateLink({ type: 'recovery', email });
    const hashedToken = link?.properties?.hashed_token ?? '';
    if (hashedToken) {
      // Point at our own confirm route (verifyOtp), not the Supabase action_link.
      // A server-generated link has no browser PKCE verifier, so the token_hash
      // flow is the robust path and keeps us off the Supabase redirect allowlist.
      const actionUrl =
        `${env.siteUrl}/app/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}` +
        `&type=recovery&next=${encodeURIComponent('/app/reset-password')}`;
      const dedupe = emailDedupeKey(
        'password_reset',
        email,
        createHash('sha256').update(hashedToken).digest('hex').slice(0, 16),
      );
      const outboxId = await enqueueEmail(
        buildPasswordResetEmail({ to: email, firstName: profile.first_name, actionUrl }),
        dedupe,
      );
      if (outboxId) {
        await logEvent({
          action: 'auth.password_reset_email_enqueued',
          actorId: profile.id,
          metadata: { outbox_id: outboxId },
        });
      }
      // Vercel Hobby has no minute-level cron, so deliver the queued mail now.
      // Outbox semantics stay intact: the daily cron is a retry sweep for any
      // transient Resend failure. Best-effort — never surfaces to the caller.
      try {
        await processPending(5, 'reset-inline');
      } catch {
        /* swallowed: the cron retries failed/pending rows */
      }
    }
  }
  return { ok: true };
}

/** Set a new password from a valid recovery session; activate an invited account. */
export async function setNewPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid password.' };

  const { ip } = await requestContext();
  await checkRateLimit('password_reset_submit', ipIdentifier(ip), 10, 3600);

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: RESET_LINK_BAD };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'Could not update the password. Please request a new link.' };

  const admin = createAdminClient();
  await admin.from('profiles').update({ status: 'active' }).eq('id', user.id).eq('status', 'invited');
  await logEvent({ action: 'auth.password_reset_completed', severity: 'warning', actorId: user.id, ip });
  redirect(`${LOGIN_PATH}?reset=ok`);
}
