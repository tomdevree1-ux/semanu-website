import type { LandingLocale, LandingLocales } from './types';
import { digitalisierungKmuSchweiz } from './digitalisierung-kmu-schweiz';
import { websiteAboSchweiz } from './website-abo-schweiz';
import { webdesignKmuSchweiz } from './webdesign-kmu-schweiz';
import { websiteErstellenLassenSchweiz } from './website-erstellen-lassen-schweiz';
import { websiteBetreuungSchweiz } from './website-betreuung-schweiz';
import { websiteFuerSelbstaendige } from './website-fuer-selbstaendige';
import { websiteFuerLokaleUnternehmen } from './website-fuer-lokale-unternehmen';
import { seoBasisFuerKmu } from './seo-basis-fuer-kmu';
import { geoSchweiz } from './geo-schweiz';
import { workflowAutomatisierungSchweiz } from './workflow-automatisierung-schweiz';
import { konfiguratorSchweiz } from './3d-konfigurator-schweiz';

/**
 * Registry of SEO landing pages. Adding an entry here automatically wires the
 * dynamic route ([landing]) and the sitemap. Each slug exists in all locales
 * (shared slug, translated content) so canonical + hreflang work as for every
 * other page.
 */
export const LANDING: Record<string, LandingLocales> = {
  'digitalisierung-kmu-schweiz': digitalisierungKmuSchweiz,
  'website-abo-schweiz': websiteAboSchweiz,
  'webdesign-kmu-schweiz': webdesignKmuSchweiz,
  'website-erstellen-lassen-schweiz': websiteErstellenLassenSchweiz,
  'website-betreuung-schweiz': websiteBetreuungSchweiz,
  'website-fuer-selbstaendige': websiteFuerSelbstaendige,
  'website-fuer-lokale-unternehmen': websiteFuerLokaleUnternehmen,
  'seo-basis-fuer-kmu': seoBasisFuerKmu,
  'geo-schweiz': geoSchweiz,
  'workflow-automatisierung-schweiz': workflowAutomatisierungSchweiz,
  '3d-konfigurator-schweiz': konfiguratorSchweiz,
};

export const LANDING_SLUGS = Object.keys(LANDING);

/**
 * Locales the landing pages are actually authored in. Other locales (es, nl)
 * render the German fallback with a canonical to /de, noindex and no hreflang,
 * and are left out of the sitemap.
 */
export const LANDING_LOCALES: readonly LandingLocale[] = ['de', 'fr', 'en'];
