'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandText } from './BrandText';

export type TimelineField = { label?: string; text: string };
export type TimelineItem = { title: string; fields: TimelineField[]; note?: string };

/**
 * Vertical process timeline. A central rail runs top to bottom with a step card
 * on alternating sides (desktop) or stacked to the right of the rail (mobile).
 * The accent line fills from the top as the visitor scrolls the section into
 * view, and each dot lights up once the fill passes it.
 *
 * Generic by design: each item carries a title and one or more fields. A single
 * label-less field renders as one paragraph (simple steps); several labelled
 * fields render as a compact 2 column grid (detailed steps). Pure client side.
 */
export function ScrollTimeline({ items }: { items: TimelineItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const rail = railRef.current;
    const fill = fillRef.current;
    if (!wrap || !rail || !fill) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const dots = dotRefs.current.filter((d): d is HTMLSpanElement => Boolean(d));
      if (!dots.length) return;

      // The rail only runs from the centre of the first dot to the centre of
      // the last one, so nothing sticks out above step 1 or below the last step.
      const first = dots[0].getBoundingClientRect();
      const last = dots[dots.length - 1].getBoundingClientRect();
      const railTop = first.top + first.height / 2 - rect.top;
      const railBottom = rect.bottom - (last.top + last.height / 2);
      const railLen = Math.max(1, rect.height - railTop - railBottom);
      rail.style.top = `${railTop}px`;
      rail.style.bottom = `${railBottom}px`;
      fill.style.top = `${railTop}px`;

      const anchor = window.innerHeight * 0.55; // fill up to just below viewport middle
      const frac = Math.max(0, Math.min(1, (anchor - (rect.top + railTop)) / railLen));
      fill.style.height = `${frac * railLen}px`;

      // A dot is active once its centre has passed the anchor line.
      let count = 0;
      for (const dot of dots) {
        if (dot.getBoundingClientRect().top + dot.offsetHeight / 2 <= anchor) count += 1;
      }
      setActive(count);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items.length]);

  return (
    <div ref={wrapRef} className="relative mt-12">
      {/* base rail (first dot centre to last dot centre; measured on mount) */}
      <div
        ref={railRef}
        aria-hidden
        style={{ top: '50%', bottom: '50%' }}
        className="absolute left-6 w-px -translate-x-1/2 bg-[var(--line)] md:left-1/2"
      />
      {/* fill (grows with scroll) */}
      <div
        ref={fillRef}
        aria-hidden
        style={{ top: '50%', height: 0 }}
        className="absolute left-6 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-mint to-mint-deep transition-[height] duration-150 ease-out md:left-1/2"
      />

      <ol className="relative space-y-6 md:space-y-0">
        {items.map((item, i) => {
          const onRight = i % 2 === 1;
          const isActive = i < active;
          const simple = item.fields.length === 1 && !item.fields[0].label;
          return (
            <li key={i} className="relative md:grid md:min-h-[9rem] md:grid-cols-2 md:items-center md:gap-x-16">
              {/* dot, vertically centred on its card */}
              <span
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                aria-hidden
                className={[
                  'absolute left-6 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-sm ring-4 ring-paper transition-colors duration-300 md:left-1/2',
                  isActive ? 'bg-navy text-white' : 'border border-[var(--line)] bg-white text-ink-soft',
                ].join(' ')}
              >
                {i + 1}
              </span>

              {/* card */}
              <div
                className={[
                  'pl-16 md:pl-0',
                  onRight ? 'md:col-start-2' : 'md:col-start-1 md:row-start-1 md:text-right',
                ].join(' ')}
              >
                <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(22,35,61,0.35)] sm:p-7">
                  <div
                    className={[
                      'flex items-baseline gap-3',
                      onRight ? '' : 'md:flex-row-reverse',
                    ].join(' ')}
                  >
                    <span className="font-mono text-xs text-mint-deep">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="h3 text-ink">
                      <BrandText>{item.title}</BrandText>
                    </h3>
                  </div>

                  {simple ? (
                    <p className="mt-3 text-left text-sm leading-relaxed text-ink-soft">
                      <BrandText>{item.fields[0].text}</BrandText>
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-4 text-left sm:grid-cols-2">
                      {item.fields.map((f, fi) => (
                        <div key={fi}>
                          {f.label ? (
                            <span className="font-mono text-[11px] uppercase tracking-wider text-navy">
                              {f.label}
                            </span>
                          ) : null}
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                            <BrandText>{f.text}</BrandText>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.note ? (
                    <div className="mt-4 rounded-lg bg-band-tint px-4 py-3 text-left text-sm text-ink">
                      {item.note.includes(': ') ? (
                        <>
                          <p className="font-display text-ink">
                            {item.note.slice(0, item.note.indexOf(': '))}
                          </p>
                          <p className="mt-1 text-ink-soft">
                            <BrandText>{item.note.slice(item.note.indexOf(': ') + 2)}</BrandText>
                          </p>
                        </>
                      ) : (
                        <BrandText>{item.note}</BrandText>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
