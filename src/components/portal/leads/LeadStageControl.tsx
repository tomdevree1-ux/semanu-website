'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/modules/leads/actions';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@/modules/leads/types';
import { PortalSelect } from '@/components/portal/ui/PortalSelect';
import { WinLeadDialog } from './WinLeadDialog';
import { LostLeadDialog } from './LostLeadDialog';

/**
 * Stage dropdown for the lead detail. Moving to Won opens the win modal (create
 * project + company + contact) instead of a plain status write; other stages
 * persist immediately.
 */
export function LeadStageControl({
  id,
  status,
  defaultProjectName,
}: {
  id: string;
  status: LeadStatus;
  defaultProjectName: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<LeadStatus>(status);
  const [winOpen, setWinOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onChange(next: LeadStatus) {
    if (next === 'won') {
      setWinOpen(true);
      return;
    }
    if (next === 'lost') {
      setLostOpen(true);
      return;
    }
    const prev = value;
    setValue(next);
    setError(false);
    startTransition(async () => {
      try {
        await updateLeadStatus(id, next);
        router.refresh();
      } catch {
        setValue(prev);
        setError(true);
      }
    });
  }

  return (
    <div>
      <PortalSelect
        value={value}
        onChange={(v) => onChange(v as LeadStatus)}
        disabled={pending}
        aria-label="Lead stage"
        pill
        options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
      />
      {error ? <p className="mt-1 text-xs text-danger" role="alert">Could not save.</p> : null}
      {winOpen ? <WinLeadDialog leadId={id} defaultName={defaultProjectName} onClose={() => setWinOpen(false)} /> : null}
      {lostOpen ? <LostLeadDialog leadId={id} onClose={() => setLostOpen(false)} /> : null}
    </div>
  );
}
