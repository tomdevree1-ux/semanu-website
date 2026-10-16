import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/security/rbac';
import type { Role } from '@/lib/types/database';
import type { UserListRow, UserDetail } from './types';

/**
 * SERVER ONLY user-management reads. These use the service-role client because
 * an admin must see ALL users regardless of whether their permission set maps
 * to `is_admin()` in RLS. Every caller (the pages) gates with
 * requirePermission('users.read') first; nothing here is reachable from a client
 * component.
 */

const AVATAR_BUCKET = 'avatars';
const PAGE_SIZE = 25;

type Admin = ReturnType<typeof createAdminClient>;

export type UserFilters = { q?: string; status?: string; role?: string; page?: number };

/** Strip characters with meaning in a PostgREST `or()` filter, then cap length. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 60);
}

export async function roleIdByKey(key: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('roles').select('id').eq('key', key).maybeSingle();
  return data?.id ?? null;
}

export async function getUserRoleKey(userId: string): Promise<Role | null> {
  const admin = createAdminClient();
  const { data: ur } = await admin
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!ur) return null;
  const { data: r } = await admin.from('roles').select('key').eq('id', ur.role_id).maybeSingle();
  return (r?.key as Role) ?? null;
}

export async function isTargetPlatformSuperAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/** Active users who currently hold the admin role (lockout protection). */
export async function countActiveAdmins(): Promise<number> {
  const admin = createAdminClient();
  const adminRoleId = await roleIdByKey('admin');
  if (!adminRoleId) return 0;
  const { data: urs } = await admin.from('user_roles').select('user_id').eq('role_id', adminRoleId);
  const ids = (urs ?? []).map((u) => u.user_id);
  if (!ids.length) return 0;
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('id', ids)
    .eq('status', 'active');
  return count ?? 0;
}

async function roleMaps(admin: Admin) {
  const { data: roles } = await admin.from('roles').select('id, key');
  const idToKey = new Map<number, string>();
  const keyToId = new Map<string, number>();
  for (const r of roles ?? []) {
    idToKey.set(r.id, r.key);
    keyToId.set(r.key, r.id);
  }
  return { idToKey, keyToId };
}

export async function listUsers(
  filters: UserFilters,
): Promise<{ rows: UserListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { idToKey, keyToId } = await roleMaps(admin);

  let q = admin
    .from('profiles')
    .select('id,email,first_name,last_name,full_name,status,avatar_url,last_login_at,created_at', {
      count: 'exact',
    });

  if (filters.status && ['active', 'disabled', 'invited', 'archived'].includes(filters.status)) {
    q = q.eq('status', filters.status);
  } else {
    q = q.neq('status', 'archived'); // default list hides archived users
  }

  if (filters.role && keyToId.has(filters.role)) {
    const rid = keyToId.get(filters.role)!;
    const { data: urs } = await admin.from('user_roles').select('user_id').eq('role_id', rid);
    const ids = (urs ?? []).map((u) => u.user_id);
    q = q.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data: profiles, count } = await q;
  const list = profiles ?? [];

  const ids = list.map((p) => p.id);
  const paths = list.map((p) => p.avatar_url).filter((v): v is string => !!v);
  // The role lookup and the avatar signed-URL batch are mutually independent
  // (idToKey is already resolved above), so run them in one round-trip.
  const [{ data: urs }, { data: urls }] = await Promise.all([
    ids.length
      ? admin.from('user_roles').select('user_id, role_id').in('user_id', ids)
      : Promise.resolve({ data: null }),
    paths.length
      ? admin.storage.from(AVATAR_BUCKET).createSignedUrls(paths, 60)
      : Promise.resolve({ data: null }),
  ]);

  const roleByUser = new Map<string, Role>();
  for (const ur of urs ?? []) {
    const k = idToKey.get(ur.role_id);
    if (k) roleByUser.set(ur.user_id, k as Role);
  }

  const signed = new Map<string, string>();
  for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);

  const rows: UserListRow[] = list.map((p) => ({
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    fullName: p.full_name,
    status: p.status,
    avatarUrl: p.avatar_url ? signed.get(p.avatar_url) ?? null : null,
    role: roleByUser.get(p.id) ?? null,
    lastLoginAt: p.last_login_at,
    createdAt: p.created_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const admin = createAdminClient();
  const { data: p } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!p) return null;

  // Role lookup, super-admin check, the current-session read and the avatar signed-URL are
  // mutually independent once `p` is known, so run them in one round-trip.
  const [role, isSuper, sessionUser, avatarSigned] = await Promise.all([
    getUserRoleKey(id),
    isTargetPlatformSuperAdmin(id),
    getSessionUser(),
    p.avatar_url
      ? admin.storage.from(AVATAR_BUCKET).createSignedUrl(p.avatar_url, 60)
      : Promise.resolve({ data: null }),
  ]);

  const avatarUrl: string | null = avatarSigned.data?.signedUrl ?? null;

  return {
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    fullName: p.full_name,
    status: p.status,
    avatarUrl,
    role,
    lastLoginAt: p.last_login_at,
    createdAt: p.created_at,
    isPlatformSuperAdmin: isSuper,
    isSelf: sessionUser?.id === id,
    isArchived: p.status === 'archived',
  };
}
