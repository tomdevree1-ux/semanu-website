import { defineRouting } from 'next-intl/routing';

/**
 * Locale config for semanu.eu.
 * - EN is the default / fallback locale (the x-default). Visitors are routed to
 *   their own browser language automatically: the bare root `/` redirects to the
 *   best Accept-Language match (`localeDetection`), falling back to EN when no
 *   supported language matches.
 * - `localePrefix: 'always'` => every URL carries its language segment
 *   (`/en`, `/en/...`, `/de/...`, `/fr/...`, `/nl/...`).
 * - `alternateLinks: false` => no hreflang HTTP `Link` header. The HTML <head>
 *   and the sitemap carry the hreflang set (x-default = /en); the header used
 *   x-default = / and contradicted them.
 */
export const routing = defineRouting({
  locales: ['de', 'fr', 'en', 'es', 'nl'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'always',
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** OpenGraph locale per site locale (og:locale and og:locale:alternate). */
export const OG_LOCALE: Record<Locale, string> = {
  nl: 'nl_BE',
  en: 'en_GB',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
};
