'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadAssignee } from '@/modules/leads/actions';
import type { AssignableUser } from '@/modules/leads/types';

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Compact assignee badge on a kanban card. Shows the owner's initials (or an empty
 * placeholder when unassigned) and opens an inline dropdown to (re)assign — without
 * leaving the board. Stops propagation so the card doesn't navigate.
 */
export function LeadAssigneePicker({
  leadId,
  assignedToId,
  assignedToName,
  users,
}: {
  leadId: string;
  assignedToId: string | null;
  assignedToName: string | null;
  users: AssignableUser[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function pick(id: string | null) {
    setOpen(false);
    startTransition(async () => {
      try {
        await updateLeadAssignee(leadId, id);
        router.refresh();
      } catch {
        /* keep silent on the card */
      }
    });
  }

  const assignee = assignedToId ? users.find((u) => u.id === assignedToId) ?? null : null;
  const name = assignee?.name ?? assignedToName;
  const avatar = assignee?.avatarUrl ?? null;

  return (
    <div ref={ref} className="lead-assign-picker" role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={name ? `Assigned to ${name}` : 'Unassigned — click to assign'}
        className={`lead-assignee${name ? '' : ' is-empty'}`}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name ?? ''} className="lead-assignee-img" />
        ) : name ? (
          initials(name)
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        )}
      </button>

      {open ? (
        <ul className="lead-assign-menu" role="listbox">
          <li role="option" aria-selected={!assignedToId} className={`lead-assign-opt${!assignedToId ? ' is-active' : ''}`} onClick={() => pick(null)}>
            Unassigned
          </li>
          {users.map((u) => (
            <li key={u.id} role="option" aria-selected={u.id === assignedToId} className={`lead-assign-opt${u.id === assignedToId ? ' is-active' : ''}`} onClick={() => pick(u.id)}>
              <span className="lead-assign-ini">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="lead-assignee-img" />
                ) : (
                  initials(u.name)
                )}
              </span>
              {u.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
