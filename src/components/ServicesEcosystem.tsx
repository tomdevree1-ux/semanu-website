import { Link } from '@/i18n/navigation';
import { serviceLinks } from '@/content/services';

/**
 * "What we do" overview: a 2 x 4 card grid of the seven amai services. Each card
 * is a link to its service page with the index number on the left and the
 * title plus a one line blurb beside it, so the six cards stay as compact as
 * the text column next to them. Server component — the hover is pure CSS.
 */

// Service order (by id). Any service not listed is appended, so the grid stays
// robust to content edits.
const NODE_ORDER = [
  '3d-configurators',
  'marketing-automation',
  'consultancy',
  'business-systems',
] as const;

/** Reorder the incoming services by NODE_ORDER; append any extras. */
function orderServices(services: ReturnType<typeof serviceLinks>) {
  const byId = new Map(services.map((s) => [s.id, s]));
  const ordered = NODE_ORDER.map((id) => byId.get(id)).filter(
    (s): s is ReturnType<typeof serviceLinks>[number] => Boolean(s),
  );
  const extras = services.filter((s) => !NODE_ORDER.includes(s.id as (typeof NODE_ORDER)[number]));
  return [...ordered, ...extras];
}

export function ServicesEcosystem({
  services,
  locale: _locale,
}: {
  services: ReturnType<typeof serviceLinks>;
  locale: string;
  /** Kept for API compatibility (the old orbit used a centre label). */
  center?: string;
}) {
  const ordered = orderServices(services);

  return (
    <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2 sm:auto-rows-fr">
      {ordered.map((s, i) => (
        <Link
          key={s.id}
          href={s.href}
          aria-label={s.title}
          className="group flex h-full items-center gap-4 rounded-2xl border border-[var(--line)] bg-white px-5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[var(--shadow-pop)]"
        >
          <span className="w-[2.6rem] shrink-0 font-display text-[1.75rem] leading-none tracking-tight text-mint-deep transition-colors duration-200 group-hover:text-navy">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0 flex-1">
            <h3 className="font-sans text-[15px] font-semibold leading-tight text-ink">{s.title}</h3>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">{s.short}</p>
          </span>
        </Link>
      ))}
    </div>
  );
}
