import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import type { ContactListRow } from '@/modules/contacts/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Contacts list (server-rendered). Whole-row clickable (Part V §V2). */
export function ContactTable({ rows }: { rows: ContactListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No contacts match. Add one from a company or with New contact.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const name = c.name || c.email || 'Unnamed contact';
            return (
              <tr key={c.id} data-row-href={`/app/contacts/${c.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/contacts/${c.id}`}
                    aria-label={`Open ${name}`}
                    className={`font-medium text-ink ${stretchedLinkClass}`}
                  >
                    {name}
                    {c.isPrimary ? <span className="ml-2 align-middle text-xs text-ink-soft">(Primary)</span> : null}
                  </Link>
                  <div className="truncate text-xs text-ink-soft">{c.email || '—'}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.companyName || '—'}</td>
                <td className="px-4 py-3"><StatusBadge entityType="contact" status={c.contactStatus} /></td>
                <td className="px-4 py-3 text-ink-soft">{c.role || '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{fmt(c.updatedAt)}</td>
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
