import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/security/rbac';
import { AVATAR_BUCKET } from '@/lib/security/upload';
import type { Profile } from '@/modules/users/types';

/** The current user's own profile row (RLS-scoped via the SSR client). */
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ?? null;
}

/**
 * Short-lived signed URL for a stored avatar path. The private bucket means we
 * never store or expose a public URL. Verifies the path is in the caller's own
 * folder before signing. Returns null when absent or not the caller's object.
 */
export async function getSignedAvatarUrl(
  path: string | null,
  ttlSeconds = 60,
): Promise<string | null> {
  if (!path) return null;
  const user = await getSessionUser();
  if (!user) return null;
  if (path.split('/')[0] !== user.id) return null; // own-folder only
  const supabase = await createServerSupabase();
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, ttlSeconds);
  return data?.signedUrl ?? null;
}
