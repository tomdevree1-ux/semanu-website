'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Segmented language switch (DE / FR / EN / ES / NL). Swaps locale while
 * staying on the current path; next-intl re-applies the correct prefix. Locale
 * persists via the URL + the NEXT_LOCALE cookie set by the middleware.
 *
 * `collapsible` (desktop header): only the active language shows; hovering or
 * focusing it slides the full row open to the left, over the nav, so the
 * primary CTA next to it never moves. The mobile menu uses the full row.
 */
export function LangSwitch({ collapsible = false }: { collapsible?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('lang');

  const pills = routing.locales.map((l) => {
    const active = l === locale;
    return (
      <button
        key={l}
        type="button"
        aria-pressed={active}
        onClick={() => router.replace(pathname, { locale: l })}
        className={[
          'font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors',
          active ? 'bg-navy text-white' : 'text-ink hover:bg-navy/5',
        ].join(' ')}
      >
        {t(l)}
      </button>
    );
  });

  const row = (
    <div
      className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--line)] bg-white"
      role="group"
      aria-label={t('label')}
    >
      {pills}
    </div>
  );

  if (!collapsible) return row;

  // Desktop header: a plain-text trigger (no pill, no border) with a dropdown
  // that opens downward on hover / keyboard focus.
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={t('label')}
        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-navy transition-colors hover:text-mint-deep"
      >
        {t(locale)}
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="h-1.5 w-2.5 transition-transform duration-150 group-hover:rotate-180"
          fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* pt-2 is a hover bridge so the menu stays open while the cursor moves down */}
      <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul className="min-w-[5rem] overflow-hidden rounded-lg border border-[var(--line)] bg-white py-1 shadow-[var(--shadow-pop)]" role="menu" aria-label={t('label')}>
          {routing.locales.map((l) => {
            const active = l === locale;
            return (
              <li key={l} role="none">
                <button
                  type="button"
                  role="menuitem"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => router.replace(pathname, { locale: l })}
                  className={[
                    'block w-full px-4 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider transition-colors',
                    active ? 'bg-navy text-white' : 'text-ink hover:bg-navy/5',
                  ].join(' ')}
                >
                  {t(l)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
