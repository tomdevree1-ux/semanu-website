'use client';

import { useEffect } from 'react';
import { HistoryTimeline, type TechnicalDetail } from './HistoryTimeline';
import type { AuditHistoryRow } from '@/lib/types/database';

/** Right-side slide-over hosting the history timeline. Esc / overlay closes. */
export function HistoryDrawer({
  title,
  rows,
  technical,
  onClose,
}: {
  title: string;
  rows: AuditHistoryRow[];
  technical?: Record<number, TechnicalDetail>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-xl">
        <header className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-pill p-1.5 text-ink hover:bg-ink/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <HistoryTimeline rows={rows} technical={technical} />
        </div>
      </aside>
    </div>
  );
}
