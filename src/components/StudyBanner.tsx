'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Dismissible announcement for the KMU website study (the citable research
 * asset). A card that slides in from the left a moment after load, bottom-left
 * so it never covers the WhatsApp button (bottom-right). Bump the KEY suffix to
 * make it reappear for everyone when a new study or campaign should show.
 */
const KEY = 'semanu-banner-studie-2026-08';

export function StudyBanner() {
  const t = useTranslations('banner');
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = !!window.localStorage.getItem(KEY);
    } catch {
      dismissed = false;
    }
    if (dismissed) return;
    setOpen(true);
    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* private mode: hides only for this page view */
    }
    setTimeout(() => setOpen(false), 400);
  };

  return (
    <div
      role="complementary"
      aria-label={t('studyEyebrow')}
      className={[
        'fixed bottom-4 left-4 z-[80] w-[min(92vw,360px)] transition-all duration-500 ease-out',
        show ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0',
      ].join(' ')}
    >
      <div className="relative rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(22,35,61,0.45)]">
        <button
          type="button"
          aria-label={t('studyClose')}
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-ink-soft transition-colors hover:text-navy"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" stroke="currentColor" strokeWidth="2.2" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
          </svg>
        </button>
        <span className="eyebrow text-mint-deep">{t('studyEyebrow')}</span>
        <p className="mt-2 pr-5 font-display text-base font-semibold leading-snug text-ink">{t('studyText')}</p>
        <Link
          href="/blog/kmu-website-studie-schweiz"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-mint-deep transition-colors hover:text-navy"
        >
          {t('studyCta')} <span aria-hidden className="btn-arrow" />
        </Link>
      </div>
    </div>
  );
}
