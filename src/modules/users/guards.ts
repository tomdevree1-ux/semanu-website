import type { Role } from '@/lib/types/database';

/**
 * Pure, client-safe guard predicates for user-management safety rails. The
 * server actions fetch the live values (current role, active-admin count,
 * super-admin flags) and feed them here; keeping the logic pure makes it unit
 * testable and impossible to bypass from the UI.
 */

export function isSelf(actorId: string, targetId: string): boolean {
  return actorId === targetId;
}

/** Demoting yourself out of admin is forbidden (lockout protection). */
export function isSelfDemotion(actorId: string, targetId: string, newRole: Role): boolean {
  return actorId === targetId && newRole !== 'admin';
}

/** Disabling the only remaining active admin is forbidden. */
export function wouldDisableLastAdmin(
  targetRole: Role | null,
  targetActive: boolean,
  activeAdminCount: number,
): boolean {
  return targetRole === 'admin' && targetActive && activeAdminCount <= 1;
}

/** Role-changing the only remaining active admin away from admin is forbidden. */
export function wouldRemoveLastAdmin(
  targetRole: Role | null,
  newRole: Role,
  targetActive: boolean,
  activeAdminCount: number,
): boolean {
  return targetRole === 'admin' && newRole !== 'admin' && targetActive && activeAdminCount <= 1;
}

/** A non-super-admin may not act on a platform super-admin. */
export function blocksSuperAdmin(targetIsSuper: boolean, actorIsSuper: boolean): boolean {
  return targetIsSuper && !actorIsSuper;
}

/** Archiving the only remaining active admin is forbidden (same rule as disable). */
export const wouldArchiveLastAdmin = wouldDisableLastAdmin;
