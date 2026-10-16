import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { FaqAccordion } from '@/components/FaqAccordion';
import { ConfiguratorDemo, type DemoConfig } from '@/components/configurator/ConfiguratorDemo';
import { pageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';
import {
  CONFIG_SLUGS,
  CONFIGURATORS,
  DEMOS,
  UI,
  type ConfLocale,
} from '@/content/configurators';

const LOCALES: ConfLocale[] = ['de', 'fr', 'en', 'es', 'nl'];

export function generateStaticParams() {
  const params: { locale: string; type: string }[] = [];
  for (const locale of LOCALES) for (const type of CONFIG_SLUGS) params.push({ locale, type });
  return params;
}

const pick = (locale: string) => (LOCALES.includes(locale as ConfLocale) ? (locale as ConfLocale) : 'de');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  const conf = CONFIGURATORS[type];
  if (!conf) return {};
  const c = conf[pick(locale)];
  return pageMetadata({
    title: c.metaTitle,
    description: c.metaDescription,
    path: `/configurator/${type}`,
    locale,
    availableLocales: LOCALES,
  });
}

export default async function ConfiguratorPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);
  const conf = CONFIGURATORS[type];
  if (!conf) notFound();
  const loc = pick(locale);
  const c = conf[loc];
  const demo = DEMOS[type];
  const ui = UI[loc];

  const config: DemoConfig | null = demo
    ? {
        currency: demo.currency,
        basePrice: demo.basePrice,
        priceNote: ui.priceNote,
        previewLabel: ui.previewLabel,
        summaryLabel: ui.summaryLabel,
        ctaLabel: ui.ctaLabel,
        ctaHref: '/kontakt?interest=3d-configurators',
        steps: demo.steps.map((s) => ({ label: ui[s.key], options: s.options })),
      }
    : null;

  const url = `${env.siteUrl}/${locale}/configurator/${type}`;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'semanu.eu', item: `${env.siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: c.serviceLabel, item: `${env.siteUrl}/${locale}/services/3d-configurators` },
      { '@type': 'ListItem', position: 3, name: c.title, item: url },
    ],
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // sibling configurators for internal links
  const others = CONFIG_SLUGS.filter((s) => s !== type).map((s) => ({
    slug: s,
    title: CONFIGURATORS[s][loc].title,
  }));

  return (
    <SiteShell>
      <JsonLd data={[breadcrumbLd, faqLd]} />
      {/* Hero — architectural background (like the homepage), breadcrumb over it */}
      <section className="relative isolate -mt-[72px] overflow-hidden bg-paper pb-[clamp(44px,6vw,88px)] pt-[72px] text-ink">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src="/service-heroes/3d-configurators-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-kenburns object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
        </div>
        <div className="container-site">
          <div className="max-w-3xl pt-[clamp(20px,3vw,48px)]">
            <span className="eyebrow text-navy">{c.eyebrow}</span>
            <h1 className="h1-svc mt-5 text-balance lg:text-[46px]"><BrandText>{c.h1}</BrandText></h1>
            <p className="lead mt-5 text-ink-soft"><BrandText>{c.heroSub}</BrandText></p>
          </div>
        </div>
      </section>

      {/* Configurator */}
      <section className="bg-paper pb-16 text-ink sm:pb-20">
        <div className="container-site">
          {c.configUrl ? (
            <a
              href={c.configUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              {c.launchLabel ?? c.finalCta} <span aria-hidden className="btn-arrow" />
            </a>
          ) : config ? (
            <>
              <ConfiguratorDemo config={config} />
              <p className="mt-3 font-mono text-[11px] text-ink-soft">{c.demoNote}</p>
            </>
          ) : null}
        </div>
      </section>

      {/* SEO intro */}
      <section className="bg-paper py-16 text-ink">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="h2"><BrandText>{c.introHeading}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{c.introBody}</BrandText></p>
          </div>
          <ul className="grid content-center gap-3">
            {c.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-card border border-[var(--line)] bg-white p-4 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-mint-deep">✓</span>
                <BrandText>{b}</BrandText>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GEO block — hidden on the live product page (configUrl set) */}
      {!c.configUrl && (
        <section className="flow-soft-white py-16 text-ink">
          <div className="container-site max-w-3xl">
            <h2 className="h2"><BrandText>{c.geoHeading}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{c.geoBody}</BrandText></p>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-paper py-16 text-ink">
        <div className="container-site">
          <h2 className="h2"><BrandText>{c.faqTitle}</BrandText></h2>
          <FaqAccordion items={c.faq} />
        </div>
      </section>

      {/* related configurators + service link */}
      <section className="flow-soft-white py-14 text-ink">
        <div className="container-site">
          <h2 className="h3"><BrandText>{c.moreTitle}</BrandText></h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!c.configUrl && (
              <Link href="/services/3d-configurators" className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white p-4 transition-colors hover:border-navy">
                <span className="font-display text-sm text-ink">{c.serviceLabel}</span>
                <span aria-hidden className="text-navy transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
            {others.map((o) => (
              <Link key={o.slug} href={`/configurator/${o.slug}`} className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white p-4 transition-colors hover:border-navy">
                <span className="font-display text-sm text-ink">{o.title}</span>
                <span aria-hidden className="text-navy transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="bg-ink py-16 text-paper">
        <div className="container-site flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="h2 text-white"><BrandText>{c.finalTitle}</BrandText></h2>
            <p className="mt-2 max-w-xl text-paper/80"><BrandText>{c.finalText}</BrandText></p>
          </div>
          <Link href="/kontakt?interest=3d-configurators" className="btn btn-spark shrink-0">
            {c.finalCta} <span aria-hidden className="btn-arrow" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
