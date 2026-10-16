import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

/**
 * Server-side message loading for next-intl. Runs per request (per locale).
 * Messages live in src/messages/<locale>.json.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
