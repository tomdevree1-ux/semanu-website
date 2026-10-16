'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLead } from '@/modules/leads/actions';
import { Spinner } from '@/components/portal/ui/Spinner';

/**
 * Trash icon on a lead card that opens a simple "are you sure?" confirm modal
 * and permanently deletes the lead on confirm.
 */
export function LeadDeleteButton({
  id,
  name,
  redirectTo,
  variant = 'icon',
}: {
  id: string;
  name: string;
  redirectTo?: string;
  variant?: 'icon' | 'button';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) setOpen(false);
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending]);

  function confirmDelete() {
    setError(false);
    startTransition(async () => {
      try {
        await deleteLead(id);
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  const trash = (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );

  return (
    <>
      {variant === 'button' ? (
        <button type="button" onClick={() => setOpen(true)} className="pa-btn pa-btn-ghost pa-btn-sm" aria-label={`Delete lead ${name}`}>
          {trash}
          Delete
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="lead-del" aria-label={`Delete lead ${name}`} title="Delete lead">
          {trash}
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Delete lead">
          <div className="absolute inset-0 bg-ink/30" onClick={() => !pending && setOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl bg-paper p-7 shadow-xl">
            <h2 className="font-display text-lg text-ink">Delete lead?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              This permanently deletes <span className="font-medium text-ink">{name}</span>. This cannot be undone.
            </p>
            {error ? (
              <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                Could not delete the lead.
              </p>
            ) : null}
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-pill border border-ink/15 px-4 py-2 text-sm text-ink hover:bg-ink/5 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-70"
              >
                {pending ? <Spinner size="sm" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
