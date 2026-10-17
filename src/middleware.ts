import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { LEGACY_PATHS } from '@/lib/legacy-redirects.mjs';

/** Marketing site only: next-intl locale detection + `/nl|/en|/de|/fr|/es` prefix. */
const handleI18n = createMiddleware(routing);

// Retired paths (locale-relative) mapped to their final target.
const LEGACY = new Map<string, string>(LEGACY_PATHS as [string, string][]);

/**
 * An old URL without a locale prefix (e.g. /kontakt) gets a locale redirect from
 * next-intl (/de/kontakt) and would then need a second 301 (/de/contact). When
 * the locale redirect points at a retired path, point it at the final target
 * instead, so the visitor and crawlers reach it in one hop.
 */
export default function middleware(request: NextRequest) {
  const response = handleI18n(request);
  const location = response.headers.get('location');
  if (location) {
    const url = new URL(location, request.url);
    const m = url.pathname.match(/^\/(de|fr|en|es|nl)(\/.*)$/);
    const target = m ? LEGACY.get(m[2].replace(/\/$/, '')) : undefined;
    if (m && target !== undefined) {
      url.pathname = `/${m[1]}${target}`;
      // Keep the header in the form next-intl used (relative or absolute).
      response.headers.set(
        'location',
        location.startsWith('/') ? `${url.pathname}${url.search}` : url.toString(),
      );
    }
  }
  return response;
}

export const config = {
  // Skip Next internals, API routes, and anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
