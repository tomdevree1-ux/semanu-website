'use client';

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Spinner } from './Spinner';

type ActionState = { ok?: boolean; error?: string };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Reusable editable card (Part V §V3). Read-only by default with a pencil; click
 * to unlock → Save changes + Cancel appear; on success it returns to read-only
 * with a transient success cue; on error it stays unlocked and keeps the input.
 * Cancel discards (with a dirty-guard confirm). Wraps an existing, permission-
 * gated server action — P3.5 adds no new action.
 */
export function EditableBlock({
  title,
  action,
  readView,
  editView,
  hiddenFields,
}: {
  title: string;
  action: Action;
  readView: ReactNode;
  /** Render the inputs; receives `pending` to disable them while saving. */
  editView: (pending: boolean) => ReactNode;
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const formKey = useRef(0);
  const prevState = useRef(state);
  const headingId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // Close + show the success cue only on a NEW successful result (not a stale ok).
  useEffect(() => {
    if (state === prevState.current) return;
    prevState.current = state;
    if (state.ok) {
      setEditing(false);
      setDirty(false);
      setSaved(true);
    }
  }, [state]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  // Move focus into the block when it unlocks (accessibility).
  useEffect(() => {
    if (!editing) return;
    formRef.current?.querySelector<HTMLElement>('input, select, textarea, [tabindex]')?.focus();
  }, [editing]);

  // Guard against losing unsaved edits on tab close / refresh.
  useEffect(() => {
    if (!editing || !dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [editing, dirty]);

  function cancel() {
    if (dirty && !window.confirm('Discard your changes?')) return;
    formKey.current += 1; // remount the edit fields → reset to defaults
    setDirty(false);
    setEditing(false);
  }

  return (
    <section className="card" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="font-display text-lg text-ink">
          {title}
        </h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setEditing(true);
            }}
            aria-label={`Edit ${title}`}
            className="rounded-pill border border-ink/15 p-1.5 text-ink transition-colors hover:bg-ink/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        ) : null}
      </div>

      {saved ? (
        <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">
          Saved.
        </p>
      ) : null}
      {editing && state.error ? (
        <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      {!editing ? (
        <div className="mt-3 text-sm text-ink">{readView}</div>
      ) : (
        <form ref={formRef} key={formKey.current} action={formAction} onInput={() => setDirty(true)} className="mt-3 space-y-4">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
            : null}
          {editView(pending)}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={pending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {pending ? <Spinner size="sm" /> : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded-pill border border-ink/15 px-4 py-2 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
