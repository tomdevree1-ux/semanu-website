import 'server-only';
import { createAdminClient } from './server';

/**
 * SERVER ONLY. Re-exports the service-role client (bypasses RLS) and exposes
 * the Supabase Auth admin API (create users, generate links). Never import
 * from client components.
 */
export { createAdminClient };

/** Supabase Auth admin API: createUser, generateLink, updateUserById, etc. */
export function authAdmin() {
  return createAdminClient().auth.admin;
}
