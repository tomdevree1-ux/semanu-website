'use client';

// Interactive pricing configurator for the Website tab. All price logic lives in
// src/content/pricingConfig.ts and runs in the browser; nothing is sent until the
// visitor asks for a quote. Copy comes localized from src/content/pricingCopy.ts.

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  computeQuote,
  formatCHF,
  INITIAL_STATE,
  MAX_LANGUAGES,
  PAGE_MAX,
  PAGE_MIN,
  PAGE_STEP_199,
  PRODUCT_MAX,
  PRODUCT_MIN,
  PRODUCT_STEP,
  WEBSHOP_TIER1,
  type ConfigState,
} from '@/content/pricingConfig';
import type { CfgOption, PricingCopy } from '@/content/pricingCopy';
import type { InfoBlock, PricingInfo } from '@/content/pricingInfo';

type CfgCopy = PricingCopy['cfg'];

export function Configurator({ copy, info }: { copy: CfgCopy; info: PricingInfo }) {
  const router = useRouter();
  const [s, setS] = useState<ConfigState>(INITIAL_STATE);
  const q = useMemo(() => computeQuote(s), [s]);
  const up = (patch: Partial<ConfigState>) => setS((prev) => ({ ...prev, ...patch }));
  const toggle = (id: keyof ConfigState) => setS((prev) => ({ ...prev, [id]: !prev[id] }));
  const reset = () => setS(INITIAL_STATE);
  const isDirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(INITIAL_STATE), [s]);
  const POPULAR_IDS = new Set<string>(['visibilityLoop', 'googleAds']);

  const submit = () => {
    const sum = copy.summary;
    const chosen = q.lines
      .map((l) => `${copy.lineLabel[l.key] ?? l.key}: ${formatCHF(l.amount)} CHF ${l.per === 'month' ? sum.monthWord : sum.onceWord}`)
      .join('\n');
    const summary = [
      sum.title,
      `${sum.situation}: ${s.situation === 'new' ? sum.new : sum.existing}`,
      s.situation === 'new' ? `${sum.pages}: ${s.pages}` : '',
      s.webshop ? sum.webshopYes.replace('{n}', String(s.products)) : '',
      '',
      chosen,
      '',
      `${sum.totalLabel}: ${formatCHF(q.monthly)} CHF ${sum.monthWord}, ${formatCHF(q.oneTime)} CHF ${sum.onceWord}`,
      q.needsManualQuote ? sum.manualNote : '',
    ]
      .filter(Boolean)
      .join('\n');
    const payload = {
      title: s.situation === 'new' ? 'Neue Website' : 'Bestehende Website',
      situation: s.situation,
      monthly: q.monthly,
      oneTime: q.oneTime,
      state: s,
      lines: q.lines,
    };
    try {
      sessionStorage.setItem('amai-configurator', summary);
      sessionStorage.setItem('amai-configurator-data', JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    router.push('/kontakt?from=configurator');
  };

  const stepHead = 'inline-flex rounded-pill bg-hero-wash px-3 py-1.5 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-navy';
  const card = 'rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-7';
  // High contrast slider: mint thumb with a navy ring, clearly visible on mobile.
  // Clean navy thumb with a white ring + soft shadow on a slim track.
  const slider =
    'h-5 w-full cursor-pointer appearance-none bg-transparent ' +
    '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--line-strong)] ' +
    '[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-navy [&::-webkit-slider-thumb]:shadow-[0_1px_5px_rgba(22,35,61,0.4)] ' +
    '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--line-strong)] ' +
    '[&::-moz-range-thumb]:h-[15px] [&::-moz-range-thumb]:w-[15px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-navy [&::-moz-range-thumb]:shadow-[0_1px_5px_rgba(22,35,61,0.4)]';

  const LangCount = ({ show }: { show: boolean }) =>
    show ? (
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
        <span className="font-mono text-[12px] text-ink-soft">{copy.languagesCount}</span>
        {Array.from({ length: MAX_LANGUAGES }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => up({ extraLanguageCount: n })}
            aria-pressed={s.extraLanguageCount === n}
            className={`h-8 w-8 rounded-full border text-sm font-medium transition-colors ${
              s.extraLanguageCount === n ? 'border-navy bg-navy text-white' : 'border-[var(--line)] text-ink-soft'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    ) : null;

  const InfoToggle = ({ block }: { block: InfoBlock }) => (
    <details className="group/info mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-mono text-[11px] text-navy [&::-webkit-details-marker]:hidden">
        {copy.moreInfo}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-open/info:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      {block.title ? <p className="mt-2 text-[13px] font-semibold text-ink">{block.title}</p> : null}
      <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{block.body}</p>
    </details>
  );

  const OptionRow = ({ opt }: { opt: CfgOption }) => {
    const block = info.options[opt.id] ?? (opt.info ? { title: '', body: opt.info } : null);
    return (
      <div className="rounded-xl border border-[var(--line)] bg-paper p-4 transition-colors hover:border-navy/30">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={Boolean(s[opt.id as keyof ConfigState])}
            onChange={() => toggle(opt.id as keyof ConfigState)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
          />
          <span className="flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{opt.label}</span>
              {POPULAR_IDS.has(opt.id) ? (
                <span className="rounded-pill bg-mint/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-navy">
                  {copy.popularTag}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block font-mono text-[12px] text-ink-soft">{opt.price}</span>
          </span>
        </label>
        {block ? <div className="pl-7"><InfoToggle block={block} /></div> : null}
      </div>
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Step 1 */}
        <div className={card}>
          <span className={stepHead}>{copy.step1}</span>
          <div className="mt-4 flex flex-wrap gap-3">
            {(['new', 'existing'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={s.situation === v}
                onClick={() => up({ situation: v })}
                className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
                  s.situation === v
                    ? 'border-navy bg-hero-wash text-ink'
                    : 'border-[var(--line)] bg-paper text-ink-soft hover:border-navy/30'
                }`}
              >
                {v === 'new' ? copy.situationNew : copy.situationExisting}
              </button>
            ))}
          </div>
          <InfoToggle block={info.situation[s.situation === 'new' ? 'new' : 'existing']} />
        </div>

        {/* Step 2, pages, new site only */}
        {s.situation === 'new' ? (
          <div className={card}>
            <span className={stepHead}>{copy.step2Pages}</span>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-display text-2xl text-ink">{s.pages}</span>
              <span className="font-mono text-xs text-ink-soft">{copy.pagesUnit}</span>
            </div>
            <input
              type="range"
              min={PAGE_MIN}
              max={PAGE_MAX}
              step={1}
              value={s.pages}
              onChange={(e) => up({ pages: Number(e.target.value) })}
              aria-label={copy.pagesUnit}
              className={`mt-3 ${slider}`}
            />
            <p className="mt-3 text-sm text-ink-soft">{copy.pagesHelp}</p>
            <InfoToggle block={info.pages.new} />
            {s.pages >= PAGE_STEP_199 ? (
              <div className="mt-3 rounded-xl border border-mint/50 bg-hero-wash p-4 text-sm text-ink">
                <p className="font-semibold">{info.pages.threshold.title}</p>
                <p className="mt-1 whitespace-pre-line text-ink-soft">{info.pages.threshold.body}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Extras (step 3 for a new site, step 2 for an existing one) */}
        <div className={card}>
          <span className={stepHead}>{s.situation === 'new' ? copy.stepExtrasNew : copy.stepExtrasExisting}</span>

          {s.situation === 'new' ? (
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-mint bg-hero-wash p-4">
                <input
                  type="checkbox"
                  checked={s.webshop}
                  onChange={() => toggle('webshop')}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
                />
                <span className="flex-1">
                  <span className="block font-display text-base text-ink">{copy.webshopTitle}</span>
                  <span className="font-mono text-[12px] font-bold text-navy">{copy.webshopPrice}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{copy.webshopDesc}</span>
                </span>
              </label>

              {s.webshop ? (
                <div className="space-y-3 rounded-xl border border-[var(--line)] bg-paper p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-xl text-ink">
                      {formatCHF(s.products)}
                      {s.products >= PRODUCT_MAX ? '+' : ''}
                    </span>
                    <span className="font-mono text-xs text-ink-soft">{copy.productsUnit}</span>
                  </div>
                  <input
                    type="range"
                    min={PRODUCT_MIN}
                    max={PRODUCT_MAX}
                    step={PRODUCT_STEP}
                    value={s.products}
                    onChange={(e) => up({ products: Number(e.target.value) })}
                    aria-label={copy.productsUnit}
                    className={slider}
                  />
                  <p className="text-[13px] text-ink-soft">{copy.productsHelp}</p>
                  {s.products > WEBSHOP_TIER1 ? <p className="text-[13px] text-navy">{copy.products101}</p> : null}
                  <OptionRow opt={copy.productImport} />
                  <OptionRow opt={copy.erpLink} />
                </div>
              ) : null}

              {copy.newExtras.map((opt) => (
                <div key={opt.id}>
                  <OptionRow opt={opt} />
                  {opt.id === 'extraLanguage' ? <LangCount show={s.extraLanguage} /> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {copy.existingExtras.map((opt) => (
                <div key={opt.id}>
                  <OptionRow opt={opt} />
                  {opt.id === 'extraLanguage' ? <LangCount show={s.extraLanguage} /> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly add ons */}
        <div className={card}>
          <span className={stepHead}>{copy.monthly}</span>
          <div className="mt-4 space-y-3">
            {copy.monthlyExtras.map((opt) => (
              <OptionRow key={opt.id} opt={opt} />
            ))}
          </div>
        </div>
      </div>

      {/* Price box */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-[var(--line)] bg-ink p-6 text-paper shadow-[0_18px_44px_-22px_rgba(7,34,31,0.6)]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.13em] text-mint">{copy.priceTitle}</span>
            {isDirty ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-paper/70 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                {copy.reset}
              </button>
            ) : null}
          </div>
          <div aria-live="polite" className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div className="font-display text-4xl leading-none text-white">
              {formatCHF(q.monthly)} <span className="text-lg text-paper/70">CHF {copy.perMonth}</span>
            </div>
            <div className="font-display text-4xl leading-none text-white">
              + {formatCHF(q.oneTime)} <span className="text-lg text-paper/70">CHF {copy.oneTime}</span>
            </div>
          </div>

          <div className="mt-5 space-y-1.5 border-t border-white/15 pt-4">
            {q.lines.map((l) => (
              <div key={l.key} className="flex justify-between gap-4 text-[13px]">
                <span className="text-paper/80">{copy.lineLabel[l.key] ?? l.key}</span>
                <span className="font-mono text-paper">
                  {formatCHF(l.amount)} CHF
                  <span className="text-paper/60"> {l.per === 'month' ? copy.perShort : copy.onceShort}</span>
                </span>
              </div>
            ))}
          </div>

          {q.needsManualQuote ? (
            <p className="mt-4 rounded-xl bg-white/10 p-3 text-[13px] text-paper/90">{copy.manualQuote}</p>
          ) : null}

          <button type="button" onClick={submit} className="btn btn-spark mt-5 w-full justify-center">
            {copy.cta} <span aria-hidden className="btn-arrow" />
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-paper/60">{copy.finePrint}</p>
        </div>
      </div>

      {/* Mobile sticky summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="container-site flex items-center justify-between gap-3">
          <div aria-live="polite">
            <div className="font-display text-xl leading-none text-ink">
              {formatCHF(q.monthly)} <span className="text-sm text-ink-soft">CHF {copy.perMonth}</span>
            </div>
            <div className="font-mono text-[11px] text-ink-soft">+ {formatCHF(q.oneTime)} CHF {copy.oneTime}</div>
          </div>
          <button type="button" onClick={submit} className="btn btn-primary shrink-0">
            {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
