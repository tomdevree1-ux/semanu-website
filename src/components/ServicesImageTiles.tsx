import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { serviceLinks } from '@/content/services';

/**
 * The rendered "puzzle tiles" visual used as-is, made interactive: four
 * invisible hotspots sit over the four pieces and link to each service page.
 * Hovering a piece lifts it slightly and shows a soft mint glow. Coordinates
 * are percentages of the image box (easy to fine-tune).
 */
const SPOTS = [
  { left: '18%', top: '13%', width: '27%', height: '30%' }, // 01 top-left
  { left: '45%', top: '11%', width: '33%', height: '36%' }, // 02 top-right
  { left: '22%', top: '43%', width: '35%', height: '46%' }, // 03 bottom-left
  { left: '52%', top: '48%', width: '33%', height: '38%' }, // 04 bottom-right
];

export function ServicesImageTiles({ services }: { services: ReturnType<typeof serviceLinks> }) {
  const items = services.slice(0, 4);
  return (
    <div className="relative mx-auto w-full max-w-[960px]">
      <div className="relative aspect-[3/2]">
        <Image
          src="/services-grid.jpg"
          alt="amai diensten: 3D-configuratoren, workflowautomatisering, consultancy en maatwerksoftware"
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-contain"
        />
        {items.map((s, i) => {
          const sp = SPOTS[i] ?? SPOTS[0];
          return (
            <Link
              key={s.id}
              href={s.href}
              aria-label={s.title}
              className="group/tile absolute"
              style={{ left: sp.left, top: sp.top, width: sp.width, height: sp.height }}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-[22px] transition-all duration-200 ease-out group-hover/tile:-translate-y-1 group-hover/tile:bg-white/5 group-hover/tile:shadow-[0_0_0_2px_rgba(147,230,190,0.9),0_18px_36px_-14px_rgba(10,115,89,0.5)] group-focus-visible/tile:shadow-[0_0_0_2px_rgba(147,230,190,0.9)]"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
