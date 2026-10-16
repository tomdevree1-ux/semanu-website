'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Spinner } from './Spinner';

type ActionState = { ok?: boolean; error?: string };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Type-to-confirm modal around an existing server action. The confirm button is
 * disabled until the user types `confirmWord` (the target email). Submits
 * `confirmationEmail` plus any `hiddenFields` to the action.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmWord,
  confirmLabel,
  action,
  hiddenFields,
  danger,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel: string;
  action: Action;
  hiddenFields?: Record<string, string>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [state, formAction, pending] = useActionState(action, {});
  const prevState = useRef(state);
  const matches = typed.trim().toLowerCase() === confirmWord.trim().toLowerCase();

  // Close on a NEW successful result.
  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;
    if (state.ok) setOpen(false);
  }, [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) setOpen(false);
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTyped('');
          setOpen(true);
        }}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <div className="absolute inset-0 bg-ink/30" onClick={() => !pending && setOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md rounded-xl bg-paper p-5 shadow-xl">
            <h2 className="font-display text-lg text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{description}</p>
            {state.error ? (
              <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {state.error}
              </p>
            ) : null}
            <form action={formAction} className="mt-3 space-y-3">
              {hiddenFields
                ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
                : null}
              <label className="block">
                <span className="text-sm text-ink">
                  Type <span className="font-mono text-ink-soft">{confirmWord}</span> to confirm
                </span>
                <input
                  name="confirmationEmail"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  disabled={pending}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-pill border border-ink/15 px-4 py-2 text-sm text-ink hover:bg-ink/5 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!matches || pending}
                  className={`rounded-pill px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    danger ? 'bg-red text-white hover:bg-red-deep' : 'pa-btn pa-btn-primary'
                  }`}
                >
                  {pending ? <Spinner size="sm" /> : confirmLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
