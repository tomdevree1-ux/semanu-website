// Retired and renamed URLs, as locale-relative paths ('' = the locale home).
// Shared by next.config.mjs (301s for /<locale>/<old> URLs) and the middleware
// (old URLs without a locale prefix, so they also reach their target in one hop).
//
// Slugs (2026-10): every URL uses one English slug, identical in all
// locales (only the /nl /en /de /fr /es prefix differs). Every retired or
// renamed URL below 301s straight to its final target (no chains, no loops).
//
// Services: the business-software page (/services/business-software, formerly
// /services/ai-native) replaced Workflowautomatisering and Maatwerksoftware;
// Consultancy was dropped as a service. Remaining services: 3D configurators
// and business software.
export const moved = [
  ['ai-native', 'business-software'],
  // folded into business software
  ['workflow-automation', 'business-software'],
  ['marketing-automation', 'business-software'],
  ['maatwerksoftware', 'business-software'],
  ['business-systems', 'business-software'],
  ['websites', 'business-software'],
  ['crm', 'business-software'],
  ['customer-portals', 'business-software'],
  // advice-oriented retired services (consultancy itself was retired too)
  ['consultancy', 'business-software'],
  ['ai-assistants', 'business-software'],
  ['booking-appointment', 'business-software'],
];
// Top-level pages: former German slugs, the removed landing pages and their
// older country slugs, and pages for services no longer offered
// (websites, website subscriptions, SEO/GEO packages, the workflow automation
// landing page, the free website analysis, checkout and payment).
// '' = the home page.
export const pageMoved = [
  ['kontakt', '/contact'],
  ['datenschutz', '/privacy'],
  ['impressum', '/legal-notice'],
  // The general terms page was removed (2026-10); its URLs go to the legal notice.
  ['agb', '/legal-notice'],
  ['terms', '/legal-notice'],
  ['referenzen', '/references'],
  // The landing pages were removed (2026-10); their URLs and every older
  // slug that pointed at them go straight to the matching service page.
  ['3d-configurator', '/services/3d-configurators'],
  ['3d-konfigurator', '/services/3d-configurators'],
  ['3d-konfigurator-schweiz', '/services/3d-configurators'],
  ['sme-digitalisation', '/services/business-software'],
  ['digitalisierung-kmu', '/services/business-software'],
  ['digitalisierung-kmu-schweiz', '/services/business-software'],
  ['workflow-automatisierung-schweiz', '/services/business-software'],
  ['workflow-automatisierung', '/services/business-software'],
  ['website-analyse', '/contact'],
  ['geo-schweiz', '/blog/getting-found-by-ai'],
  ['website-abo-schweiz', ''],
  ['webdesign-kmu-schweiz', ''],
  ['website-erstellen-lassen-schweiz', ''],
  ['website-betreuung-schweiz', ''],
  ['website-fuer-selbstaendige', ''],
  ['website-fuer-lokale-unternehmen', ''],
  ['seo-basis-fuer-kmu', ''],
  ['checkout', '/contact'],
  ['payment', '/contact'],
  ['website-abos', '/contact'],
  ['so-funktioniert', ''],
  // The /services overview was removed; the services keep their own pages.
  ['services', ''],
  // Email marketing is no longer a standalone service.
  ['services/email-marketing', ''],
  // The sofa configurator demo was retired; the cabinet configurator replaces it.
  ['configurator/sofa', '/configurator/cabinet'],
];
// Blog posts with a former German slug, now English.
export const blogRenamed = [
  ['von-ki-gefunden-werden', 'getting-found-by-ai'],
  // The AI-native post was renamed AI-first (2026-10); both older slugs go
  // straight to the new slug.
  ['ai-native-digitalunternehmen', 'ai-first-digital-business'],
  ['ai-native-digital-business', 'ai-first-digital-business'],
];
// Removed blog posts: 301 to the blog index. Switzerland-only posts (the Swiss
// SME website study and its spin-offs, the revDSG check, the Röstigraben post)
// and (2026-10) the website and SEO posts plus the website subscription post,
// which no longer match the two services. Their former German slugs are listed
// too, so every old URL reaches the index in one hop.
export const blogRemoved = [
  'kmu-website-studie-schweiz',
  'kmu-ai-sichtbarkeit-schweiz',
  'kmu-website-conversion-schweiz',
  'branchen-website-vergleich-schweiz',
  'bern-vs-zuerich-website-vergleich',
  'revdsg-datenschutz-check',
  'website-beidseits-roestigraben',
  'why-website-subscription',
  'warum-website-abo',
  'common-website-mistakes',
  'haeufige-website-fehler',
  'local-seo-for-smes',
  'lokale-seo-fuer-kmu',
  'professional-website-checklist',
  'professionelle-website-checkliste',
  'website-losing-customers',
  'website-kostet-kunden',
  'website-security',
  'website-sicherheit',
];

/** Every retired path mapped to its final target, both locale-relative. */
export const LEGACY_PATHS = [
  ...moved.map(([from, to]) => [`/services/${from}`, `/services/${to}`]),
  ...pageMoved.map(([from, to]) => [`/${from}`, to]),
  ...blogRenamed.map(([from, to]) => [`/blog/${from}`, `/blog/${to}`]),
  ...blogRemoved.map((slug) => [`/blog/${slug}`, '/blog']),
];
