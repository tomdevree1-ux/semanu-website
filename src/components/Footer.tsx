import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Brand } from './Brand';
import { LangSwitch } from './LangSwitch';
import { serviceLinks, type ServicesLocale } from '@/content/services';
import { PHONE_DISPLAY, PHONE_TEL_HREF } from '@/lib/contact';

// "Company" column — the pages about amai and how it works.
const COMPANY_LINKS = [
  { key: 'aboutUs', href: '/about' },
  { key: 'work', href: '/referenzen' },
  { key: 'blog', href: '/blog' },
  { key: 'faq', href: '/faq' },
  { key: 'contact', href: '/kontakt' },
] as const;

// Legal links live in the bottom bar (kept accessible site-wide).
const LEGAL_LINKS = [
  { key: 'imprint', href: '/impressum' },
  { key: 'privacy', href: '/datenschutz' },
  { key: 'gtc', href: '/agb' },
] as const;

const headingCls = 'font-mono text-xs uppercase tracking-widest text-spark';
const linkCls = 'text-paper/80 transition-colors hover:text-white';

/** Footer — bordeaux. Brand header, then four columns: Services, Company,
 *  Popular topics, Contact. Legal links + copyright sit in the bottom bar. */
export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const services = serviceLinks((['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="container-site pb-14 pt-12">
        {/* Brand header */}
        <div className="flex flex-col gap-5 border-b border-[var(--line-light)] pb-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <Brand className="text-2xl text-white" />
            <p className="mt-3 text-sm text-paper/70">{t('tagline')}</p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/amai.swiss"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="amai! auf Instagram (amai.swiss)"
              className="inline-flex items-center gap-2 text-sm text-paper/80 transition-colors hover:text-spark"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span>amai.swiss</span>
            </a>
            <a
              href="https://www.linkedin.com/company/137144354"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="amai! auf LinkedIn"
              className="inline-flex items-center gap-2 text-sm text-paper/80 transition-colors hover:text-spark"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V23h-4V8zm7.5 0h3.77v2.05h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V23h-4v-6.18c0-1.47-.03-3.37-2.05-3.37-2.06 0-2.37 1.6-2.37 3.26V23h-4V8z" />
              </svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="mt-8 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {/* Services */}
          <div>
            <h5 className={headingCls}>{t('servicesTitle')}</h5>
            <ul className="mt-4 space-y-2 text-sm">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={s.href} className={linkCls}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className={headingCls}>{t('companyTitle')}</h5>
            <ul className="mt-4 space-y-2 text-sm">
              {COMPANY_LINKS.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className={linkCls}>
                    {tn(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className={headingCls}>{t('contactTitle')}</h5>
            <ul className="mt-4 space-y-2 text-sm text-paper/80">
              <li>
                <a href="mailto:hello@amai.ch" className="transition-colors hover:text-white">
                  hello@amai.ch
                </a>
              </li>
              <li>
                <a href={PHONE_TEL_HREF} className="transition-colors hover:text-white">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>{t('location')}</li>
            </ul>
            <div className="mt-5">
              <h5 className={`mb-2 ${headingCls}`}>{t('langLabel')}</h5>
              <LangSwitch />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright + legal */}
      <div className="container-site flex flex-col gap-3 border-t border-[var(--line-light)] py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-paper/70">
          © {year} <Brand className="text-white" /> · {t('rights')}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-paper/70">
          {LEGAL_LINKS.map((l) => (
            <li key={l.key}>
              <Link href={l.href} className="transition-colors hover:text-white">
                {t(`legal.${l.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
