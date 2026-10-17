import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { getAllPosts } from '@/lib/blog';
import { LANDING_LOCALES, LANDING_SLUGS } from '@/content/landing';
import { SERVICE_SLUGS } from '@/content/services';
import { CONFIG_SLUGS } from '@/content/configurators';

// Generate the sitemap once at build time instead of on every request. It reads
// every blog post in three locales, which made the live route slow to the point
// of timeouts (seen in the audits of 26.06 and 09.07). A slow sitemap delays
// discovery of new pages; force-static plus the Cache-Control header in
// next.config.mjs keeps it instant and edge cacheable.
export const dynamic = 'force-static';

// Indexable paths (locale prefix is added per entry). /styleguide is excluded (noindex).
const PATHS = [
  '',
  ...SERVICE_SLUGS.map((s) => `/services/${s}`),
  '/services/ai-native',
  ...CONFIG_SLUGS.map((s) => `/configurator/${s}`),
  '/blog',
  '/faq',
  '/kontakt',
  '/about',
  '/datenschutz',
  '/agb',
  '/impressum',
  '/referenzen',
  // SEO landing pages (driven by the landing registry).
  ...LANDING_SLUGS.map((slug) => `/${slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.siteUrl;
  const entries: MetadataRoute.Sitemap = [];

  // hreflang alternates for a locale-relative path that exists in `locales`.
  // Reinforces the in-page <head> hreflang and keeps language clusters explicit
  // in the sitemap too.
  const languagesFor = (path: string, locales: readonly string[]): Record<string, string> => {
    const langs: Record<string, string> = {};
    for (const l of routing.locales) {
      if (locales.includes(l)) langs[l] = `${base}/${l}${path}`;
    }
    const xDefault = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0];
    if (xDefault) langs['x-default'] = `${base}/${xDefault}${path}`;
    return langs;
  };

  // Which locales each blog slug exists in, so a post only advertises the
  // translations that actually exist.
  const postLocales = new Map<string, string[]>();
  for (const locale of routing.locales) {
    for (const post of getAllPosts(locale)) {
      postLocales.set(post.slug, [...(postLocales.get(post.slug) ?? []), locale]);
    }
  }

  // lastModified on every entry. Static + landing pages use the build/deploy
  // time (regenerated on each deploy); blog posts use their authored date
  // below. This is the strongest sitemap freshness signal for search + AI
  // crawlers to re-fetch.
  const buildDate = new Date();
  const landingPaths = new Set(LANDING_SLUGS.map((s) => `/${s}`));

  for (const locale of routing.locales) {
    for (const p of PATHS) {
      const isLanding = landingPaths.has(p);
      // Landing pages exist in de/fr/en only; the es/nl fallbacks are noindex
      // duplicates of the German page and must not be advertised here.
      if (isLanding && !(LANDING_LOCALES as readonly string[]).includes(locale)) continue;
      entries.push({
        url: `${base}/${locale}${p}`,
        lastModified: buildDate,
        changeFrequency: isLanding ? 'weekly' : 'monthly',
        priority: p === '' ? 1 : isLanding ? 0.8 : 0.7,
        alternates: { languages: languagesFor(p, isLanding ? LANDING_LOCALES : routing.locales) },
      });
    }
    for (const post of getAllPosts(locale)) {
      const d = post.date ? new Date(post.date) : undefined;
      entries.push({
        url: `${base}/${locale}/blog/${post.slug}`,
        lastModified: d && !Number.isNaN(d.getTime()) ? d : buildDate,
        changeFrequency: 'yearly',
        priority: 0.5,
        alternates: {
          languages: languagesFor(`/blog/${post.slug}`, postLocales.get(post.slug) ?? [locale]),
        },
      });
    }
  }

  return entries;
}
