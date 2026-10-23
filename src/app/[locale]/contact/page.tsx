import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { ContactForm } from '@/components/ContactForm';
import { env } from '@/lib/env';
import { PHONE_DISPLAY, PHONE_TEL_HREF } from '@/lib/contact';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  // Reuse the on-page contact intro (personal reply, not an anonymous ticket) as
  // the meta description so the two never drift and stay localized.
  const tc = await getTranslations({ locale, namespace: 'contact' });
  return pageMetadata({
    title: `${t('contact')} · semanu.eu`,
    description: tc('intro'),
    path: '/contact',
    locale,
  });
}

export default async function KontaktPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  // SEO: structured data so search engines + Google Business can read the
  // contact info from a stable, indexable URL (the whole point of /contact
  // being a real page rather than only a modal).
  // Reference the single canonical organisation node (emitted in the layout) by
  // @id and attach the ContactPoint to it, rather than declaring a second, partial
  // Organization. Keeps the email crawlable on this stable URL (so AI assistants
  // can answer "how do I contact semanu") without creating a duplicate entity.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${env.siteUrl}/#organization`,
    email: 'hello@semanu.eu',
    telephone: PHONE_DISPLAY,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@semanu.eu',
      telephone: PHONE_DISPLAY,
      contactType: 'customer service',
      availableLanguage: ['de', 'fr', 'en', 'es', 'nl'],
    },
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-band-tint py-24 text-ink">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow text-navy">{t('eyebrow')}</span>
            <h1 className="h2 mt-4 text-ink">{t('h2')}</h1>
            <p className="lead mt-4 text-ink-soft">{t('intro')}</p>

            <dl className="mt-10 space-y-5">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-navy">
                  {t('emailLabel')}
                </dt>
                <dd className="mt-1">
                  <a href="mailto:hello@semanu.eu" className="hover:text-navy">
                    hello@semanu.eu
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-navy">
                  {t('phoneLabel')}
                </dt>
                <dd className="mt-1">
                  <a href={PHONE_TEL_HREF} className="hover:text-navy">
                    {PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-navy">
                  {t('cityLabel')}
                </dt>
                <dd className="mt-1">{t('city')}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-navy">
                  {t('timeLabel')}
                </dt>
                <dd className="mt-1">{t('time')}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-navy">
              {t('formTitle')}
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
