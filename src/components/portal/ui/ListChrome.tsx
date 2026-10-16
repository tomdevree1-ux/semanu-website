import type { ReactNode } from 'react';
import Link from 'next/link';
import { PortalSelect } from './PortalSelect';

/**
 * Shared chrome for the portal list pages (Companies, Contacts, Quotes, ...).
 * Renders the platform design-system header + filter toolbar so every list page
 * matches the Leads board instead of ad-hoc Tailwind pills. All server-safe.
 */

export function ListHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="pa-eyebrow">amai platform</span>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {action ? <div className="page-head-actions">{action}</div> : null}
    </div>
  );
}

/** Primary "New ..." call to action for a list header. */
export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="pa-btn pa-btn-primary">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </Link>
  );
}

/** Secondary ghost link for a list header (e.g. cross-links between views). */
export function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="pa-btn pa-btn-ghost pa-btn-sm">
      {label}
    </Link>
  );
}

export function FilterBar({ children, submitLabel = 'Filter' }: { children: ReactNode; submitLabel?: string }) {
  return (
    <form method="get" className="toolbar">
      {children}
      <button type="submit" className="pa-btn pa-btn-ghost pa-btn-sm">
        {submitLabel}
      </button>
    </form>
  );
}

export function FilterSearch({
  defaultValue,
  placeholder,
  name = 'q',
}: {
  defaultValue?: string;
  placeholder: string;
  name?: string;
}) {
  return (
    <div className="search-inline filter-search">
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="9" cy="9" r="6" />
        <path d="M14 14l4 4" />
      </svg>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

type Opt = { value: string; label: string };

export function FilterSelect({
  name,
  defaultValue,
  allLabel,
  options,
}: {
  name: string;
  defaultValue?: string;
  allLabel: string;
  options: Opt[];
}) {
  return (
    <PortalSelect
      name={name}
      defaultValue={defaultValue ?? ''}
      aria-label={allLabel}
      pill
      options={[{ value: '', label: allLabel }, ...options]}
    />
  );
}

export function FilterCheckbox({
  name = 'archived',
  value = '1',
  defaultChecked,
  label,
}: {
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="filter-check">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function Pager({
  page,
  totalPages,
  total,
  noun,
  href,
}: {
  page: number;
  totalPages: number;
  total: number;
  noun: string;
  href: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pager">
      <span>
        Page {page} of {totalPages} · {total} {noun}
      </span>
      <div className="pager-btns">
        {page > 1 ? <Link href={href(page - 1)} className="pa-btn pa-btn-ghost pa-btn-sm">Previous</Link> : null}
        {page < totalPages ? <Link href={href(page + 1)} className="pa-btn pa-btn-ghost pa-btn-sm">Next</Link> : null}
      </div>
    </div>
  );
}
