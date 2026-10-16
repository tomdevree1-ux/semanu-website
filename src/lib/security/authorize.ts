import 'server-only';
import { cache } from 'react';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Typed wrappers over the database authorization functions. SERVER ONLY.
 * These call the cookie-bound (authenticated) client so `auth.uid()` resolves
 * to the current user; the DB functions are the real source of truth.
 */

export async function currentOrg(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('current_org', {});
  return data ?? null;
}

export async function hasPermission(key: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('has_permission', { p_key: key });
  return data === true;
}

export async function isOrgAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('is_org_admin', {});
  return data === true;
}

export async function isPlatformSuperAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('is_platform_super_admin', {});
  return data === true;
}

/**
 * The current user's resolved permission keys (never reads the catalog tables). Memoized per request
 * with React `cache()`, so the whole portal resolves permissions with ONE RPC per navigation even when
 * the layout, the page guard and the page body all check permissions.
 */
export const getUserPermissions = cache(async (): Promise<string[]> => {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('get_user_permissions', {});
  return data ?? [];
});
