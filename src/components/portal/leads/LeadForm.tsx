'use client';

import { useActionState } from 'react';
import { createLead } from '@/modules/leads/actions';
import {
  LEAD_CHANNELS,
  LEAD_CHANNEL_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type AssignableUser,
  type LeadFormState,
} from '@/modules/leads/types';
import { PortalSelect } from '@/components/portal/ui/PortalSelect';
import { Spinner } from '@/components/portal/ui/Spinner';

const initial: LeadFormState = {};
const field = 'w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-ink outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/30 disabled:opacity-60';
const label = 'mb-1.5 block text-sm font-semibold text-ink';

export function LeadForm({ users }: { users: AssignableUser[] }) {
  const [state, action, pending] = useActionState(createLead, initial);

  return (
    <form action={action} className="card space-y-5">
      {state.error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{state.error}</p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={label}>First name</span>
          <input name="firstname" autoComplete="given-name" maxLength={120} disabled={pending} className={field} />
        </label>
        <label className="block">
          <span className={label}>Last name</span>
          <input name="lastname" autoComplete="family-name" maxLength={120} disabled={pending} className={field} />
        </label>
      </div>

      <label className="block">
        <span className={label}>Email <span className="text-danger">*</span></span>
        <input name="email" type="email" required autoComplete="email" disabled={pending} className={field} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Phone</span>
          <input name="phone" type="tel" maxLength={40} disabled={pending} className={field} />
        </label>
        <label className="block">
          <span className={label}>Company</span>
          <input name="company" maxLength={200} disabled={pending} className={field} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className={label}>Channel</span>
          <PortalSelect name="channel" defaultValue="contact_form" block aria-label="Channel" options={LEAD_CHANNELS.map((c) => ({ value: c, label: LEAD_CHANNEL_LABELS[c] }))} />
        </div>
        <div>
          <span className={label}>Stage</span>
          <PortalSelect name="status" defaultValue="new" block aria-label="Stage" options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))} />
        </div>
      </div>

      <div>
        <span className={label}>Assign to</span>
        <PortalSelect name="assigned_to" defaultValue="" block aria-label="Assign to" options={[{ value: '', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))]} />
      </div>

      <label className="block">
        <span className={label}>Message <span className="font-normal text-ink-soft">(optional)</span></span>
        <textarea name="message" rows={3} maxLength={5000} disabled={pending} className={`${field} resize-y`} />
      </label>

      <div>
        <button type="submit" disabled={pending} className="pa-btn pa-btn-primary disabled:opacity-70">
          {pending ? <Spinner size="sm" /> : 'Create lead'}
        </button>
      </div>
    </form>
  );
}
