import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

/**
 * Split middleware:
 * - `/app/*` (the English-only portal): refresh the Supabase session, NO i18n.
 *   When PORTAL_ENABLED is off, pass through untouched (the portal root layout
 *   renders a 404) — no locale redirect loop.
 * - everything else (marketing): next-intl locale detection + `/de|/fr|/en` prefix.
 */
export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/app')) {
    if (!env.portalEnabled) return NextResponse.next();
    return updateSession(request);
  }
  return intlMiddleware(request);
}

export const config = {
  // Skip Next internals, API routes, and anything with a file extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
