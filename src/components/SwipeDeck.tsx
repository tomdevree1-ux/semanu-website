'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

/**
 * Smartphone-only swipe carousel with dot indicators.
 *
 * - Below `sm` (phones): the children become a horizontal, scroll-snapping
 *   carousel (one card per swipe, with a small peek of the next), and a row of
 *   dots underneath shows how many cards there are + which one is active. Tap a
 *   dot to jump to that card.
 * - `sm` and up (tablet/desktop): renders as the normal grid passed via
 *   `gridClassName` — no carousel, no dots — so larger screens are unchanged.
 *
 * Children are cloned to receive the carousel item classes, so the cards keep
 * their own styling and stay the grid items on desktop (equal height).
 */
export function SwipeDeck({
  children,
  gridClassName = 'sm:grid sm:grid-cols-1 lg:grid-cols-3',
  className = 'mt-10',
}: {
  children: ReactNode;
  gridClassName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      const kids = Array.from(el.children) as HTMLElement[];
      let best = 0;
      let bestDist = Infinity;
      kids.forEach((k, i) => {
        const c = k.offsetLeft + k.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const k = el.children[i] as HTMLElement | undefined;
    if (k) el.scrollTo({ left: k.offsetLeft - (el.clientWidth - k.offsetWidth) / 2, behavior: 'smooth' });
  };

  return (
    <div className={className}>
      <div
        ref={ref}
        className={`swipe-deck flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 [scrollbar-width:none] sm:overflow-visible sm:snap-none sm:pb-0 ${gridClassName}`}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const el = child as ReactElement<{ className?: string }>;
          return cloneElement(el, {
            className: `${el.props.className ?? ''} min-w-[86%] shrink-0 snap-center sm:min-w-0`.trim(),
          });
        })}
      </div>

      {count > 1 ? (
        <div className="mt-6 flex justify-center gap-2 sm:hidden">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Karte ${i + 1} von ${count}`}
              aria-current={i === active}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === active ? 'w-6 bg-navy' : 'w-2 bg-navy/25'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
