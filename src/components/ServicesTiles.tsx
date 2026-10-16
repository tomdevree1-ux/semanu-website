import { Link } from '@/i18n/navigation';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { serviceLinks } from '@/content/services';

/**
 * Premium "block tiles" layout of the four services: a 2 x 2 grid of coloured
 * cards (white, deep green, navy, mint) with a faux 3D edge shadow and a slight
 * column stagger, so it reads like interlocking blocks. Each tile is a real link
 * to its service page. Colours map to the display order (01..04).
 */
type Tile = {
  bg: string;
  edge: string;
  text: string;
  sub: string;
  num: string;
  icon: string;
};

// Index-based styling (matches the 01..04 display order).
const TILES: Tile[] = [
  { bg: '#ffffff', edge: '#e2e8f2', text: 'text-ink', sub: 'text-ink-soft', num: 'text-mint-deep', icon: 'text-navy' },
  { bg: '#0a7359', edge: '#06503d', text: 'text-white', sub: 'text-white/80', num: 'text-mint', icon: 'text-mint' },
  { bg: '#16233d', edge: '#0b1526', text: 'text-white', sub: 'text-white/75', num: 'text-mint', icon: 'text-mint' },
  { bg: '#93e6be', edge: '#6fcfa6', text: 'text-ink', sub: 'text-ink-soft', num: 'text-mint-deep', icon: 'text-mint-deep' },
];

export function ServicesTiles({ services }: { services: ReturnType<typeof serviceLinks> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-7">
      {services.slice(0, 4).map((s, i) => {
        const t = TILES[i % TILES.length];
        // Stagger the right column down a touch for the interlocking look.
        const stagger = i % 2 === 1 ? 'sm:mt-12' : '';
        return (
          <Link
            key={s.id}
            href={s.href}
            aria-label={s.title}
            className={`group relative block overflow-hidden rounded-[16px] p-7 transition-transform duration-200 hover:-translate-y-1.5 sm:p-9 ${stagger}`}
            style={{
              backgroundColor: t.bg,
              boxShadow: `0 12px 0 -1px ${t.edge}, 0 36px 48px -26px rgba(16,35,61,0.5)`,
            }}
          >
            <span className={`block font-display text-[26px] leading-none ${t.num}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={`mt-5 flex h-8 w-8 items-center justify-center ${t.icon}`}>
              <ServiceIcon id={s.icon} className="h-7 w-7" />
            </span>
            <h3 className={`mt-5 font-display text-xl leading-tight ${t.text}`}>{s.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${t.sub}`}>{s.short}</p>
          </Link>
        );
      })}
    </div>
  );
}
