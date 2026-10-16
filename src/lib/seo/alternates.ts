import { routing } from '@/i18n/routing';

/**
 * Build a Metadata `alternates` object that always carries BOTH the self
 * referencing canonical AND the de/fr/en + x-default hreflang languages.
 *
 * Why this exists: a page's `generateMetadata` that returns
 * `alternates: { canonical }` REPLACES the layout's `alternates` rather than
 * merging, so it silently drops the layout hreflang. That was happening on the
 * blog posts (and checkout). Routing every page that sets its own canonical
 * through this helper keeps canonical + hreflang together and prevents the bug
 * from coming back.
 *
 * @param path   Locale relative path WITHOUT the locale prefix, starting with
 *               '/' (e.g. '/blog/my-post'); use '' for the locale home.
 * @param locale The current locale, used for the canonical.
 * @param availableLocales Which locales actually have this page. Only these get
 *               an hreflang entry (so a post that exists in de + en does not
 *               advertise a missing fr translation). Defaults to all locales.
 *               x-default points at the default locale when available, else the
 *               first available locale.
 */
export function localizedAlternates(
  path: string,
  locale: string,
  availableLocales: readonly string[] = routing.locales,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    if (availableLocales.includes(l)) languages[l] = `/${l}${path}`;
  }
  const xDefault = availableLocales.includes(routing.defaultLocale)
    ? routing.defaultLocale
    : availableLocales[0];
  if (xDefault) languages['x-default'] = `/${xDefault}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}
