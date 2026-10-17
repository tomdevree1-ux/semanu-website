import type { LandingLocale, LandingLocales } from './types';
import { digitalisierungKmu } from './digitalisierung-kmu';
import { konfigurator3d } from './3d-konfigurator';

/**
 * Registry of SEO landing pages. Adding an entry here automatically wires the
 * dynamic route ([landing]) and the sitemap. Each slug exists in all locales
 * (shared slug, translated content) so canonical + hreflang work as for every
 * other page. Since 2026-10 the pages are country-neutral (Europe); the former
 * country slugs and the retired website/SEO pages 301 in next.config.mjs.
 */
export const LANDING: Record<string, LandingLocales> = {
  'digitalisierung-kmu': digitalisierungKmu,
  '3d-konfigurator': konfigurator3d,
};

export const LANDING_SLUGS = Object.keys(LANDING);

/**
 * Locales the landing pages are actually authored in. Other locales (es, nl)
 * render the German fallback with a canonical to /de, noindex and no hreflang,
 * and are left out of the sitemap.
 */
export const LANDING_LOCALES: readonly LandingLocale[] = ['de', 'fr', 'en'];
