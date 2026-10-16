import { Link } from '@/i18n/navigation';
import type { serviceLinks } from '@/content/services';

/**
 * The four services on the homepage, shown as white cards on the mint band in an
 * asymmetric two-row grid (row 1: 01 wide + 02 narrow; row 2: 03 narrow + 04
 * wide), so it reads with rhythm instead of a flat 2x2. Each card carries an
 * index number, the title, a short description and a round semanu chevron mark
 * (>>) that fills on hover. Content comes from the services data, so it stays in
 * every locale.
 */

// Column spans on a 12-col grid (desktop). Mirrors the wireframe proportions.
const SPAN = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

/** A single semanu chevron (the favicon mark), using the logo chevron shape. */
function Chevron() {
  return (
    <svg width="11" height="16" viewBox="0 0 14 20" fill="none" aria-hidden className="shrink-0">
      <path d="M2.2 2.2L11.8 10L2.2 17.8" stroke="currentColor" strokeWidth="4.4" strokeLinejoin="miter" strokeLinecap="butt" />
    </svg>
  );
}

export function ServicesPuzzle({ services }: { services: ReturnType<typeof serviceLinks> }) {
  const items = services.slice(0, 4);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {items.map((s, i) => (
        <Link
          key={s.id}
          href={s.href}
          aria-label={s.title}
          className={`group relative flex min-h-[240px] flex-col rounded-[12px] border border-ink/[0.06] bg-white p-8 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_34px_56px_-30px_rgba(16,35,61,0.45)] sm:p-10 ${SPAN[i] ?? 'md:col-span-6'}`}
        >
          <span className="font-mono text-sm font-bold tracking-[0.14em] text-mint-deep">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-3.5 font-mono text-[22px] font-extrabold leading-tight tracking-[-0.015em] text-navy sm:text-[26px]">
            {s.title}
          </h3>
          <p className="mt-3.5 max-w-[48ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-ink-soft">
            {s.description}
          </p>
          <span className="mt-auto flex justify-end pt-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-mint-deep/50 text-mint-deep transition-colors duration-200 group-hover:border-mint-deep group-hover:bg-mint-deep group-hover:text-white">
              <Chevron />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
