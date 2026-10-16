import { defineRouting } from 'next-intl/routing';

/**
 * Locale config for semanu.eu.
 * - EN is the default / fallback locale (the x-default). Visitors are routed to
 *   their own browser language automatically: the bare root `/` redirects to the
 *   best Accept-Language match (`localeDetection`), falling back to EN when no
 *   supported language matches.
 * - `localePrefix: 'always'` => every URL carries its language segment
 *   (`/en`, `/en/...`, `/de/...`, `/fr/...`, `/nl/...`).
 */
export const routing = defineRouting({
  locales: ['de', 'fr', 'en', 'es', 'nl'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
