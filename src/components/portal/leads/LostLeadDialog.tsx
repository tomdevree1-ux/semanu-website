'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loseLead } from '@/modules/leads/actions';
import { LOST_REASONS, LOST_REASON_LABELS, type LostReason } from '@/modules/leads/types';
import { PortalSelect } from '@/components/portal/ui/PortalSelect';
import { Spinner } from '@/components/portal/ui/Spinner';

/** "Mark as lost" modal — a reason is always required, with an optional note. */
export function LostLeadDialog({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState<LostReason>('no_response');
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function confirm() {
    setError(false);
    const full = note.trim() ? `${LOST_REASON_LABELS[reason]}: ${note.trim()}` : LOST_REASON_LABELS[reason];
    startTransition(async () => {
      try {
        await loseLead(leadId, full);
        onClose();
        router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Mark lead as lost">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-paper p-7 shadow-xl">
        <h2 className="font-display text-xl text-ink">Mark as lost</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">A reason is required so you can learn from lost deals.</p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Reason</span>
            <div className="mt-2">
              <PortalSelect
                value={reason}
                onChange={(v) => setReason(v as LostReason)}
                block
                aria-label="Lost reason"
                options={LOST_REASONS.map((r) => ({ value: r, label: LOST_REASON_LABELS[r] }))}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Note <span className="font-normal text-ink-soft">(optional)</span></span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-mint focus:ring-4 focus:ring-mint/25"
            />
          </label>
          {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">Could not save.</p> : null}
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={pending} className="pa-btn pa-btn-ghost pa-btn-sm">Cancel</button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-70"
          >
            {pending ? <Spinner size="sm" /> : 'Mark as lost'}
          </button>
        </div>
      </div>
    </div>
  );
}
