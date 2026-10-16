'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';

/** One topbar notification. `tone` colours the leading dot; `href` makes the row a link. */
export type PortalNotification = {
  id: string;
  title: string;
  body?: string;
  time?: string;
  tone?: 'info' | 'ok' | 'warn' | 'alert';
  href?: string;
};

/**
 * Topbar bell + notifications panel. The alert dot shows ONLY when there are
 * unread items (no more permanent red dot). Clicking opens a house-style panel
 * that lists each notification as a clear message, or an empty state. Closes on
 * outside click or Escape; "Mark all read" clears the dot.
 */
export function NotificationsMenu({ items = [] }: { items?: PortalNotification[] }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.reduce((n, it) => (readIds.has(it.id) ? n : n + 1), 0);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon n="bell" />
        {unreadCount > 0 ? <span className="dot" aria-hidden /> : null}
      </button>

      {open ? (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="notif-mark"
                onClick={() => setReadIds(new Set(items.map((i) => i.id)))}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty">
                <Icon n="check" />
                <span>You are all caught up</span>
              </div>
            ) : (
              items.map((n) => {
                const unread = !readIds.has(n.id);
                const inner = (
                  <>
                    <span className={`notif-dot t-${n.tone ?? 'info'}`} aria-hidden />
                    <span className="notif-tx">
                      <span className="notif-h">{n.title}</span>
                      {n.body ? <span className="notif-b">{n.body}</span> : null}
                      {n.time ? <span className="notif-t">{n.time}</span> : null}
                    </span>
                    {unread ? <span className="notif-unread" aria-label="Unread" /> : null}
                  </>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} className="notif-item" onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className="notif-item">
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
