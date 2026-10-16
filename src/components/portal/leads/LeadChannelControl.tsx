'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadChannel } from '@/modules/leads/actions';
import { LEAD_CHANNELS, LEAD_CHANNEL_LABELS, type LeadChannel } from '@/modules/leads/types';
import { PortalSelect } from '@/components/portal/ui/PortalSelect';

/**
 * Channel dropdown for a lead. Submits the (server) action on change, then
 * refreshes. Optimistic select value with rollback on error.
 */
export function LeadChannelControl({ id, channel }: { id: string; channel: LeadChannel }) {
  const router = useRouter();
  const [value, setValue] = useState<LeadChannel>(channel);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onChange(next: LeadChannel) {
    const previous = value;
    setValue(next);
    setError(false);
    startTransition(async () => {
      try {
        await updateLeadChannel(id, next);
        router.refresh();
      } catch {
        setValue(previous);
        setError(true);
      }
    });
  }

  return (
    <div>
      <PortalSelect
        value={value}
        onChange={(v) => onChange(v as LeadChannel)}
        disabled={pending}
        aria-label="Lead channel"
        pill
        block
        options={LEAD_CHANNELS.map((c) => ({ value: c, label: LEAD_CHANNEL_LABELS[c] }))}
      />
      {error ? <p className="mt-1 text-xs text-danger" role="alert">Could not save.</p> : null}
    </div>
  );
}
