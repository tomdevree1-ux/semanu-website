'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { serviceLinks, type ServicesLocale } from '@/content/services';

/**
 * Desktop dropdown display order. AI Assistants leads the right column (the
 * AI-first differentiator). Canonical order is kept everywhere else (ecosystem
 * numbering, footer, sitemap). The grid is row-major across two columns, so this
 * order yields left = Websites, Marketing Automation, Digitale Plattformen
 * and right = AI Assistants, Email Marketing, Consultancy.
 */
const MENU_ORDER = ['3d-configurators', 'ai-native', 'consultancy'];
const menuRank = (id: string) => {
  const i = MENU_ORDER.indexOf(id);
  return i === -1 ? 999 : i;
};

function useServiceList() {
  const locale = useLocale();
  const safe = (['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale;
  return serviceLinks(safe);
}

const Chevron = ({ className = '' }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 10 6" className={`h-1.5 w-2.5 ${className}`} fill="none">
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

/**
 * Desktop Services mega dropdown. Opens on hover and on keyboard focus, closes on
 * outside click, Escape, blur or after a short grace period when the cursor
 * leaves. Light panel in the amai palette (paper / ink / red, gold accents).
 * Every entry is a real link. The gold "!" ticks a slow single spin (CSS).
 */
export function ServicesMenu({ navLinkClass }: { navLinkClass: string }) {
  const t = useTranslations('nav');
  const services = [...useServiceList()].sort((a, b) => menuRank(a.id) - menuRank(b.id));
  // Two primary services on top (3D configurators + AI-native). Consultancy stays
  // reachable from the footer and its page, but is no longer shown in this dropdown.
  const primary = services.filter((s) => s.id !== 'consultancy');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const cancelClose = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const openMenu = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="services-mega"
        onClick={() => setOpen((v) => !v)}
        className={`${navLinkClass} inline-flex items-center gap-1.5`}
      >
        {t('services')}
        <Chevron className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="services-mega" className="amai-mega absolute left-0 top-full z-50 pt-2">
          <div
            role="menu"
            aria-label={t('servicesMega')}
            className="w-[min(92vw,700px)] rounded-2xl border border-ink/10 bg-white text-ink shadow-2xl"
          >
            <div className="p-4">
              {/* Two primary service cards, equal size. */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {primary.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="group/svc relative flex h-full flex-col rounded-[14px] bg-[#DDF4EA] p-6 transition-colors duration-150 hover:bg-[#CBEEDD]"
                  >
                    <Arrow className="absolute right-5 top-5 text-mint-deep transition-transform duration-150 group-hover/svc:translate-x-1" />
                    <span className="block pr-7 text-[17px] font-semibold leading-tight text-ink">
                      {s.title}
                    </span>
                    <span className="mt-2 block text-[14px] leading-snug text-ink-soft">
                      {s.short}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Services accordion (no hover, no mega panel). Lists "All services" plus
 * the seven services. The gold "!" does a subtle spin while the section is open.
 */
export function ServicesAccordion({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations('nav');
  const services = useServiceList();
  const [open, setOpen] = useState(false);
  const itemCls =
    'rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5';

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-ink transition-colors hover:bg-navy/5"
      >
        <span className="inline-flex items-center gap-1">
          {t('services')}
        </span>
        <Chevron className={`h-2 w-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-1 border-l border-navy/15 pl-3">
          {services.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              onClick={onNavigate}
              className={itemCls}
            >
              {s.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
