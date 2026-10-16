import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { SERVICE_SLUGS, serviceBySlug, type ServicesLocale } from '@/content/services';
import { getServiceDetail } from '@/content/serviceDetail';
import { ServiceFlow } from '@/components/services/ServiceFlow';
import { env } from '@/lib/env';
import { pageMetadata } from '@/lib/seo/metadata';

function pick(locale: string): ServicesLocale {
  return (['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale;
}

/** Pre-render every service page for every locale. */
export function generateStaticParams() {
  return SERVICE_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}): Promise<Metadata> {
  const { locale, service } = await params;
  const loc = pick(locale);
  const found = serviceBySlug(loc, service);
  if (!found) return {};
  const detail = getServiceDetail(loc, found.service.id);
  const title = detail?.metaTitle ?? `${found.service.title} · semanu.eu`;
  const description = detail?.metaDescription ?? found.service.description ?? found.service.short;
  const ogDescription = detail?.ogDescription ?? description;
  return pageMetadata({
    title,
    description,
    path: `/services/${service}`,
    locale,
    ogDescription,
  });
}

/** Dedicated page for a single service. Composition depends on its flow. */
export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}) {
  const { locale, service } = await params;
  setRequestLocale(locale);
  const loc = pick(locale);
  const found = serviceBySlug(loc, service);
  if (!found) notFound();
  const { service: s, content: c } = found;
  const detail = getServiceDetail(loc, s.id);
  if (!detail) notFound();
  const tn = await getTranslations('nav');
  const navServicesLabel = tn('services');
  const entityLine = (await getTranslations('serviceUi'))('entityLine');

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'semanu.eu', item: `${env.siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: navServicesLabel, item: `${env.siteUrl}/${locale}/services` },
      {
        '@type': 'ListItem',
        position: 3,
        name: s.title,
        item: `${env.siteUrl}/${locale}/services/${service}`,
      },
    ],
  };
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: detail.metaDescription,
    serviceType: s.title,
    provider: { '@id': `${env.siteUrl}/#organization` },
    areaServed: 'CH',
    url: `${env.siteUrl}/${locale}/services/${service}`,
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: detail.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <SiteShell>
      <JsonLd data={[breadcrumbLd, serviceLd, faqLd]} />
      <ServiceFlow service={s} detail={detail} content={c} navServicesLabel={navServicesLabel} locale={locale} />
      {/* One-sentence entity summary — crawlable plain text that helps AI
          assistants describe semanu accurately (GEO). */}
      <section className="bg-ink py-6">
        <p className="container-site text-sm text-paper/55"><BrandText>{entityLine}</BrandText></p>
      </section>
    </SiteShell>
  );
}
