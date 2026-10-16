'use client';

import { useState } from 'react';
import { auditLabel, auditColor } from '@/lib/audit/display';
import { statusColor } from '@/lib/status/colors';
import type { AuditHistoryRow } from '@/lib/types/database';

export type TechnicalDetail = {
  metadata: unknown;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  user_agent: string | null;
};

const FILTERS = ['All', 'Status', 'Security', 'Email', 'System'] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function matchesFilter(action: string, source: string, filter: Filter): boolean {
  switch (filter) {
    case 'Status':
      return /(\.created|\.disabled|\.enabled|\.role_changed|\.updated)$/.test(action) || action.startsWith('profile.');
    case 'Security':
      return action.startsWith('auth.') || action.includes('password_reset');
    case 'Email':
      return action.includes('invite') || action.includes('password_reset');
    case 'System':
      return ['system_job', 'vercel-cron', 'system'].includes(source) || action.startsWith('system');
    default:
      return true;
  }
}

export function HistoryTimeline({
  rows,
  technical,
}: {
  rows: AuditHistoryRow[];
  technical?: Record<number, TechnicalDetail>;
}) {
  const [filter, setFilter] = useState<Filter>('All');
  const visible = rows.filter((r) => matchesFilter(r.action, r.source, filter));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-pill px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f ? 'bg-ink text-spark' : 'border border-ink/15 text-ink hover:bg-ink/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">No history yet.</p>
      ) : (
        <ol className="space-y-3">
          {visible.map((r) => {
            const c = statusColor(auditColor(r.action));
            const tech = technical?.[r.id];
            return (
              <li key={r.id} className="flex gap-3">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: c.fg }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{auditLabel(r.action)}</span>
                    <time className="shrink-0 text-xs text-ink-soft" title={new Date(r.created_at).toLocaleString()}>
                      {timeAgo(r.created_at)}
                    </time>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {r.actor_name ?? 'System'}
                    {r.actor_role ? ` · ${r.actor_role}` : ''}
                    {r.old_status && r.new_status ? ` · ${r.old_status} → ${r.new_status}` : ''}
                  </p>
                  {tech ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-ink-soft underline">Technical details</summary>
                      <pre className="mt-1 overflow-x-auto rounded bg-ink/5 p-2 text-[11px] leading-snug text-ink">
                        {JSON.stringify(
                          {
                            old_values: tech.old_values,
                            new_values: tech.new_values,
                            metadata: tech.metadata,
                            ip_address: tech.ip_address,
                            user_agent: tech.user_agent,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
