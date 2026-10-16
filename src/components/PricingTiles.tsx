import { TrackedLink } from './TrackedLink';
import { ServiceIcon } from './ServiceIcon';

export type PricingTile = {
  id: string;
  name: string;
  from: boolean;
  price: string;
  per: string;
  sub: string;
  desc: string;
  icon: string;
  href: string;
};

/* One unified grid of service tiles, mirroring the approved HTML design. The face
   shows an icon, name, price and a short sub line; hover (or keyboard focus)
   reveals a navy overlay with a longer description and a learn more cue. */
export function PricingTiles({
  tiles,
  fromLabel,
  moreLabel,
}: {
  tiles: PricingTile[];
  fromLabel: string;
  moreLabel: string;
}) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <TrackedLink
          key={tile.id}
          href={tile.href}
          event="pricing_cta_clicked"
          eventParams={{ plan: tile.id, from: 'pricing_tiles' }}
          className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-white p-5 transition-shadow hover:shadow-[var(--shadow-pop)]"
        >
          {/* Face */}
          <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-navy">
            <ServiceIcon id={tile.icon} className="h-5 w-5" />
            <span className="absolute -bottom-1 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-mint" />
          </span>
          <h3 className="mt-5 font-display text-lg leading-tight text-ink">{tile.name}</h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            {tile.from ? (
              <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">{fromLabel}</span>
            ) : null}
            <span className="font-display text-2xl text-ink">{tile.price}</span>
            <span className="font-mono text-xs text-ink-soft">{tile.per}</span>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">{tile.sub}</p>

          {/* Hover / focus overlay */}
          <span
            aria-hidden
            className="absolute inset-0 flex flex-col justify-between bg-navy p-5 text-white opacity-0 translate-y-1 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
          >
            <span>
              <span className="font-display text-base leading-tight">{tile.name}</span>
              <span className="mt-2 block text-sm leading-snug text-paper/85">{tile.desc}</span>
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-mint">
              {moreLabel} <span aria-hidden className="btn-arrow" />
            </span>
          </span>
        </TrackedLink>
      ))}
    </div>
  );
}
