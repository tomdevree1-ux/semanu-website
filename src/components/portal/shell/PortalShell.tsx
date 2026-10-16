'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOutAction } from '@/modules/auth/actions';
import { Icon } from './icons';
import { CommandPalette, type CommandItem } from './CommandPalette';
import { NotificationsMenu, type PortalNotification } from './NotificationsMenu';

/** Nav permission flags, resolved server-side in the protected layout. */
export type PortalPerms = {
  users: boolean;
  companies: boolean;
  contacts: boolean;
  leads: boolean;
  projects: boolean;
  catalog: boolean;
  quotes: boolean;
  configurations: boolean;
  invoices: boolean;
  payments: boolean;
  paymentLinks: boolean;
  subscriptions: boolean;
  subChanges: boolean;
  funnels: boolean;
  websiteReports: boolean;
  followUps: boolean;
};
export type PortalAccount = { name: string; initial: string; avatarUrl: string | null; sub: string };

type Item = { href: string; label: string; icon: string; show: boolean };
type Group = { label: string; items: Item[] };

function buildGroups(p: PortalPerms): Group[] {
  return [
    {
      label: 'CRM',
      items: [
        { href: '/app/companies', label: 'Companies', icon: 'layers', show: p.companies },
        { href: '/app/contacts', label: 'Contacts', icon: 'users', show: p.contacts },
        { href: '/app/leads', label: 'Leads', icon: 'flame', show: p.leads },
      ],
    },
    {
      label: 'Sales',
      items: [
        { href: '/app/projects', label: 'Projects', icon: 'folder', show: p.projects },
        { href: '/app/catalog', label: 'Catalog', icon: 'board', show: p.catalog },
        { href: '/app/quotes', label: 'Quotes', icon: 'doc', show: p.quotes },
        { href: '/app/configurations', label: 'Configurations', icon: 'board', show: p.configurations },
      ],
    },
    {
      label: 'Finance',
      items: [
        { href: '/app/invoices', label: 'Invoices', icon: 'coin', show: p.invoices },
        { href: '/app/payments', label: 'Payments', icon: 'download', show: p.payments },
        { href: '/app/payment-links', label: 'Payment links', icon: 'send', show: p.paymentLinks },
        { href: '/app/subscriptions', label: 'Subscriptions', icon: 'clock', show: p.subscriptions },
        { href: '/app/subscription-changes', label: 'Sub changes', icon: 'edit', show: p.subChanges },
      ],
    },
    {
      label: 'Website funnel',
      items: [
        { href: '/app/funnels', label: 'Funnels', icon: 'filter', show: p.funnels },
        { href: '/app/website-reports', label: 'Reports', icon: 'trend', show: p.websiteReports },
        { href: '/app/website-reports/deliveries', label: 'Deliveries', icon: 'inbox', show: p.websiteReports },
        { href: '/app/website-reports/follow-ups', label: 'Follow-ups', icon: 'bell', show: p.websiteReports && p.followUps },
      ],
    },
    { label: 'Admin', items: [{ href: '/app/users', label: 'Users', icon: 'user', show: p.users }] },
  ];
}

// Four primary sections for the mobile bottom-nav.
const BOTNAV = [
  { href: '/app/leads', label: 'Leads', icon: 'flame' },
  { href: '/app/companies', label: 'Companies', icon: 'layers' },
  { href: '/app/projects', label: 'Projects', icon: 'folder' },
  { href: '/app/invoices', label: 'Invoices', icon: 'coin' },
];

