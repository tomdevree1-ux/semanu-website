'use client';

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from '@/i18n/navigation';
import type { FaqService, FaqUi } from '@/content/faqServices';

/**
 * Searchable FAQ. A prominent command-field-style search box filters live across
 * every question and answer; the questions stay grouped by topic as
 * accordions (several may be open at once). Typing "/" or Cmd/Ctrl+K focuses the
 * field. While a query is active, matching questions auto-open and the matched
 * substring is highlighted in mint. Light + on-brand (Marine + Mint), Tailwind
 * utilities only. Accessibility: labelled input, real <button> accordions with
 * aria-expanded + aria-controls, answers exposed as regions, reduced-motion safe.
 */

/** Lowercase + strip diacritics so "système" matches "systeme". */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Split `text` into segments, marking the case/diacritic-insensitive matches of
 * `query`. Indices are computed on the normalised string but always slice the
 * ORIGINAL text, so accents and casing are preserved in the output.
 */
function highlight(text: string, query: string, markKey: string) {
  const q = query.trim();
  if (!q) return text;
  const nText = norm(text);
  const nQuery = norm(q);
  if (!nQuery) return text;

  const parts: Array<{ s: string; hit: boolean }> = [];
  let from = 0;
  let idx = nText.indexOf(nQuery, from);
  while (idx !== -1) {
    if (idx > from) parts.push({ s: text.slice(from, idx), hit: false });
    parts.push({ s: text.slice(idx, idx + nQuery.length), hit: true });
    from = idx + nQuery.length;
    idx = nText.indexOf(nQuery, from);
  }
  if (from < text.length) parts.push({ s: text.slice(from), hit: false });

  return parts.map((p, i) =>
    p.hit ? (
      <mark
        key={`${markKey}-${i}`}
        className="rounded-lg bg-mint/30 px-0.5 text-ink"
      >
        {p.s}
      </mark>
    ) : (
      <Fragment key={`${markKey}-${i}`}>{p.s}</Fragment>
    ),
  );
}

/**
 * Emphasise the first sentence of an answer so it scans at a glance. Used when no
 * search query is active; while searching, the highlight view takes over instead.
 */
function leadBold(text: string, markKey: string) {
  const m = text.match(/^(.*?[.!?])(\s+)([\s\S]*)$/);
  if (!m) {
    return <strong className="font-semibold text-ink">{text}</strong>;
  }
  return (
    <Fragment key={markKey}>
      <strong className="font-semibold text-ink">{m[1]}</strong>
      {m[2]}
      {m[3]}
    </Fragment>
  );
}

export function FaqSearch({
  ui,
  services,
  contactHref,
}: {
  ui: FaqUi;
  services: FaqService[];
  contactHref: string;
}) {
  const copy = {
    placeholder: ui.searchPlaceholder,
    empty: ui.searchEmpty,
    clear: ui.searchClear,
  };
  const [query, setQuery] = useState('');
  // Questions the user has manually toggled, keyed `${serviceId}:${faqIndex}`.
  // While a query is active the matching rows are forced open regardless.
  const [openManual, setOpenManual] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const trimmed = query.trim();
  const active = trimmed.length > 0;

  // Filter services + their questions against the (normalised) query.
  const groups = useMemo(() => {
    if (!active) {
      return services.map((s) => ({ svc: s, faqs: s.faqs.map((f, i) => ({ f, i })) }));
    }
    const nQuery = norm(trimmed);
    return services
      .map((s) => ({
        svc: s,
        faqs: s.faqs
          .map((f, i) => ({ f, i }))
          .filter(
            ({ f }) => norm(f.q).includes(nQuery) || norm(f.a).includes(nQuery),
          ),
      }))
      .filter((g) => g.faqs.length > 0);
  }, [services, active, trimmed]);

  const totalHits = useMemo(
    () => groups.reduce((n, g) => n + g.faqs.length, 0),
    [groups],
  );

  // Focus the field on "/" or Cmd/Ctrl+K (ignore when already typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const slash =
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement);
      if (cmdK || slash) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isOpen = (sid: string, i: number) =>
    active || openManual[`${sid}:${i}`] === true;

  const toggle = (sid: string, i: number) => {
    // Toggling while a query is active is a no-op visually (rows are forced
    // open), so guard against it to avoid confusing state.
    if (active) return;
    const key = `${sid}:${i}`;
    setOpenManual((m) => ({ ...m, [key]: !m[key] }));
  };

  return (
    <div className="w-full">
      {/* ── Search field (command-style pill) ───────────────── */}
      <div className="relative">
        <label htmlFor={`${baseId}-q`} className="sr-only">
          {copy.placeholder}
        </label>
        <div className="flex items-center gap-3 rounded-pill border border-[var(--line)] bg-white px-5 py-3.5 shadow-[var(--shadow-pop)] transition-colors focus-within:border-navy">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0 text-ink-soft"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input
            id={`${baseId}-q`}
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.placeholder}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/70 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {active ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={copy.clear}
              className="shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-paper hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-4 w-4"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-[var(--line)] bg-paper px-2 py-0.5 font-mono text-[11px] font-bold text-ink-soft sm:inline-block">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Results: grouped accordions ─────────────────────── */}
      <div className="mt-10">
        {totalHits === 0 ? (
          <p className="rounded-card border border-[var(--line)] bg-white px-6 py-10 text-center text-ink-soft">
            {copy.empty} <span className="font-medium text-ink">“{trimmed}”</span>
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map(({ svc, faqs }) => (
              <section key={svc.id} aria-labelledby={`${baseId}-${svc.id}-h`}>
                <h2
                  id={`${baseId}-${svc.id}-h`}
                  className="flex items-center gap-2.5 font-display text-xl text-ink"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: svc.accent }}
                  />
                  {svc.name}
                </h2>

                <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {faqs.map(({ f, i }) => {
                    const open = isOpen(svc.id, i);
                    const qId = `${baseId}-${svc.id}-${i}-q`;
                    const aId = `${baseId}-${svc.id}-${i}-a`;
                    return (
                      <div key={i}>
                        <h3>
                          <button
                            type="button"
                            id={qId}
                            aria-expanded={open}
                            aria-controls={aId}
                            onClick={() => toggle(svc.id, i)}
                            className="flex w-full items-center justify-between gap-4 py-4 text-left font-display text-lg text-ink"
                          >
                            <span>
                              {highlight(f.q, trimmed, `${svc.id}-${i}-q`)}
                            </span>
                            <span
                              aria-hidden
                              className={`shrink-0 font-mono text-xl text-navy transition-transform motion-reduce:transition-none ${
                                open ? 'rotate-45' : ''
                              }`}
                            >
                              +
                            </span>
                          </button>
                        </h3>
                        <div
                          id={aId}
                          role="region"
                          aria-labelledby={qId}
                          hidden={!open}
                          className="pb-4 text-sm leading-relaxed text-ink-soft"
                        >
                          {active
                            ? highlight(f.a, trimmed, `${svc.id}-${i}-a`)
                            : leadBold(f.a, `${svc.id}-${i}-a`)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── Closing CTA ─────────────────────────────────────── */}
      <div className="mt-14 flex flex-col items-start gap-4 border-t border-[var(--line)] pt-10 sm:flex-row sm:items-center">
        <Link href={contactHref} className="btn btn-spark">
          {ui.ctaStart} <span aria-hidden className="btn-arrow" />
        </Link>
        <Link
          href={contactHref}
          className="font-medium text-navy underline decoration-mint decoration-2 underline-offset-4 hover:text-ink"
        >
          {ui.askMore}
        </Link>
      </div>
    </div>
  );
}
