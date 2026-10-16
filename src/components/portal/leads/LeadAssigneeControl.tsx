'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadAssignee } from '@/modules/leads/actions';
import type { AssignableUser } from '@/modules/leads/types';
import { PortalSelect } from '@/components/portal/ui/PortalSelect';

/** Assign a lead to a user (admin/sales). Persists on change, then refreshes. */
export function LeadAssigneeControl({ leadId, value, users }: { leadId: string; value: string | null; users: AssignableUser[] }) {
  const router = useRouter();
  const [val, setVal] = useState(value ?? '');
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = val;
    setVal(next);
    setError(false);
    startTransition(async () => {
      try {
        await updateLeadAssignee(leadId, next || null);
        router.refresh();
      } catch {
        setVal(prev);
        setError(true);
      }
    });
  }

  return (
    <div>
      <PortalSelect
        value={val}
        onChange={onChange}
        disabled={pending}
        block
        aria-label="Assign lead"
        options={[{ value: '', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
      />
      {error ? <p className="mt-1 text-xs text-danger" role="alert">Could not save.</p> : null}
    </div>
  );
}
