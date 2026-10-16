import type { ReactNode } from 'react';
import { requireAuth, getCurrentProfile } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getSignedAvatarUrl } from '@/modules/profile/queries';
import { env } from '@/lib/env';
import { PortalShell, type PortalPerms, type PortalAccount } from '@/components/portal/shell/PortalShell';
import type { PortalNotification } from '@/components/portal/shell/NotificationsMenu';
import { listLeads } from '@/modules/leads/queries';

/**
 * Protected portal layout. `requireAuth()` is the authorization boundary: it does a LIVE read of the
 * profile status, so a guest or a disabled user is redirected to /app/login on the next request. The
 * profile + permission set are resolved through per-request cached helpers (one auth check, one profile
 * read, one permissions RPC shared with the page guard + body), then handed to the (client) PortalShell
 * which renders the grouped sidebar + responsive drawer. Every nav item stays permission-gated.
 */
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAuth();

  const profile = await getCurrentProfile();
  const name = profile?.full_name || profile?.first_name || profile?.email?.split('@')[0] || 'Account';
  const initial = (name.trim()[0] ?? 'A').toUpperCase();

  // The avatar signed URL and the permission set are independent of each other,
  // so resolve them together: one round-trip here instead of two in series.
  const [avatarUrl, permKeys] = await Promise.all([
    getSignedAvatarUrl(profile?.avatar_url ?? null),
    getUserPermissions(),
  ]);
  const keys = new Set(permKeys);
  const perms: PortalPerms = {
    users: keys.has('users.read'),
    companies: keys.has('companies.read'),
    contacts: keys.has('contacts.read'),
    leads: keys.has('leads.read'),
    projects: keys.has('projects.read'),
    catalog: keys.has('catalog.read'),
    quotes: keys.has('quotes.read'),
    configurations: keys.has('configurations.read'),
    invoices: keys.has('invoices.read'),
    payments: keys.has('payments.read'),
    paymentLinks: keys.has('payment_links.read'),
    subscriptions: keys.has('subscriptions.read'),
    subChanges: keys.has('subscriptions.request_change'),
    funnels: keys.has('funnels.read'),
    websiteReports: keys.has('website_reports.read'),
    followUps: env.enableFollowUpWorklist,
  };
  const account: PortalAccount = { name, initial, avatarUrl, sub: profile?.email ?? '' };

  // Best-effort notification feed for the topbar bell. A failed count must never
  // block the portal, so it is wrapped and simply yields no alert dot.
  const notifications: PortalNotification[] = [];
  if (keys.has('leads.read')) {
    try {
      const { total } = await listLeads({ status: 'new', page: 1 });
      if (total > 0) {
        notifications.push({
          id: 'leads-new',
          tone: 'info',
          title: `${total} new ${total === 1 ? 'lead' : 'leads'}`,
          body:
            total === 1
              ? 'A new enquiry is waiting to be reviewed.'
              : 'New enquiries are waiting to be reviewed.',
          href: '/app/leads?status=new',
        });
      }
    } catch {
      // notifications are non-critical — ignore and show none
    }
  }

  return (
    <PortalShell perms={perms} account={account} notifications={notifications}>
      {children}
    </PortalShell>
  );
}
