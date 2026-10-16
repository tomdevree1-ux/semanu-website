'use client';

import { Children, cloneElement, isValidElement, useCallback, useEffect, useRef, type ReactElement } from 'react';

type Props = {
  children: React.ReactNode;
  /** Accessible label for the scroll region. */
  label?: string;
  /** Autoplay interval in ms. */
  intervalMs?: number;
  prevLabel?: string;
  nextLabel?: string;
};

const GAP = 24; // matches gap-6 between slides

/**
 * Horizontal, snap-scrolling carousel for the reference cases. Prev/next arrows,
 * gentle autoplay that pauses while the visitor hovers, focuses or touches a card.
 * The slides are rendered twice, so the band loops seamlessly and endlessly in one
 * direction: when the scroll reaches the duplicate set it rewinds by exactly one
 * set (instantly, on identical content), so it never springs back to the start.
 */
export function ReferenceCarousel({
  children,
  label,
  intervalMs = 1500,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const items = Children.toArray(children);
  const dup = items.map((c, i) =>
    isValidElement(c)
      ? cloneElement(c as ReactElement<Record<string, unknown>>, { key: `dup-${i}`, 'aria-hidden': true })
      : c,
  );

  const stepSize = () => {
    const el = ref.current;
    if (!el) return 0;
    const first = el.querySelector<HTMLElement>('[data-slide]');
    return first ? first.offsetWidth + GAP : el.clientWidth;
  };

  const goNext = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    // At the start of the duplicate set, rewind one set instantly (identical
    // content, so invisible) before stepping, so motion stays forward forever.
    if (half > 0 && el.scrollLeft >= half - 4) {
      el.scrollLeft -= half;
    }
    el.scrollBy({ left: stepSize(), behavior: 'smooth' });
  }, []);

  const goPrev = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half > 0 && el.scrollLeft <= 4) {
      el.scrollLeft += half;
    }
    el.scrollBy({ left: -stepSize(), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused.current) goNext();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [goNext, intervalMs]);

  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
  };

  const arrow =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-ink shadow-[0_6px_18px_-10px_rgba(7,34,31,0.5)] transition hover:border-navy/40 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy';

  return (
    <div
      className="relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="mb-6 flex justify-end gap-3 px-6 sm:px-8">
        <button type="button" onClick={goPrev} aria-label={prevLabel} className={arrow}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" onClick={goNext} aria-label={nextLabel} className={arrow}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-6 px-6 pb-4 sm:scroll-px-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items}
        {dup}
      </div>
    </div>
  );
}
