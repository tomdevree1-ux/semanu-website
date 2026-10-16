import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';

/**
 * Browser Supabase client (anon key, RLS-enforced).
 * Use in client components for auth + public reads (Phase 4 portal).
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
