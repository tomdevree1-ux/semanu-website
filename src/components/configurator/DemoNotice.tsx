import { Link } from '@/i18n/navigation';
import { DEMO_NOTICE, type ConfLocale } from '@/content/demo';

/**
 * Friendly notice placed directly above or below an embedded demo configurator:
 * visitors may try everything, but quote requests and orders are not processed.
 * Sits outside the 3D canvas (never overlaid) and wraps on small screens.
 */
export function DemoNotice({ locale, className = '' }: { locale: string; className?: string }) {
  const n = DEMO_NOTICE[locale as ConfLocale] ?? DEMO_NOTICE.en;
  return (
    <p
      role="note"
      className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded-card border border-[var(--line)] bg-white px-4 py-3 text-sm leading-relaxed text-ink sm:items-center ${className}`}
    >
      <span className="shrink-0 rounded-sm bg-mint px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-navy">
        {n.badge}
      </span>
      <span className="min-w-0 flex-1 basis-[16rem] text-ink-soft">
        {n.text}{' '}
        <Link
          href="/contact?interest=3d-configurators"
          className="font-semibold text-mint-deep underline underline-offset-2 hover:text-navy"
        >
          {n.cta}
        </Link>
      </span>
    </p>
  );
}
