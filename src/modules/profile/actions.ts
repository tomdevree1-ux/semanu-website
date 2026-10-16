'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/security/rbac';
import { logEvent } from '@/lib/audit/log';
import {
  validateAvatarMeta,
  sniffImageMagic,
  avatarObjectPath,
  AVATAR_BUCKET,
} from '@/lib/security/upload';
import { profileUpdateSchema, deriveFullName, type ProfileFormState } from './schema';

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const PROFILE_PATH = '/app/profile';
const DASHBOARD_PATH = '/app/dashboard';

/** Update the caller's own first/last name; full_name is derived server-side. */
export async function updateMyProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const profile = await requireAuth();

  const parsed = profileUpdateSchema.safeParse({
    first_name: (formData.get('first_name') as string | null) ?? undefined,
    last_name: (formData.get('last_name') as string | null) ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const { first_name, last_name } = parsed.data;
  const full_name = deriveFullName(first_name, last_name);

  // SSR client → RLS (profiles_update_self) + the privileged-column DB guard.
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ first_name, last_name, full_name })
    .eq('id', profile.id);
  if (error) return { error: GENERIC_ERROR };

  await logEvent({
    action: 'profile.updated',
    actorId: profile.id,
    entityType: 'profile',
    entityId: profile.id,
    oldValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.full_name,
    },
    newValues: { first_name, last_name, full_name },
    source: 'portal',
  });

  revalidatePath(PROFILE_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}

/** Upload + set the caller's avatar (own-folder path, server-validated). */
export async function uploadMyAvatar(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const profile = await requireAuth();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image to upload.' };

  const meta = validateAvatarMeta({ type: file.type, size: file.size });
  if (!meta.ok) return { error: meta.error };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageMagic(bytes, meta.ext)) return { error: 'That file is not a valid image.' };

  const supabase = await createServerSupabase();
  const path = avatarObjectPath(profile.id, meta.ext); // never from client input

  // Drop any stale avatar object with a different extension.
  const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(profile.id);
  const stale = (existing ?? [])
    .filter((o) => o.name.startsWith('avatar.') && o.name !== `avatar.${meta.ext}`)
    .map((o) => `${profile.id}/${o.name}`);
  if (stale.length) await supabase.storage.from(AVATAR_BUCKET).remove(stale);

  const { error: upErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { error: GENERIC_ERROR };

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: path })
    .eq('id', profile.id);
  if (dbErr) return { error: GENERIC_ERROR };

  await logEvent({
    action: 'profile.avatar_uploaded',
    actorId: profile.id,
    entityType: 'profile',
    entityId: profile.id,
    metadata: { ext: meta.ext, size_bytes: file.size, path },
    source: 'portal',
  });

  revalidatePath(PROFILE_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}

/** Remove the caller's avatar object(s) and clear avatar_url. */
export async function removeMyAvatar(
  _prev: ProfileFormState,
  _formData: FormData,
): Promise<ProfileFormState> {
  const profile = await requireAuth();
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(profile.id);
  const toRemove = (existing ?? [])
    .filter((o) => o.name.startsWith('avatar.'))
    .map((o) => `${profile.id}/${o.name}`);
  if (toRemove.length) await supabase.storage.from(AVATAR_BUCKET).remove(toRemove);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', profile.id);
  if (error) return { error: GENERIC_ERROR };

  await logEvent({
    action: 'profile.avatar_removed',
    actorId: profile.id,
    entityType: 'profile',
    entityId: profile.id,
    metadata: { path: profile.avatar_url },
    source: 'portal',
  });

  revalidatePath(PROFILE_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}
