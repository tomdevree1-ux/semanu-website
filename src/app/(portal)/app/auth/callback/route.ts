import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { logEvent } from '@/lib/audit/log';
import { safeNext } from '@/modules/auth/queries';

/**
 * Auth callback: exchanges the Supabase `code` for a session (used by the
 * password-recovery link). Redirects to a safe internal `next` target. Never
 * logs the code or any token.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/app/login?error=link', url.origin));
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/app/login?error=link', url.origin));
  }

  await logEvent({
    action: 'auth.callback_completed',
    actorId: data.user?.id ?? null,
    source: 'email_link',
  });
  return NextResponse.redirect(new URL(next, url.origin));
}
