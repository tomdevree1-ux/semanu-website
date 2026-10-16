'use client';

import { useState } from 'react';
import { HistoryDrawer } from './HistoryDrawer';
import type { TechnicalDetail } from './HistoryTimeline';
import type { AuditHistoryRow } from '@/lib/types/database';

/**
 * Clock button that opens a history drawer. Entity-agnostic: the server passes
 * the display-safe rows (and, only for audit.read_technical holders, the
 * technical map) so the client never fetches privileged data itself.
 */
export function HistoryButton({
  rows,
  technical,
  title = 'History',
}: {
  rows: AuditHistoryRow[];
  technical?: Record<number, TechnicalDetail>;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View history"
        title="View history"
        className="rounded-pill border border-ink/15 p-2 text-ink transition-colors hover:bg-ink/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
      {open ? <HistoryDrawer title={title} rows={rows} technical={technical} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
