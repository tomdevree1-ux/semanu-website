import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/** Marketing site only: next-intl locale detection + `/nl|/en|/de|/fr|/es` prefix. */
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, API routes, and anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
