'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/modules/leads/actions';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@/modules/leads/types';

/**
 * Status dropdown for a lead. Submits the (server) action on change — no separate
 * save step — then refreshes the list. Optimistic select value with a rollback on error.
 */
export function LeadStatusControl({ id, status }: { id: string; status: LeadStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<LeadStatus>(status);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onChange(next: LeadStatus) {
    const previous = value;
    setValue(next);
    setError(false);
    startTransition(async () => {
      try {
        await updateLeadStatus(id, next);
        router.refresh();
      } catch {
        setValue(previous);
        setError(true);
      }
    });
  }

  return (
    <div className="shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        disabled={pending}
        aria-label="Lead status"
        className="lead-status"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-danger" role="alert">Could not save.</p> : null}
    </div>
  );
}
