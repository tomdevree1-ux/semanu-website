import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { logEvent } from '@/lib/audit/log';
import { safeNext } from '@/modules/auth/queries';

/**
 * Email-link confirmation for server-generated recovery / invite links.
 *
 * Verifies the one-time `token_hash` with Supabase `verifyOtp` and establishes
 * the session, then redirects to a safe internal target. This is the correct
 * path for links produced by the admin `generateLink` API: there is no
 * browser-side PKCE `code_verifier`, so the OAuth `exchangeCodeForSession`
 * flow cannot apply here. Never logs the token.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(url.searchParams.get('next'));

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/app/login?error=link', url.origin));
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(new URL('/app/login?error=link', url.origin));
  }

  await logEvent({
    action: 'auth.recovery_verified',
    actorId: data.user?.id ?? null,
    source: 'email_link',
  });
  return NextResponse.redirect(new URL(next, url.origin));
}
