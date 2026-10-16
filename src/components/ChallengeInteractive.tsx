'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { BrandText } from './BrandText';

type Item = { title: string; text: string };

const CENTER: Record<string, string> = {
  de: 'Digitale Herausforderungen',
  fr: 'Défis digitaux',
  en: 'Digital challenges',
  es: 'Retos digitales',
  nl: 'Digitale uitdagingen',
};

// Five distinct on-brand tints (navy + mint + blue + lavender + steel), each
// clearly different so a card's colour bar maps unambiguously to its segment.
const COLORS = ['#16233d', '#93e6be', '#a8c0e8', '#cdd0f0', '#9aa9c9'];

const CX = 120;
const CY = 120;
const R_OUT = 106;
const R_IN = 78; // larger hole (thinner, more modern ring) so the centre label has room
const GAP = 0.05; // radians of gap between segments

function polar(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

/** Donut wedge path from a0 to a1 (radians), outer R_OUT, inner R_IN. */
function wedge(a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(a0, R_OUT);
  const [x1, y1] = polar(a1, R_OUT);
  const [x2, y2] = polar(a1, R_IN);
  const [x3, y3] = polar(a0, R_IN);
  return `M${x0} ${y0} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${R_IN} ${R_IN} 0 ${large} 0 ${x3} ${y3} Z`;
}

/**
 * Interactive "digital challenges" graphic: the heading/intro (passed as
 * children) on the left, a donut on the right, and the challenge cards below.
 * Hovering a card lights up its donut segment (and pops it slightly outward)
 * and reveals its title in the donut centre; hovering a segment lights up its
 * card. One shared hover state links both directions. The card text stays in
 * the DOM for SEO/GEO and as the no-JS fallback.
 */
export function ChallengeInteractive({
  items,
  locale,
  children,
}: {
  items: Item[];
  locale: string;
  children: ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const centerLabel = CENTER[locale] ?? CENTER.nl;
  const n = items.length;
  const step = (Math.PI * 2) / n;
  const start = -Math.PI / 2; // first segment starts at top

  return (
    <div>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>{children}</div>

        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <svg viewBox="0 0 240 240" className="h-full w-full">
            {items.map((_, i) => {
              const a0 = start + i * step + GAP / 2;
              const a1 = start + (i + 1) * step - GAP / 2;
              const mid = (a0 + a1) / 2;
              const isActive = active === i;
              const dimmed = active !== null && !isActive;
              const [dx, dy] = isActive ? [6 * Math.cos(mid), 6 * Math.sin(mid)] : [0, 0];
              return (
                <path
                  key={i}
                  d={wedge(a0, a1)}
                  fill={COLORS[i % COLORS.length]}
                  style={{
                    transform: `translate(${dx}px, ${dy}px)`,
                    transformBox: 'fill-box',
                    opacity: dimmed ? 0.4 : 1,
                    transition: 'transform 0.3s ease, opacity 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              );
            })}
            {/* central hub disc */}
            <circle cx={CX} cy={CY} r={R_IN - 6} fill="#ffffff" stroke="var(--color-paper-2)" strokeWidth="1.5" />
            {/* active accent ring: links the centre to the hovered segment / card
                by colour, without cramming a label into the hole */}
            {active !== null ? (
              <circle
                cx={CX}
                cy={CY}
                r={R_IN - 6}
                fill="none"
                stroke={COLORS[active % COLORS.length]}
                strokeWidth={2.5}
                style={{ opacity: 0.95, transition: 'stroke 0.3s ease' }}
              />
            ) : null}
          </svg>

          {/* centre label: the constant title by default; on hover the centre
              swaps to the active challenge, so the label never overflows the
              ring or collides with a floating segment label. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            <div className="w-[46%] max-w-[190px]">
              {active === null ? (
                <span className="font-display text-[15px] font-semibold leading-snug text-ink">{centerLabel}</span>
              ) : (
                <span className="flex animate-[fadeIn_0.25s_ease] flex-col items-center gap-2">
                  <span
                    aria-hidden
                    className="h-1.5 w-6 rounded-full"
                    style={{ backgroundColor: COLORS[active % COLORS.length] }}
                  />
                  <span className="font-display text-[14px] font-semibold leading-snug text-ink text-balance">
                    <BrandText>{items[active].title}</BrandText>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* cards: horizontal snap scroll on mobile, 5-up grid on sm+ */}
      <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
        {items.map((item, i) => {
          const isActive = active === i;
          return (
            <div
              key={item.title}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={[
                'w-[80%] shrink-0 snap-start rounded-card border bg-white p-6 transition-all duration-200 sm:w-auto sm:shrink',
                isActive
                  ? '-translate-y-0.5 border-navy/30 shadow-[var(--shadow-pop)]'
                  : 'border-[var(--line)]',
              ].join(' ')}
            >
              <span
                aria-hidden
                className="mb-3 block h-1.5 w-8 rounded-full transition-all duration-200"
                style={{ backgroundColor: COLORS[i % COLORS.length], width: isActive ? 40 : 32 }}
              />
              <h3 className="font-display text-lg leading-tight text-ink"><BrandText>{item.title}</BrandText></h3>
              <p className="mt-2 text-sm text-ink-soft"><BrandText>{item.text}</BrandText></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
