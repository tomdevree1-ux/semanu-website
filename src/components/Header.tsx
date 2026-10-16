'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { serviceLinks, type ServicesLocale } from '@/content/services';
import { BrandLogo } from './BrandLogo';
import { BrandText } from './BrandText';
import { LangSwitch } from './LangSwitch';

const NAV_BEFORE = [
  { key: 'work', href: '/referenzen' },
] as const;

// Grouped under the "About" dropdown.
const ABOUT_MENU = [
  { key: 'aboutUs', href: '/about', descKey: 'aboutDesc' },
  { key: 'blog', href: '/blog', descKey: 'blogDesc' },
  { key: 'faq', href: '/faq', descKey: 'faqDesc' },
] as const;

const NAV_AFTER = [{ key: 'contact', href: '/kontakt' }] as const;

const Chevron = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 10 6" className={`h-1.5 w-2.5 ${className}`} fill="none">
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Same green arrow as the Diensten dropdown (ServicesMenu).
const Arrow = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 16 16" className={`h-4 w-4 ${className}`} fill="none">
    <path
      d="M4 8h8M8.5 4.5L12 8l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Small diagonal arrow for the service pills.
const ArrowUpRight = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 16 16" className={`h-3 w-3 ${className}`} fill="none">
    <path
      d="M5 11l6-6M6 5h5v5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Sticky header (rebrand): frosted light bar with a hairline bottom border, so it
 * sits cleanly over the hero photo and on light pages. Navy logo (green chevron) +
 * navy nav links, an "About" dropdown, the DE/FR/EN language pills and a navy
 * "Jetzt starten" CTA. Mobile: a toggle opens a light dropdown with the pages,
 * the CTA and the language switch.
 */
export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // The two highlighted services, shown as pills in place of the old "Diensten"
  // dropdown. Hrefs come from the locale-aware services list so links stay correct.
  const svc = serviceLinks((['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale);
  const hrefFor = (id: string) => svc.find((s) => s.id === id)?.href ?? '/kontakt';
  const SERVICE_PILLS = [
    { id: '3d-configurators', label: t('pill3d'), href: hrefFor('3d-configurators') },
    { id: 'ai-native', label: t('pillAi'), href: hrefFor('ai-native') },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Transparent over the hero at the top; frosted white once scrolled so the
  // navy nav stays legible over light page content.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const close = () => {
    setOpen(false);
    setAboutOpen(false);
  };

  const navLink =
    'rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-navy hover:bg-navy/5';

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled || open
          ? 'border-b border-[var(--line)] bg-white/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-site flex h-[72px] items-center gap-7">
        <Link href="/" className="text-navy" onClick={close}>
          <BrandLogo className="text-[28px]" chevronColor="var(--color-mint-deep)" />
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-1 md:flex">
          {/* Highlighted service pills (replace the old Diensten dropdown). */}
          <div className="mr-1 flex items-center gap-2">
            {SERVICE_PILLS.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                aria-current={isActive(p.href) ? 'page' : undefined}
                className={`group/pill inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-semibold text-navy transition-colors duration-150 ${
                  isActive(p.href) ? 'bg-[#BDE9D2]' : 'bg-[#DDF4EA] hover:bg-[#CBEEDD]'
                }`}
              >
                {p.label}
                <ArrowUpRight className="text-mint-deep transition-transform duration-150 group-hover/pill:translate-x-0.5 group-hover/pill:-translate-y-0.5" />
              </Link>
            ))}
          </div>

          {NAV_BEFORE.map((item) => (
            <Link key={item.key} href={item.href} className={navLink}>
              {t(item.key)}
            </Link>
          ))}

          {/* About dropdown (opens on hover and on keyboard focus). */}
          <div className="group relative">
            <button type="button" aria-haspopup="menu" className={`${navLink} inline-flex items-center gap-1.5`}>
              {t('about')}
              <Chevron className="transition-transform duration-150 group-hover:rotate-180" />
            </button>
            {/* pt-2 is a hover bridge so the menu stays open while the cursor moves down */}
            <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div
                role="menu"
                aria-label={t('about')}
                className="w-[min(92vw,360px)] rounded-2xl border border-ink/10 bg-white p-3.5 text-ink shadow-2xl"
              >
                <ul className="flex flex-col gap-2">
                  {ABOUT_MENU.map((item) => (
                    <li key={item.key} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        className="group/ab block rounded-[14px] bg-white px-4 py-3 transition-colors duration-200 hover:bg-paper"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[16px] font-semibold leading-tight text-navy">
                            <BrandText>{t(item.key)}</BrandText>
                          </span>
                          <Arrow className="ml-auto shrink-0 text-mint-deep transition-transform duration-200 group-hover/ab:translate-x-1" />
                        </span>
                        <span className="mt-1 block text-[13px] leading-snug text-ink-soft">
                          <BrandText>{t(item.descKey)}</BrandText>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {NAV_AFTER.map((item) => (
            <Link key={item.key} href={item.href} className={navLink}>
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop right: collapsed language pill (opens on hover) + the primary CTA. */}
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <Link href="/kontakt" className="btn btn-primary !px-5 !py-2.5 !text-sm">
            {t('start')} <span aria-hidden className="btn-arrow" />
          </Link>
          <LangSwitch collapsible />
        </div>

        {/* Mobile: hamburger toggle. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-navy/5 md:hidden"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu. */}
      {open && (
        <div id="mobile-menu" className="border-t border-[var(--line)] bg-white md:hidden">
          <nav className="container-site flex flex-col gap-1 py-4">
            {/* Highlighted service pills at the top of the mobile menu. */}
            <div className="mb-2 flex flex-col gap-2">
              {SERVICE_PILLS.map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  onClick={close}
                  aria-current={isActive(p.href) ? 'page' : undefined}
                  className={`flex items-center justify-between rounded-[10px] px-3 py-3 text-base font-semibold text-navy transition-colors ${
                    isActive(p.href) ? 'bg-[#BDE9D2]' : 'bg-[#DDF4EA]'
                  }`}
                >
                  {p.label}
                  <ArrowUpRight className="h-4 w-4 text-mint-deep" />
                </Link>
              ))}
            </div>

            {NAV_BEFORE.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5"
              >
                {t(item.key)}
              </Link>
            ))}

            {/* About: collapsible group. */}
            <button
              type="button"
              onClick={() => setAboutOpen((v) => !v)}
              aria-expanded={aboutOpen}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5"
            >
              {t('about')}
              <Chevron className={`h-2 w-3 transition-transform duration-150 ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div className="ml-3 flex flex-col gap-1 border-l border-[var(--line)] pl-3">
                {ABOUT_MENU.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={close}
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5"
                  >
                    {t(item.key)}
                  </Link>
                ))}
              </div>
            )}

            {NAV_AFTER.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5"
              >
                {t(item.key)}
              </Link>
            ))}

            <Link
              href="/kontakt"
              onClick={close}
              className="btn btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 !py-3 !text-sm"
            >
              {t('start')} <span aria-hidden className="btn-arrow" />
            </Link>
            <div className="mt-4">
              <LangSwitch />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
