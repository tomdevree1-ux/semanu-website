'use client';

import { useState } from 'react';
import { BrandText } from './BrandText';

type FaqItem = { q: string; a: string };

/**
 * FAQ as separate rounded cards. Each question sits in its own bordered card with
 * a + / × button that expands the card downward to reveal the answer and collapses
 * it again. Height animates via the grid-rows 0fr->1fr trick, so it stays smooth
 * for any answer length without measuring in JS. Single-open: opening one closes
 * the previously open one. Two columns on md+ (the parent controls the width);
 * `topGap` adds the standard top margin when the heading sits directly above.
 */
export function FaqAccordion({ items, topGap = true }: { items: FaqItem[]; topGap?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={`${topGap ? 'mt-10' : ''} grid gap-5 md:grid-cols-2 md:items-start`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
              isOpen ? 'border-mint-deep/40' : 'border-[var(--line)]'
            }`}
          >
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-[clamp(112px,9vw,150px)] w-full items-center justify-between gap-4 p-[clamp(20px,2vw,30px)] text-left"
              >
                <span className="text-[clamp(18px,1.7vw,22px)] font-semibold leading-snug text-navy">
                  <BrandText>{item.q}</BrandText>
                </span>
                <span
                  aria-hidden
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-2xl font-light leading-none transition-all duration-300 ease-out ${
                    isOpen
                      ? 'rotate-45 border-mint-deep bg-mint/20 text-mint-deep'
                      : 'border-[var(--line)] text-mint-deep'
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-[clamp(18px,1.8vw,26px)] pb-[clamp(18px,1.8vw,26px)] text-[clamp(16px,1.5vw,20px)] leading-relaxed text-ink-soft">
                  <BrandText>{item.a}</BrandText>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
