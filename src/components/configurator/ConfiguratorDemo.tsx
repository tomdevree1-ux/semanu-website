'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Original, self-contained configurator demo. Option groups drive a live
 * abstract preview and an indicative price. No third party code, assets or
 * product names: every option here is semanu's own generic sample data, passed in
 * by the page. This is a Phase 1 marketing demo, not a production 3D engine.
 */

export type DemoOption = { label: string; price?: number; swatch?: string };
export type DemoStep = { label: string; options: DemoOption[] };
export type DemoConfig = {
  currency: string; // e.g. 'EUR'
  basePrice: number;
  priceNote: string; // "indicative price" line
  steps: DemoStep[];
  previewLabel: string;
  summaryLabel: string;
  ctaLabel: string;
  ctaHref: string;
};

function formatPrice(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export function ConfiguratorDemo({ config }: { config: DemoConfig }) {
  const [sel, setSel] = useState<number[]>(() => config.steps.map(() => 0));

  const price = useMemo(() => {
    let p = config.basePrice;
    config.steps.forEach((s, i) => {
      p += s.options[sel[i]]?.price ?? 0;
    });
    return p;
  }, [config, sel]);

  // The most recently defined swatch across the chosen options tints the preview.
  const previewColor = useMemo(() => {
    let c = 'var(--color-paper-2)';
    config.steps.forEach((s, i) => {
      const sw = s.options[sel[i]]?.swatch;
      if (sw) c = sw;
    });
    return c;
  }, [config, sel]);

  const chosen = config.steps.map((s, i) => s.options[sel[i]]?.label).filter(Boolean);

  return (
    <div className="grid gap-6 rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-7 lg:grid-cols-2 lg:gap-10">
      {/* preview */}
      <div className="flex flex-col">
        <div
          className="relative flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)]"
          style={{ background: `linear-gradient(160deg, var(--color-paper), ${previewColor})` }}
        >
          <svg viewBox="0 0 200 130" className="h-40 w-auto" aria-hidden>
            <rect x="24" y="40" width="152" height="60" rx="12" fill={previewColor} stroke="rgba(22,35,61,0.25)" />
            <rect x="24" y="30" width="152" height="26" rx="12" fill={previewColor} stroke="rgba(22,35,61,0.18)" />
            <rect x="30" y="100" width="14" height="16" rx="3" fill="rgba(22,35,61,0.35)" />
            <rect x="156" y="100" width="14" height="16" rx="3" fill="rgba(22,35,61,0.35)" />
          </svg>
          <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
            {config.previewLabel}
          </span>
        </div>
        <div className="mt-3 text-sm text-ink-soft">
          <span className="font-semibold text-ink">{config.summaryLabel}:</span> {chosen.join(' · ')}
        </div>
      </div>

      {/* options + price */}
      <div className="flex flex-col">
        <div className="grid gap-5">
          {config.steps.map((step, si) => (
            <div key={step.label}>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-navy">{step.label}</div>
              <div className="flex flex-wrap gap-2">
                {step.options.map((opt, oi) => {
                  const active = sel[si] === oi;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSel((s) => s.map((v, i) => (i === si ? oi : v)))}
                      aria-pressed={active}
                      className={[
                        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                        active ? 'border-navy bg-navy text-white' : 'border-[var(--line)] bg-white text-ink hover:border-navy/40',
                      ].join(' ')}
                    >
                      {opt.swatch ? (
                        <span
                          aria-hidden
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: opt.swatch }}
                        />
                      ) : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-[var(--line)] pt-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{config.priceNote}</div>
            <div className="font-display text-2xl text-ink">
              {config.currency} {formatPrice(price)}
            </div>
          </div>
          <Link href={config.ctaHref} className="btn btn-primary">
            {config.ctaLabel} <span aria-hidden className="btn-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}
