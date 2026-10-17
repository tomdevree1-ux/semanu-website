'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const COOKIE_NAME = 'semanu_cc';
const ONE_YEAR = 60 * 60 * 24 * 365;

// necessary = reject all but essential · analytics = GA only · all = GA + marketing (Ads/LinkedIn)
type Choice = 'all' | 'analytics' | 'necessary';

function readChoice(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Cookie consent chooser — a prominent centred modal over a dimmed page.
 * Explains the three cookie categories (necessary / analytics / marketing) and
 * offers three choices: accept all, analytics only, or reject. The choice
 * persists in a cookie + localStorage and is broadcast via the `semanu-consent`
 * event so Analytics (Google Consent Mode v2) updates without a reload:
 *   necessary → everything denied · analytics → analytics_storage only ·
 *   all → analytics + ad signals granted.
 */
export function CookieBanner() {
  const t = useTranslations('cookie');
  const [decided, setDecided] = useState(true); // assume decided => render nothing (no SSR mismatch)
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (readChoice()) return;
    setDecided(false);
    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, []);

  function store(choice: Choice) {
    document.cookie = `${COOKIE_NAME}=${choice}; max-age=${ONE_YEAR}; path=/; SameSite=Lax`;
    try {
      localStorage.setItem(COOKIE_NAME, choice);
    } catch {
      // localStorage unavailable (private mode): the cookie above is enough.
    }
    window.dispatchEvent(new CustomEvent('semanu-consent', { detail: choice }));
    setShow(false);
    setTimeout(() => setDecided(true), 300);
  }

  if (decided) return null;

  const categories: [string, string][] = [
    ['necessaryTitle', 'necessaryText'],
    ['analyticsTitle', 'analyticsText'],
    ['marketingTitle', 'marketingText'],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      className={[
        'fixed inset-0 z-[100] flex items-end justify-center p-4 transition-opacity duration-300 sm:items-center',
        show ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <div aria-hidden className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" />
      <div
        className={[
          'relative w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl transition-transform duration-300 sm:p-8',
          show ? 'translate-y-0' : 'translate-y-4',
        ].join(' ')}
      >
        <h2 className="h3 text-ink">{t('title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t('intro')}</p>

        <ul className="mt-5 space-y-3">
          {categories.map(([titleKey, textKey]) => (
            <li key={titleKey} className="flex gap-3">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint-deep" />
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{t(titleKey)}</span> {t(textKey)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="button" onClick={() => store('all')} className="btn btn-primary !py-2.5 !text-sm">
            {t('acceptAll')}
          </button>
          <button type="button" onClick={() => store('analytics')} className="btn btn-ghost-ink !py-2.5 !text-sm">
            {t('analyticsOnly')}
          </button>
          <button type="button" onClick={() => store('necessary')} className="btn btn-ghost-ink !py-2.5 !text-sm">
            {t('reject')}
          </button>
          <Link
            href="/privacy"
            className="text-sm text-ink-soft underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-navy sm:ml-auto"
          >
            {t('privacy')}
          </Link>
        </div>
      </div>
    </div>
  );
}
