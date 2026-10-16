import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';

/**
 * Refreshes the Supabase auth session for portal (`/app`) requests and returns a
 * response carrying the rotated httpOnly auth cookies. SERVER (middleware) only.
 *
 * This ONLY keeps the session fresh — it is NOT the authorization boundary.
 * Authorization is enforced per request by requireAuth()/RLS in the protected
 * layout + server actions (so a disabled user is rejected on the next request).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Revalidates the JWT and rotates cookies if needed. Result is intentionally ignored.
  await supabase.auth.getUser();
  return response;
}
