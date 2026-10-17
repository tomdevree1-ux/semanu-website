import createNextIntlPlugin from 'next-intl/plugin';
import { LEGACY_PATHS } from './src/lib/legacy-redirects.mjs';

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
    // Every retired or renamed URL 301s straight to its final target (no chains,
    // no loops). The list lives in src/lib/legacy-redirects.mjs.
    const L = '/:locale(de|fr|en|es|nl)';
    return LEGACY_PATHS.map(([from, to]) => ({
      source: `${L}${from}`,
      destination: `/:locale${to}`,
      permanent: true,
    }));
  },
};

export default withNextIntl(nextConfig);
