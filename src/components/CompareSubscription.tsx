import { Link } from '@/i18n/navigation';
import { BrandText } from './BrandText';

/**
 * Two homepage blocks rebuilt to the "Marine + Mint" comparison design:
 *  - WhyCompare: "the usual way" (white, red crosses) versus "with amai" (mint
 *    tinted, green checks), with a connecting arrow between the two cards.
 *  - SubscriptionBlock: Included (mint tinted) versus Excluded (white), each row
 *    with a line icon.
 * Content is unchanged (same strings/translations); only the presentation is new.
 * Icons are mapped by row index, so they never require content edits.
 */

type IconName =
  | 'users' | 'chat' | 'doc' | 'database'
  | 'user' | 'link' | 'shield' | 'tag'
  | 'gear' | 'book' | 'bars' | 'map'
  | 'puzzle' | 'brush' | 'clock' | 'megaphone';

function LineIcon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    users: (
      <>
        <circle cx="9" cy="9" r="2.6" />
        <path d="M3.6 18c0-3 2.4-5 5.4-5s5.4 2 5.4 5" />
        <path d="M16 7.1a2.6 2.6 0 010 5" />
        <path d="M15.6 13.1c2.5.4 4.4 2.2 4.4 4.7" />
      </>
    ),
    chat: <path d="M20 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3v3l4-3h9a1 1 0 001-1V5a1 1 0 00-1-1z" />,
    doc: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      </>
    ),
    link: (
      <>
        <path d="M9 15l6-6" />
        <path d="M11 6l1-1a4 4 0 015.7 5.7l-2 2" />
        <path d="M13 18l-1 1A4 4 0 016.3 13.3l2-2" />
      </>
    ),
    shield: <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />,
    tag: (
      <>
        <path d="M4 4h7l9 9-7 7-9-9z" />
        <circle cx="8.5" cy="8.5" r="1.4" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v15H5.5A1.5 1.5 0 004 20.5z" />
        <path d="M20 5.5C20 4.7 19.3 4 18.5 4H12v15h6.5a1.5 1.5 0 011.5 1.5z" />
      </>
    ),
    bars: <path d="M5 20V10M12 20V4M19 20v-7" />,
    map: (
      <>
        <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    puzzle: <path d="M14 4a2 2 0 10-4 0H6v4a2 2 0 100 4v4h4a2 2 0 104 0h4v-4a2 2 0 100-4V4z" />,
    brush: <path d="M4 20c0-3 2-4 4-4l8-9 3 3-9 8c0 2-1 4-4 4H4z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    megaphone: <path d="M4 10v4l3 1v3h2v-2l9 3V6l-9 3H4z" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <path d="M3 8.5l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrossMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BAD_ICONS: IconName[] = ['users', 'chat', 'doc', 'database'];
const GOOD_ICONS: IconName[] = ['user', 'link', 'shield', 'tag'];
const INCLUDED_ICONS: IconName[] = ['user', 'chat', 'gear', 'book', 'bars', 'map'];
const EXCLUDED_ICONS: IconName[] = ['puzzle', 'brush', 'clock', 'megaphone'];

export function WhyCompare({
  klassiekLabel,
  amaiLabel,
  klassiek,
  amai,
}: {
  klassiekLabel: string;
  amaiLabel: string;
  klassiek: string[];
  amai: string[];
}) {
  return (
    <div className="relative mt-10 grid gap-4 md:grid-cols-2 md:gap-10">
      {/* The usual way */}
      <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(22,35,61,0.35)] sm:p-8">
        <h3 className="font-display text-xl text-ink"><BrandText>{klassiekLabel}</BrandText></h3>
        <ul className="mt-6 divide-y divide-[var(--line)]">
          {klassiek.map((item, i) => (
            <li key={item} className="flex items-center gap-4 py-4 first:pt-0">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink-soft">
                <LineIcon name={BAD_ICONS[i % BAD_ICONS.length]} className="h-5 w-5" />
              </span>
              <CrossMark className="h-4 w-4 shrink-0 text-danger" />
              <span className="text-sm font-medium text-ink"><BrandText>{item}</BrandText></span>
            </li>
          ))}
        </ul>
      </div>

      {/* With amai */}
      <div className="rounded-3xl border border-mint/60 bg-hero-wash p-6 shadow-[0_24px_60px_-40px_rgba(10,115,89,0.35)] sm:p-8">
        <h3 className="font-display text-xl text-ink"><BrandText>{amaiLabel}</BrandText></h3>
        <ul className="mt-6 divide-y divide-mint/40">
          {amai.map((item, i) => (
            <li key={item} className="flex items-center gap-4 py-4 first:pt-0">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-mint-deep">
                <LineIcon name={GOOD_ICONS[i % GOOD_ICONS.length]} className="h-5 w-5" />
              </span>
              <CheckMark className="h-4 w-4 shrink-0 text-mint-deep" />
              <span className="text-sm font-medium text-ink"><BrandText>{item}</BrandText></span>
            </li>
          ))}
        </ul>
      </div>

      {/* connecting arrow (desktop) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-white text-navy shadow-[0_10px_30px_-12px_rgba(22,35,61,0.5)] md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function SubscriptionCards({
  includedTitle,
  included,
  excludedTitle,
  excluded,
}: {
  includedTitle: string;
  included: string[];
  excludedTitle: string;
  excluded: string[];
}) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
      {/* Included */}
      <div className="rounded-3xl border border-mint/60 bg-hero-wash p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
            <CheckMark className="h-4 w-4" />
          </span>
          <h3 className="font-display text-xl text-ink"><BrandText>{includedTitle}</BrandText></h3>
        </div>
        <ul className="mt-6 divide-y divide-mint/40">
          {included.map((item, i) => (
            <li key={item} className="flex items-center gap-3.5 py-3.5 first:pt-0 text-sm text-ink">
              <LineIcon name={INCLUDED_ICONS[i % INCLUDED_ICONS.length]} className="h-5 w-5 shrink-0 text-mint-deep" />
              <span><BrandText>{item}</BrandText></span>
            </li>
          ))}
        </ul>
      </div>

      {/* Excluded */}
      <div className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <CrossMark className="h-4 w-4" />
          </span>
          <h3 className="font-display text-xl text-ink"><BrandText>{excludedTitle}</BrandText></h3>
        </div>
        <ul className="mt-6 divide-y divide-[var(--line)]">
          {excluded.map((item, i) => (
            <li key={item} className="flex items-center gap-3.5 py-3.5 first:pt-0 text-sm text-ink-soft">
              <LineIcon name={EXCLUDED_ICONS[i % EXCLUDED_ICONS.length]} className="h-5 w-5 shrink-0 text-ink-soft" />
              <span><BrandText>{item}</BrandText></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
