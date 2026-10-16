'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A primary CTA button that opens the (children) form in a house-style modal.
 * Closes on the X, a backdrop click or Escape; locks body scroll while open and
 * returns focus to the trigger on close. Used on /website-analyse so the example
 * report can take the main column and the form lives in a popup.
 */
export function AnalysisFormModal({
  triggerLabel,
  title,
  closeLabel,
  buzz = false,
  children,
}: {
  triggerLabel: string;
  title: string;
  closeLabel: string;
  buzz?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <span className={buzz ? 'inline-flex btn-buzz' : 'inline-flex'}>
        <button ref={triggerRef} type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          {triggerLabel} <span aria-hidden className="btn-arrow" />
        </button>
      </span>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-card border border-[var(--line)] bg-white p-6 shadow-2xl outline-none sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-navy">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink"
              >
                <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
