'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/modules/leads/actions';
import {
  LEAD_CHANNEL_LABELS,
  LEAD_STATUS_DOT,
  LEAD_STATUS_LABELS,
  type AssignableUser,
  type LeadListRow,
  type LeadStatus,
} from '@/modules/leads/types';
import { WinLeadDialog } from './WinLeadDialog';
import { LostLeadDialog } from './LostLeadDialog';
import { LeadDeleteButton } from './LeadDeleteButton';
import { LeadAssigneePicker } from './LeadAssigneePicker';

type Column = { status: LeadStatus; rows: LeadListRow[]; total: number };

const df = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Kanban board with drag-and-drop between stages. Managers can drag a card to a
 * new column: the move is optimistic (with a snap highlight on the target), then
 * the status is persisted and the server data reconciled.
 */
export function LeadBoard({ columns, canManage, users }: { columns: Column[]; canManage: boolean; users: AssignableUser[] }) {
  const router = useRouter();
  const [cols, setCols] = useState<Column[]>(columns);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);
  const [win, setWin] = useState<{ id: string; name: string } | null>(null);
  const [lost, setLost] = useState<{ id: string } | null>(null);
  const [, startTransition] = useTransition();
  const fromRef = useRef<LeadStatus | null>(null);
  const draggedRef = useRef(false);

  // Reconcile with fresh server data after any refresh / filter change.
  useEffect(() => setCols(columns), [columns]);

  function onDrop(target: LeadStatus) {
    const id = dragId;
    const from = fromRef.current;
    setOverStatus(null);
    setDragId(null);
    fromRef.current = null;
    if (!id || !from || from === target) return;

    // Winning a deal is not a plain status write: name a project first.
    if (target === 'won') {
      const card = cols.find((c) => c.status === from)?.rows.find((r) => r.id === id);
      const nm = card?.company || `${card?.firstname ?? ''} ${card?.lastname ?? ''}`.trim();
      setWin({ id, name: nm });
      return;
    }
    // Losing requires a reason.
    if (target === 'lost') {
      setLost({ id });
      return;
    }

    // Optimistic move between columns.
    setCols((prev) => {
      const card = prev.find((c) => c.status === from)?.rows.find((r) => r.id === id);
      if (!card) return prev;
      return prev.map((c) => {
        if (c.status === from) return { ...c, rows: c.rows.filter((r) => r.id !== id), total: Math.max(0, c.total - 1) };
        if (c.status === target) return { ...c, rows: [{ ...card, status: target }, ...c.rows], total: c.total + 1 };
        return c;
      });
    });

    startTransition(async () => {
      try {
        await updateLeadStatus(id, target);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <>
    <div className="board lead-board">
      {cols.map(({ status, rows, total }) => (
        <section
          key={status}
          className={`col${overStatus === status && dragId ? ' drop-over' : ''}`}
          aria-label={`${LEAD_STATUS_LABELS[status]} leads`}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            if (overStatus !== status) setOverStatus(status);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setOverStatus((s) => (s === status ? null : s));
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(status);
          }}
        >
          <div className="col-h">
            <span className="dot" style={{ background: LEAD_STATUS_DOT[status] }} />
            <h4>{LEAD_STATUS_LABELS[status]}</h4>
            <span className="ct">{total}</span>
          </div>

          {rows.length === 0 ? (
            <p className="lead-empty">No leads</p>
          ) : (
            rows.map((l) => (
              <div
                key={l.id}
                className={`kcard lead-card${dragId === l.id ? ' dragging' : ''}`}
                draggable={canManage}
                onDragStart={(e) => {
                  draggedRef.current = true;
                  fromRef.current = status;
                  setDragId(l.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', l.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStatus(null);
                  fromRef.current = null;
                  // allow the click suppression to reset after the drag settles
                  setTimeout(() => (draggedRef.current = false), 0);
                }}
                onClick={() => {
                  if (draggedRef.current) return;
                  router.push(`/app/leads/${l.id}`);
                }}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') router.push(`/app/leads/${l.id}`);
                }}
              >
                <div className="kc-top">
                  <span className="kc-cat">{LEAD_CHANNEL_LABELS[l.channel]} · {l.lang.toUpperCase()}</span>
                  <span
                    className="kc-top-actions"
                    role="presentation"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {l.submissionCount > 1 ? <span className="lead-count" title={`${l.submissionCount} submissions`}>{l.submissionCount}×</span> : null}
                    {canManage ? <LeadDeleteButton id={l.id} name={`${l.firstname} ${l.lastname}`.trim() || l.email} /> : null}
                  </span>
                </div>
                <h4 className="lead-name">
                  {l.firstname} {l.lastname}
                </h4>
                {l.company ? <span className="lead-company">{l.company}</span> : null}
                <div className="lead-contact">
                  <span className="lead-line">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                    <span className="lead-line-tx">{l.email}</span>
                  </span>
                  {l.phone ? (
                    <span className="lead-line">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                      </svg>
                      <span className="lead-line-tx">{l.phone}</span>
                    </span>
                  ) : null}
                </div>
                <div className="kc-foot">
                  <span className="lead-time">{df.format(new Date(l.createdAt))}</span>
                  {canManage ? (
                    <LeadAssigneePicker leadId={l.id} assignedToId={l.assignedToId} assignedToName={l.assignedToName} users={users} />
                  ) : l.assignedToName ? (
                    <span className="lead-assignee" title={`Assigned to ${l.assignedToName}`}>
                      {l.assignedToName.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}

          {rows.length < total ? (
            <p className="lead-more">Showing {rows.length} of {total}</p>
          ) : null}
        </section>
      ))}
    </div>
    {win ? <WinLeadDialog leadId={win.id} defaultName={win.name} onClose={() => setWin(null)} /> : null}
    {lost ? <LostLeadDialog leadId={lost.id} onClose={() => setLost(null)} /> : null}
    </>
  );
}
