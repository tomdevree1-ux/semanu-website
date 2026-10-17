import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';

/**
 * Localised 404. Next.js renders this for every notFound() inside the [locale]
 * segment: an unknown service slug, an unknown landing slug (dynamicParams:false),
 * and any unmatched path — the always-on locale prefix routes those through here
 * too. Uses the next-intl request locale (same pattern as Footer) so DE/FR/EN all
 * render on brand, with a real 404 status and clear links back into the site,
 * instead of Next's bare default page.
 */
export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-hero-wash py-24 text-ink sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[3px] border-navy/15"
        />
        <div className="container-site relative max-w-2xl">
          <span className="font-display text-7xl leading-none text-navy sm:text-8xl">
            {t('eyebrow')}
          </span>
          <h1 className="h1 mt-6 text-balance">{t('title')}</h1>
          <p className="lead mt-5 text-ink-soft">{t('text')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primary">
              {t('home')} <span aria-hidden className="btn-arrow" />
            </Link>
            <Link href="/contact" className="btn btn-ghost-ink">
              {t('contact')}
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
