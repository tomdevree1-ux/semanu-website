import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { getAllPosts } from '@/lib/blog';
import { SERVICE_SLUGS } from '@/content/services';
import { getLegalDoc } from '@/lib/legal';

// Generate the sitemap once at build time instead of on every request. It reads
// every blog post in every locale, which made the live route slow to the point
// of timeouts (seen in the audits of 26.06 and 09.07). A slow sitemap delays
// discovery of new pages; force-static plus the Cache-Control header in
// next.config.mjs keeps it instant and edge cacheable.
export const dynamic = 'force-static';

// Indexable paths (locale prefix is added per entry).
const PATHS = [
  '',
  ...SERVICE_SLUGS.map((s) => `/services/${s}`),
  '/services/business-software',
  '/blog',
  '/faq',
  '/contact',
  '/about',
  '/privacy',
  '/legal-notice',
  '/references',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // lastModified only where the content carries a real date: blog posts (their
  // `updated` or `date`), the blog index (its newest post) and the legal pages
  // (their `updated`). Other pages get no lastmod: a build timestamp on every URL
  // says nothing about content changes, so search engines learn to ignore it.
  const toDate = (s?: string) => {
    const d = s ? new Date(s) : undefined;
    return d && !Number.isNaN(d.getTime()) ? d : undefined;
  };
  const LEGAL: Record<string, string> = { '/privacy': 'privacy', '/legal-notice': 'legal-notice' };

  for (const locale of routing.locales) {
    const posts = getAllPosts(locale);
    const newest = posts
      .map((p) => toDate(p.updated || p.date))
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    for (const p of PATHS) {
      let lastModified: Date | undefined;
      if (p === '/blog') lastModified = newest;
      else if (LEGAL[p]) lastModified = toDate((await getLegalDoc(LEGAL[p], locale))?.updated);
      entries.push({
        url: `${base}/${locale}${p}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'monthly',
        priority: p === '' ? 1 : 0.7,
        alternates: { languages: languagesFor(p, routing.locales) },
      });
    }
    for (const post of posts) {
      const d = toDate(post.updated || post.date);
      entries.push({
        url: `${base}/${locale}/blog/${post.slug}`,
        ...(d ? { lastModified: d } : {}),
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
