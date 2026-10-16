'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Compact language menu for the header. Shows the active locale; the DE/FR/EN
 * options reveal on hover (and on keyboard focus). Swaps locale while staying
 * on the current path; next-intl re-applies the correct prefix.
 */
export function LangMenu() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('lang');

  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={t('label')}
        className="inline-flex items-center gap-1.5 rounded-pill border-2 border-white/70 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white transition-colors hover:bg-white/15"
      >
        {t(locale)}
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="h-1.5 w-2.5 transition-transform duration-150 group-hover:rotate-180"
          fill="none"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* pt-2 is a hover bridge so the menu stays open while the cursor moves down */}
      <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul className="min-w-[6.5rem] overflow-hidden rounded-xl border-2 border-spark bg-red shadow-xl">
          {routing.locales.map((l) => {
            const active = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => router.replace(pathname, { locale: l })}
                  className={[
                    'block w-full px-4 py-2 text-left font-mono text-xs font-bold tracking-wider transition-colors',
                    active ? 'bg-white text-red' : 'text-white hover:bg-white/15',
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
