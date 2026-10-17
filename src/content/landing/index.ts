import type { LandingLocale, LandingLocales } from './types';
import { smeDigitalisation } from './sme-digitalisation';
import { configurator3d } from './3d-configurator';

/**
 * Registry of SEO landing pages. Adding an entry here automatically wires the
 * dynamic route ([landing]) and the sitemap. Each slug exists in all locales
 * (shared slug, translated content) so canonical + hreflang work as for every
 * other page. Since 2026-10 the pages are country-neutral (Europe); the former
 * country slugs and the retired website/SEO pages 301 in next.config.mjs.
 */
export const LANDING: Record<string, LandingLocales> = {
  'sme-digitalisation': smeDigitalisation,
  '3d-configurator': configurator3d,
};

export const LANDING_SLUGS = Object.keys(LANDING);

/**
 * Locales the landing pages are actually authored in. Other locales (es, nl)
 * render the German fallback with a canonical to /de, noindex and no hreflang,
 * and are left out of the sitemap.
 */
export const LANDING_LOCALES: readonly LandingLocale[] = ['de', 'fr', 'en'];
