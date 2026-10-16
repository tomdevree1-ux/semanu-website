import type { Database, Role, UserStatus } from '@/lib/types/database';

/** A row from public.profiles — the platform user record. */
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type { Role, UserStatus };

/** One row in the admin user list (profile + resolved role). */
export type UserListRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  status: string;
  avatarUrl: string | null; // short-lived signed URL, or null → initials
  role: Role | null;
  lastLoginAt: string | null;
  createdAt: string;
};

/** The user detail view: a list row plus protection flags for the actor's UI. */
export type UserDetail = UserListRow & {
  isPlatformSuperAdmin: boolean;
  isSelf: boolean;
  isArchived: boolean;
};
