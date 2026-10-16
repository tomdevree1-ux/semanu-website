'use client';

import { useEffect, useState } from 'react';

type Labels = {
  page: string;
  of: string;
  prev: string;
  next: string;
  download: string;
  alt: string;
};

/**
 * On-brand flip-through viewer for an example report. Shows one page image at a
 * time with prev/next (buttons + overlay arrows + keyboard arrows), a page
 * counter, jump dots and a PDF download. Pages are preloaded so flipping is
 * instant. Marketing house style (Marine + Mint).
 */
export function ReportViewer({
  pages,
  downloadHref,
  labels,
}: {
  pages: string[];
  downloadHref: string;
  labels: Labels;
}) {
  const [i, setI] = useState(0);
  const total = pages.length;

  // Preload every page once (each ~100 KB) so navigation is instant.
  useEffect(() => {
    pages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [pages]);

  // Left/right arrow keys page through the report.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setI((c) => Math.max(0, c - 1));
      else if (e.key === 'ArrowRight') setI((c) => Math.min(total - 1, c + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const prev = () => setI((c) => Math.max(0, c - 1));
  const next = () => setI((c) => Math.min(total - 1, c + 1));

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-card border border-[var(--line)] bg-white shadow-[var(--shadow-pop)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pages[i]}
          alt={`${labels.alt} ${i + 1}`}
          width={1191}
          height={1684}
          className="block h-auto w-full"
        />
        <button
          type="button"
          onClick={prev}
          disabled={i === 0}
          aria-label={labels.prev}
          className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-white/90 text-xl text-ink shadow-[var(--shadow-pop)] transition hover:bg-mint disabled:pointer-events-none disabled:opacity-0"
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          onClick={next}
          disabled={i === total - 1}
          aria-label={labels.next}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-white/90 text-xl text-ink shadow-[var(--shadow-pop)] transition hover:bg-mint disabled:pointer-events-none disabled:opacity-0"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={prev} disabled={i === 0} className="btn btn-ghost-ink disabled:opacity-40">
          <span aria-hidden>←</span> {labels.prev}
        </button>
        <span className="shrink-0 font-mono text-xs text-ink-soft" aria-live="polite">
          {labels.page} {i + 1} {labels.of} {total}
        </span>
        <button type="button" onClick={next} disabled={i === total - 1} className="btn btn-ghost-ink disabled:opacity-40">
          {labels.next} <span aria-hidden className="btn-arrow" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {pages.map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setI(n)}
            aria-label={`${labels.page} ${n + 1}`}
            aria-current={n === i ? 'true' : undefined}
            className={`h-2.5 w-2.5 rounded-full transition ${n === i ? 'bg-navy' : 'bg-ink/20 hover:bg-ink/40'}`}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <a
          href={downloadHref}
          download
          className="font-medium text-navy underline decoration-mint decoration-2 underline-offset-4 hover:text-ink"
        >
          {labels.download}
        </a>
      </div>
    </div>
  );
}
