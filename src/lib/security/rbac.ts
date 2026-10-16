import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  hasPermission,
  isOrgAdmin,
  isPlatformSuperAdmin,
  getUserPermissions,
  currentOrg,
} from './authorize';
import type { Profile } from '@/modules/users/types';

/**
 * Server-side route + action guards. SERVER ONLY (import from layouts, Server
 * Components, Route Handlers, Server Actions). Authorization is enforced here
 * AND in the database (RLS + has_permission + the profiles privilege guard);
 * the UI is never the security boundary, so every protected page/action calls
 * one of these. getUser() revalidates the JWT with Supabase Auth, so a tampered
 * cookie cannot pass.
 */

export const LOGIN_PATH = '/app/login';
export const DASHBOARD_PATH = '/app/dashboard';

/** Revalidated session user. Memoized per request so repeated guards share one `auth.getUser()` call. */
export const getSessionUser = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/** Current profile. Memoized per request: requireAuth + the layout + the page no longer re-fetch it. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ?? null;
});

/** Require any active, signed-in user. */
export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'active') redirect(LOGIN_PATH);
  return profile;
}

/**
 * Require a specific permission. `requireAuth()` first enforces an active, signed-in user; the check then
 * reads the per-request cached permission set (equivalent to `has_permission` for an active user, but it
 * reuses the one cached RPC instead of a fresh round-trip per page).
 */
export async function requirePermission(key: string): Promise<Profile> {
  const profile = await requireAuth();
  const keys = await getUserPermissions();
  if (!keys.includes(key)) redirect(DASHBOARD_PATH);
  return profile;
}

/** Require an active organization admin (or platform super-admin). */
export async function requireOrgAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (!(await isOrgAdmin())) redirect(DASHBOARD_PATH);
  return profile;
}

/** Non-redirecting capability check for conditional UI / logic. */
export async function can(action: string): Promise<boolean> {
  return hasPermission(action);
}

export { hasPermission, isOrgAdmin, isPlatformSuperAdmin, getUserPermissions, currentOrg };
