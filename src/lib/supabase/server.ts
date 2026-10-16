import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';

/**
 * Cookie-bound server client (anon key, RLS-enforced). For auth in Server
 * Components, Route Handlers and Server Actions — the Premium portal (Phase 4).
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without a response to mutate — safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client — BYPASSES RLS. SERVER ONLY.
 * Used by the leads API route to insert submissions. Never import in client code.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
