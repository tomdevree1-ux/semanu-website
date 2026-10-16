import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tn = await getTranslations({ locale, namespace: 'nav' });
  const ta = await getTranslations({ locale, namespace: 'about' });
  return pageMetadata({ title: `${tn('about')} · semanu.eu`, description: ta('intro'), path: '/about', locale });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const tnav = await getTranslations('nav');

  const orgId = `${env.siteUrl}/#organization`;
  // A Person node for the founder, linked to the single canonical org by @id (the
  // org already names Tom de Vree as founder; this gives that founder a richer,
  // referenced entity for search + AI).
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${env.siteUrl}/#founder`,
    name: 'Tom de Vree',
    jobTitle: t('founderRole'),
    image: `${env.siteUrl}/team/tom.png`,
    worksFor: { '@id': orgId },
    url: `${env.siteUrl}/${locale}/about`,
  };
  const aboutPageLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: t('title'),
    description: t('intro'),
    url: `${env.siteUrl}/${locale}/about`,
    inLanguage: locale,
    isPartOf: { '@id': `${env.siteUrl}/#website` },
    mainEntity: { '@id': orgId },
    about: { '@id': orgId },
  };
  // Restate the founder relationship on the org from this page so the Person and
  // the org @id resolve to the same founder entity.
  const orgFounderLd = {
    '@context': 'https://schema.org',
    '@id': orgId,
    founder: { '@id': `${env.siteUrl}/#founder` },
  };

  return (
    <SiteShell>
      <JsonLd data={[aboutPageLd, personLd, orgFounderLd]} />
      <Breadcrumb items={[{ name: 'semanu.eu', href: '/' }, { name: tnav('about') }]} locale={locale} />
      <section className="bg-paper py-24 text-ink">
        <div className="container-site">
          {/* Intro + story on the left, founder (Tom) card sticky on the right, so
              the right column stays occupied while the story scrolls instead of
              leaving a large void on wide screens. */}
          <div className="grid items-start gap-x-12 gap-y-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <span className="eyebrow eyebrow-spark text-red">{t('eyebrow')}</span>
              <h1 className="h1-svc mt-4">{t('title')}</h1>
              <p className="lead mt-5 text-ink-soft"><BrandText>{t('intro')}</BrandText></p>

              <div className="mt-14">
                <h2 className="h3"><BrandText>{t('nameTitle')}</BrandText></h2>
                <p className="mt-3 leading-relaxed text-ink-soft"><BrandText>{t('nameText')}</BrandText></p>
                <h2 className="h3 mt-14"><BrandText>{t('missionTitle')}</BrandText></h2>
                <p className="mt-3 leading-relaxed text-ink-soft"><BrandText>{t('missionText')}</BrandText></p>
              </div>
            </div>

            <div className="w-full lg:sticky lg:top-28">
              <div className="semanu-reveal rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-7">
                <span className="font-mono text-xs uppercase tracking-wider text-navy"><BrandText>{t('founderTitle')}</BrandText></span>
                <div className="mt-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/team/tom.png"
                    alt={`${t('founderName')}, ${t('founderRole')}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-ink">{t('founderName')}</p>
                    <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">{t('founderRole')}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft"><BrandText>{t('founderText')}</BrandText></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper">
        <div className="container-site flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="h2 max-w-xl text-white">{t('ctaTitle')}</h2>
          <Link href="/kontakt" className="btn btn-spark">
            {t('ctaButton')} <span aria-hidden className="btn-arrow" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
