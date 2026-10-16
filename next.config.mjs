import createNextIntlPlugin from 'next-intl/plugin';

// Points next-intl at our request config (server-side message loading).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// Content Security Policy. Permissive enough for what the site actually uses
// (self, inline styles, GA, Stripe redirect/frames, Google Fonts, data: images).
// `unsafe-inline` on script-src is the GA init; a nonce-based CSP is a later
// hardening step. Dev adds `unsafe-eval` + ws for HMR.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  // 'self' so amai.ch can embed its own pages (e.g. the table configurator in
  // the 3D-configurators hero); external sites still cannot frame the site.
  `frame-ancestors 'self'`,
  `img-src 'self' data: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://js.stripe.com https://checkout.stripe.com https://cal.com https://*.cal.com`,
  `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.supabase.co https://challenges.cloudflare.com https://api.stripe.com https://checkout.stripe.com https://merchant-ui-api.stripe.com https://cal.com https://*.cal.com${isDev ? ' ws:' : ''}`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://challenges.cloudflare.com https://cal.com https://*.cal.com https://www.semanu.be https://semanu.be`,
  `form-action 'self' https://checkout.stripe.com`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serve modern formats for every next/image (the portfolio PNGs are heavy
  // sources; AVIF/WebP variants are generated and cached at request time).
  images: { formats: ['image/avif', 'image/webp'] },
  // P15: keep @react-pdf/renderer (native-ish deps: fontkit/yoga) out of the bundler;
  // it is imported only by server-only report PDF rendering.
  serverExternalPackages: ['@react-pdf/renderer'],
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
      // Portal pages are per-user + auth-gated — never cache them, and keep them
      // out of search + AI indexes at the header level too. X-Robots-Tag also
      // covers non-HTML responses (invoice/quote PDFs, JSON) that an HTML
      // <meta robots> tag cannot reach.
      {
        source: '/app/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
  async redirects() {
    // Services restructured (2026-10): the AI-native business-software page
    // (/services/ai-native) replaced Workflowautomatisering and Maatwerksoftware.
    // Remaining services: 3D-configuratoren, AI-native bedrijfssoftware, Consultancy.
    // Retired/renamed service URLs 301 to the nearest match.
    const moved = [
      // folded into AI-native business software
      ['workflow-automation', 'ai-native'],
      ['marketing-automation', 'ai-native'],
      ['maatwerksoftware', 'ai-native'],
      ['business-systems', 'ai-native'],
      ['websites', 'ai-native'],
      ['crm', 'ai-native'],
      ['customer-portals', 'ai-native'],
      // advice-oriented retired services
      ['ai-assistants', 'consultancy'],
      ['booking-appointment', 'consultancy'],
    ];
    return [
      ...moved.map(([from, to]) => ({
        source: `/:locale(de|fr|en|es|nl)/services/${from}`,
        destination: `/:locale/services/${to}`,
        permanent: true,
      })),
      // Email marketing is no longer a standalone service: send it to the services hub.
      {
        source: '/:locale(de|fr|en|es|nl)/services/email-marketing',
        destination: '/:locale/services',
        permanent: true,
      },
      // Public self-serve checkout/payment were removed (Phase 5); CTAs route to
      // /kontakt now. 301 the retired URLs to the plans page so old indexed or
      // cached links pass their signal instead of 404ing.
      {
        source: '/:locale(de|fr|en|es|nl)/checkout',
        destination: '/:locale/kontakt',
        permanent: true,
      },
      {
        source: '/:locale(de|fr|en|es|nl)/payment',
        destination: '/:locale/kontakt',
        permanent: true,
      },
      // Prijzen (website-abos) and Zo werkt het (so-funktioniert) were taken
      // offline in the 2026-10 restructure. 301 so old links keep their signal.
      {
        source: '/:locale(de|fr|en|es|nl)/website-abos',
        destination: '/:locale/kontakt',
        permanent: true,
      },
      {
        source: '/:locale(de|fr|en|es|nl)/so-funktioniert',
        destination: '/:locale',
        permanent: true,
      },
      // The /services overview was removed in the 2026-10 cleanup; the four
      // services keep their own /services/<slug> pages. 301 the overview home.
      {
        source: '/:locale(de|fr|en|es|nl)/services',
        destination: '/:locale',
        permanent: true,
      },
      // The sofa configurator demo was retired; the cabinet configurator takes
      // its place. 301 the old URL so any indexed/shared link keeps its signal.
      {
        source: '/:locale(de|fr|en|es|nl)/configurator/sofa',
        destination: '/:locale/configurator/cabinet',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