export function PortalShell({ children, perms, account, notifications }: { children: ReactNode; perms: PortalPerms; account: PortalAccount; notifications: PortalNotification[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; out?: boolean }[]>([]);
  const toastId = useRef(0);
  const pathname = usePathname() || '';
  const router = useRouter();
  const groups = buildGroups(perms);

  const addToast = useCallback((msg: string) => {
    const id = ++toastId.current;
    setToasts((x) => [...x, { id, msg }]);
    setTimeout(() => setToasts((x) => x.map((t) => (t.id === id ? { ...t, out: true } : t))), 2600);
    setTimeout(() => setToasts((x) => x.filter((t) => t.id !== id)), 2950);
  }, []);

  // Whole-row navigation for list tables: one delegated handler reads `data-row-href` from a clicked <tr>.
  useEffect(() => {
    function onRowClick(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest('a, button, input, select, textarea, label, [role="button"]')) return;
      const href = el.closest('[data-row-href]')?.getAttribute('data-row-href');
      if (!href) return;
      if (window.getSelection()?.toString()) return;
      if (e.metaKey || e.ctrlKey || e.button === 1) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      router.push(href);
    }
    document.addEventListener('click', onRowClick);
    document.addEventListener('auxclick', onRowClick);
    return () => {
      document.removeEventListener('click', onRowClick);
      document.removeEventListener('auxclick', onRowClick);
    };
  }, [router]);

  // ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visible = groups.flatMap((g) => g.items).filter((i) => i.show);
  const activeHref =
    visible
      .map((i) => i.href)
      .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
      .sort((a, b) => b.length - a.length)[0] ?? '';
  const activeLabel = visible.find((i) => i.href === activeHref)?.label ?? 'Dashboard';

  const navCmds: CommandItem[] = visible.map((i) => ({ group: 'Navigation', icon: i.icon, label: i.label, hint: 'Go to', href: i.href }));
  const actionCmds: CommandItem[] = (
    [
      perms.projects && { group: 'Actions', icon: 'plus', label: 'New project', hint: 'Create', href: '/app/projects/new' },
      perms.companies && { group: 'Actions', icon: 'plus', label: 'New company', hint: 'Create', href: '/app/companies/new' },
      perms.contacts && { group: 'Actions', icon: 'plus', label: 'New contact', hint: 'Create', href: '/app/contacts/new' },
      perms.quotes && { group: 'Actions', icon: 'send', label: 'New quote', hint: 'Create', href: '/app/quotes/new' },
      perms.invoices && { group: 'Actions', icon: 'coin', label: 'New invoice', hint: 'Create', href: '/app/invoices/new' },
      { group: 'Actions', icon: 'user', label: 'Your profile', hint: 'Account', href: '/app/profile' },
    ] as (CommandItem | false)[]
  ).filter(Boolean) as CommandItem[];
  const commands = [...navCmds, ...actionCmds];

  return (
    <div className={'app' + (collapsed ? ' rail-collapsed' : '') + (mobileOpen ? ' rail-open' : '')}>
      {/* Sidebar */}
      <aside className="rail">
        <button className="rail-toggle" onClick={() => setCollapsed((c) => !c)} title="Collapse" aria-label="Collapse sidebar">
          <Icon n="chevleft" />
        </button>
        <Link href="/app/dashboard" className="rail-top">
          <div className="brand">
            <span className="word">amai</span>
            <span className="bang">!</span>
          </div>
        </Link>
        <div className="brand-sub">Admin portal</div>
        <nav className="nav">
          {groups.map((g) => {
            const items = g.items.filter((i) => i.show);
            if (!items.length) return null;
            return (
              <Fragment key={g.label || 'top'}>
                {g.label ? <div className="nav-section-t">{g.label}</div> : null}
                {items.map((i) => {
                  const active = i.href === activeHref;
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={'nav-item' + (active ? ' active' : '')}
                      aria-current={active ? 'page' : undefined}
                      title={i.label}
                    >
                      <span className="ic">
                        <Icon n={i.icon} />
                      </span>
                      <span className="nav-label">{i.label}</span>
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}
        </nav>
        <div className="rail-foot">
          <Link href="/app/profile" className="rail-user">
            <span className="avatar">
              {account.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={account.avatarUrl} alt={account.name} />
              ) : (
                account.initial
              )}
            </span>
            <span className="who rail-foot-txt">
              <span className="nm">{account.name}</span>
              <span className="rl">{account.sub || 'Administrator'}</span>
            </span>
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="icon-btn" title="Sign out" aria-label="Sign out">
              <Icon n="logout" />
            </button>
          </form>
        </div>
      </aside>

      {mobileOpen ? <div className="rail-scrim" onClick={() => setMobileOpen(false)} aria-hidden /> : null}

      {/* Main column */}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setMobileOpen(true)} title="Menu" aria-label="Open menu">
            <Icon n="menu" />
          </button>
          <div className="crumbs">
            <span className="root">amai.ch</span>
            <span className="sep root">/</span>
            <span className="here">{activeLabel}</span>
          </div>
          <div className="topbar-spacer" />
          <button type="button" className="cmdk" onClick={() => setCmdOpen(true)} aria-label="Search or jump to">
            <Icon n="search" />
            <span className="ph">Search or jump to…</span>
            <kbd>⌘K</kbd>
          </button>
          <NotificationsMenu items={notifications} />
          <button type="button" className="pa-btn pa-btn-primary pa-btn-sm" onClick={() => setCmdOpen(true)} style={{ height: 40 }}>
            <Icon n="plus" /> New
          </button>
        </header>
        <div className="scroll">
          <div className="page">{children}</div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="botnav">
        {BOTNAV.map((n) => {
          const active = n.href === activeHref;
          return (
            <Link key={n.href} href={n.href} className={'bn' + (active ? ' active' : '')}>
              <Icon n={n.icon} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />

      {/* Toasts */}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={'toast' + (t.out ? ' out' : '')}>
            <span className="tk">
              <Icon n="check" />
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
