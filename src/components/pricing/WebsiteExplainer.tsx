// Sales copy under the Website configurator. Copy comes localized from
// src/content/pricingCopy.ts.

import type { PricingCopy } from '@/content/pricingCopy';

export function WebsiteExplainer({ copy }: { copy: PricingCopy['explainer'] }) {
  return (
    <div id="included" className="mt-16 scroll-mt-24 border-t border-[var(--line)] pt-12">
      <div className="max-w-2xl">
        <h2 className="h2 text-ink">{copy.h2}</h2>
        <p className="lead mt-4 text-ink-soft">{copy.lead}</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {copy.includes.map((it) => (
          <div key={it.title} className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h3 className="font-display text-lg leading-tight text-ink">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{it.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-2xl rounded-2xl border border-mint/50 bg-hero-wash p-6">
        <h3 className="font-display text-lg text-ink">{copy.conditionsTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{copy.conditionsText}</p>
      </div>
    </div>
  );
}
