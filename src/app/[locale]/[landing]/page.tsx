import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LandingTemplate } from '@/components/landing/LandingTemplate';
import { LANDING, LANDING_LOCALES, LANDING_SLUGS } from '@/content/landing';
import type { LandingContent, LandingLocale } from '@/content/landing/types';
import { JsonLd } from '@/components/JsonLd';
import { env } from '@/lib/env';
import { pageMetadata } from '@/lib/seo/metadata';

// Only the registered landing slugs render; any other path 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_SLUGS.map((landing) => ({ landing }));
}

function hasOwnContent(slug: string, locale: string): boolean {
  const entry = LANDING[slug];
  return Boolean(entry && (LANDING_LOCALES as readonly string[]).includes(locale) && entry[locale as LandingLocale]);
}

function pickContent(slug: string, locale: string): LandingContent | null {
  const entry = LANDING[slug];
  if (!entry) return null;
  // For es/nl (no block) fall back to the German content so the URL renders
  // instead of 404ing. Those fallbacks are NOT indexable: they carry a
  // canonical to the German page, noindex and no hreflang (see generateMetadata),
  // and are left out of the sitemap. Otherwise Google swaps the /es duplicate in
  // for the /de page (seen on /es/website-betreuung-schweiz, GSC 07.09.2026).
  return hasOwnContent(slug, locale) ? entry[locale as LandingLocale] : entry.de;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; landing: string }>;
}): Promise<Metadata> {
  const { locale, landing } = await params;
  const c = pickContent(landing, locale);
  if (!c) return {};
  const meta = pageMetadata({
    title: `${c.title} · semanu.eu`,
    description: c.description,
    path: `/${landing}`,
    locale,
    availableLocales: LANDING_LOCALES,
  });
  if (hasOwnContent(landing, locale)) return meta;
  // Fallback locale: point the canonical at the German original and keep the
  // duplicate out of the index (follow keeps the internal links crawlable).
  return {
    ...meta,
    alternates: { canonical: `/de/${landing}` },
    robots: { index: false, follow: true },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; landing: string }>;
}) {
  const { locale, landing } = await params;
  setRequestLocale(locale);
  const c = pickContent(landing, locale);
  if (!c) notFound();

  const url = `${env.siteUrl}/${locale}/${landing}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'semanu.eu', item: `${env.siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: c.h1, item: url },
    ],
  };

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: c.h1,
    description: c.description,
    url,
    inLanguage: locale,
    isPartOf: { '@id': `${env.siteUrl}/#website` },
    dateModified: new Date().toISOString().slice(0, 10),
  };

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: c.h1,
    description: c.description,
    serviceType: 'Webdesign, Websiteentwicklung, Hosting, Wartung und SEO Grundlagen',
    provider: { '@id': `${env.siteUrl}/#organization` },
    areaServed: { '@type': 'Country', name: 'Schweiz' },
    audience: {
      '@type': 'Audience',
      audienceType: 'Schweizer KMU, Selbständige und lokale Unternehmen',
    },
    offers: {
      '@type': 'Offer',
      price: '99',
      priceCurrency: 'CHF',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '99',
        priceCurrency: 'CHF',
        unitText: 'MONTH',
      },
    },
    url,
  };

  const faqLd =
    c.faq && c.faq.items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: c.faq.items.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={webPageLd} />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={serviceLd} />
      {faqLd ? <JsonLd data={faqLd} /> : null}
      <LandingTemplate content={c} slug={landing} />
    </>
  );
}
