import createNextIntlPlugin from 'next-intl/plugin';

// Points next-intl at our request config (server-side message loading).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';
// Anything other than SITE_ENV=production (acc.semanu.eu, local) is noindex.
const isLive = process.env.SITE_ENV === 'production';

// Content Security Policy. Permissive enough for what the site actually uses
// (self, inline styles, GA, Turnstile, cal.com, Google Fonts, data: images).
// `unsafe-inline` on script-src is the GA init; a nonce-based CSP is a later
// hardening step. Dev adds `unsafe-eval` + ws for HMR. The contact form talks
// to Supabase server side only, so the browser needs no Supabase origin.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  // 'self' so the site can embed its own pages (e.g. the table configurator in
  // the 3D-configurators hero); external sites still cannot frame the site.
  `frame-ancestors 'self'`,
  `img-src 'self' data: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://cal.com https://*.cal.com`,
  `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://challenges.cloudflare.com https://cal.com https://*.cal.com${isDev ? ' ws:' : ''}`,
  `frame-src 'self' https://challenges.cloudflare.com https://cal.com https://*.cal.com https://www.semanu.be https://semanu.be`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Staging (acc.semanu.eu) must never be indexed. Caddy sets the same header;
  // this is the second lock in case the app is reached another way.
  ...(isLive ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle (.next/standalone) for the Hetzner deploy:
  // rsync it with .next/static and public, then `node server.js`.
  output: 'standalone',
  // The site sits behind Caddy, which compresses responses itself.
  compress: false,
  poweredByHeader: false,
  // Serve modern formats for every next/image (the portfolio PNGs are heavy
  // sources; AVIF/WebP variants are generated and cached at request time).
  // WebP only: AVIF encoding is several times slower on the small Hetzner server and
  // made the first view of each image noticeably slow. Optimized images are cached for a year.
  images: { formats: ['image/webp'], minimumCacheTTL: 31536000 },
  // Linting runs as a dedicated CI/dev step (`npm run lint`) so a stray style
  // rule never blocks a production build. TypeScript errors still fail builds.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // robots.txt + sitemap.xml + llms.txt: let the CDN cache them for a day
      // (with a week of stale-while-revalidate) so crawlers always get an
      // instant answer. Pairs with `export const dynamic = 'force-static'`.
      {
        source: '/(robots.txt|sitemap.xml|llms.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  async redirects() {
    // Slugs (2026-10): every URL uses one English slug, identical in all
    // locales (only the /nl /en /de /fr /es prefix differs). Every retired or
    // renamed URL below 301s straight to its final target (no chains, no loops).
    //
    // Services: the business-software page (/services/business-software, formerly
    // /services/ai-native) replaced Workflowautomatisering and Maatwerksoftware;
    // Consultancy was dropped as a service. Remaining services: 3D configurators
    // and business software.
    const moved = [
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
    const pageMoved = [
      ['kontakt', '/contact'],
      ['datenschutz', '/privacy'],
      ['impressum', '/legal-notice'],
      ['agb', '/terms'],
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
    const blogRenamed = [
      ['haeufige-website-fehler', 'common-website-mistakes'],
      ['von-ki-gefunden-werden', 'getting-found-by-ai'],
      ['lokale-seo-fuer-kmu', 'local-seo-for-smes'],
      ['professionelle-website-checkliste', 'professional-website-checklist'],
      ['website-kostet-kunden', 'website-losing-customers'],
      ['website-sicherheit', 'website-security'],
      ['warum-website-abo', 'why-website-subscription'],
      ['ai-native-digitalunternehmen', 'ai-native-digital-business'],
    ];
    // Switzerland-only blog posts (the Swiss SME website study and its spin-offs,
    // the revDSG check, the Röstigraben post) were removed: 301 to the blog index.
    const blogRemoved = [
      'kmu-website-studie-schweiz',
      'kmu-ai-sichtbarkeit-schweiz',
      'kmu-website-conversion-schweiz',
      'branchen-website-vergleich-schweiz',
      'bern-vs-zuerich-website-vergleich',
      'revdsg-datenschutz-check',
      'website-beidseits-roestigraben',
    ];
    const L = '/:locale(de|fr|en|es|nl)';
    return [
      ...moved.map(([from, to]) => ({
        source: `${L}/services/${from}`,
        destination: `/:locale/services/${to}`,
        permanent: true,
      })),
      ...pageMoved.map(([from, to]) => ({
        source: `${L}/${from}`,
        destination: `/:locale${to}`,
        permanent: true,
      })),
      ...blogRenamed.map(([from, to]) => ({
        source: `${L}/blog/${from}`,
        destination: `/:locale/blog/${to}`,
        permanent: true,
      })),
      ...blogRemoved.map((slug) => ({
        source: `${L}/blog/${slug}`,
        destination: '/:locale/blog',
        permanent: true,
      })),
    ];
  },
};

export default withNextIntl(nextConfig);
