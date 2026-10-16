import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FunnelForm } from '@/components/FunnelForm';
import { AnalysisFormModal } from '@/components/AnalysisFormModal';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'funnel' });
  return pageMetadata({
    title: `${t('metaTitle')} · semanu.eu`,
    description: t('metaDescription'),
    path: '/website-analyse',
    locale,
  });
}

/**
 * Free Website Analysis — the public P13 lead magnet. Posts to /api/funnels/submit and
 * lands in the funnels module (CRM source of truth). DE/FR/EN only (no Dutch public locale).
 */
export default async function WebsiteAnalysePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('funnel');
  const tnav = await getTranslations('nav');

  return (
    <SiteShell>
      <Breadcrumb items={[{ name: 'semanu.eu', href: '/' }, { name: tnav('analysis') }]} locale={locale} />
      <section className="bg-hero-wash py-24 text-ink">
        <div className="container-site max-w-3xl">
          <div>
            <span className="eyebrow text-navy">{t('eyebrow')}</span>
            <h1 className="h2 mt-4 text-ink">{t('title')}</h1>
            <p className="lead mt-4 text-ink-soft">{t('intro')}</p>

            {/* Primary CTA sits high, right under the intro, so it is in view
                without scrolling. */}
            <div className="mt-8">
              <AnalysisFormModal buzz triggerLabel={t('formTitle')} title={t('formTitle')} closeLabel={t('close')}>
                <FunnelForm source="website_analysis" />
              </AnalysisFormModal>
            </div>

            <div className="mt-10">
              <h2 className="font-mono text-xs uppercase tracking-widest text-navy">
                {t('benefitsTitle')}
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {(t.raw('benefits') as string[]).map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-navy">
                      →
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 border-t border-[var(--line)] pt-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-navy">
                {t('afterTitle')}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">{t('afterText')}</p>
            </div>
          </div>

        </div>
      </section>
    </SiteShell>
  );
}
