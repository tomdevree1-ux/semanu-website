import Link from 'next/link';
import { Avatar } from '@/components/portal/ui/Avatar';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { RoleBadge } from './RoleBadge';
import type { UserListRow } from '@/modules/users/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}
function displayName(u: UserListRow): string {
  return u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email.split('@')[0];
}

/**
 * User list (server-rendered). Each row is fully clickable via the stretched-link
 * pattern (Part V §V2): the name is the one real <Link>, its ::after overlays the
 * whole <tr>. No "View"-button-only target; future inner controls take
 * `rowControlClass` to stay independently clickable.
 */
export function UserTable({ rows }: { rows: UserListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No users match.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last sign in</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const name = displayName(u);
            return (
              <tr key={u.id} data-row-href={`/app/users/${u.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatarUrl} alt={name} initial={(name[0] ?? 'A').toUpperCase()} size={32} />
                    <div className="min-w-0">
                      <Link
                        href={`/app/users/${u.id}`}
                        aria-label={`Open ${name}`}
                        className={`font-medium text-ink ${stretchedLinkClass}`}
                      >
                        {name}
                      </Link>
                      <div className="truncate text-xs text-ink-soft">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3"><StatusBadge entityType="user" status={u.status} /></td>
                <td className="px-4 py-3 text-ink-soft">{fmt(u.lastLoginAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{fmt(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-ink-soft transition-colors group-hover:text-ink" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
