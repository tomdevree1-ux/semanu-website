'use client';

import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { winLead } from '@/modules/leads/actions';
import { Spinner } from '@/components/portal/ui/Spinner';

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="pa-btn pa-btn-primary disabled:opacity-70">
      {pending ? <Spinner size="sm" /> : 'Create project'}
    </button>
  );
}

/**
 * "Mark as won" modal. Names the project, then the server action creates the
 * company + primary contact + project and opens the project. Reused by the lead
 * detail stage control and the board drag-to-Won.
 */
export function WinLeadDialog({ leadId, defaultName, onClose }: { leadId: string; defaultName: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Mark lead as won">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl">
        <h2 className="font-display text-xl text-ink">Mark as won</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This creates a company, a primary contact and a new project from this lead. Name the project:
        </p>
        <form action={winLead} className="mt-4 space-y-4">
          <input type="hidden" name="leadId" value={leadId} />
          <label className="block">
            <span className="text-sm font-semibold text-ink">Project name</span>
            <input
              name="projectName"
              defaultValue={defaultName}
              autoFocus
              required
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-mint focus:ring-4 focus:ring-mint/25"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="pa-btn pa-btn-ghost pa-btn-sm">Cancel</button>
            <Confirm />
          </div>
        </form>
      </div>
    </div>
  );
}
