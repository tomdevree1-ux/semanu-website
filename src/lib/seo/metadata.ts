import type { Metadata } from 'next';
import { localizedAlternates } from './alternates';

/**
 * Build a page's Metadata with the title, `og:title` and `twitter:title` kept in
 * lockstep, plus a self referencing canonical + hreflang and the OG/Twitter
 * image and card.
 *
 * Why this exists: several pages set only `title` in `generateMetadata`. Next.js
 * does NOT derive `og:title`/`twitter:title` from `title`, so those pages fell
 * back to the layout's generic OG title — search results were fine, but social
 * shares of inner pages showed the wrong title. Routing every page through this
 * helper keeps the three titles aligned and can't drift again.
 *
 * @param title  The full page title (already including the "· amai.ch" suffix).
 * @param description Optional meta + OG description.
 * @param path   Locale relative path, '' for the home page, '/kontakt' etc.
 * @param locale Current locale (for canonical + OG url).
 * @param availableLocales Locales this page exists in (defaults to all).
 * @param image  OG/Twitter image (defaults to the sitewide /og.png).
 * @param ogType OpenGraph `og:type` (defaults to 'website'; blog posts pass 'article').
 */
export function pageMetadata({
  title,
  description,
  path,
  locale,
  availableLocales,
  image = '/og.png?v=3',
  ogType = 'website',
  ogTitle,
  ogDescription,
}: {
  title: string;
  description?: string;
  path: string;
  locale: string;
  availableLocales?: readonly string[];
  image?: string;
  ogType?: 'website' | 'article';
  ogTitle?: string;
  ogDescription?: string;
}): Metadata {
  const desc = description ? { description } : {};
  // og/twitter copy defaults to the page title/description, but a page may pass a
  // distinct ogTitle/ogDescription (e.g. the services pages curate punchier social
  // copy) while still inheriting the shared canonical + hreflang + image defaults.
  const socialTitle = ogTitle ?? title;
  const socialText = ogDescription ?? description;
  const socialDesc = socialText ? { description: socialText } : {};
  return {
    title,
    ...desc,
    alternates: localizedAlternates(path, locale, availableLocales),
    openGraph: {
      title: socialTitle,
      ...socialDesc,
      siteName: 'amai',
      url: `/${locale}${path}`,
      type: ogType,
      // alt mirrors the page title (not one sitewide brand line) for
      // accessibility and better social context per page.
      images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      ...socialDesc,
      images: [image],
    },
  };
}
