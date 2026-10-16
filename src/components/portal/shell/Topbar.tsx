import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { env } from '@/lib/env';
import { signOutAction } from '@/modules/auth/actions';
import { getCurrentProfile } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { getSignedAvatarUrl } from '@/modules/profile/queries';
import { Avatar } from '@/components/portal/ui/Avatar';

/** Authenticated portal top bar: brand + nav + account avatar + sign-out. */
export async function Topbar() {
  const profile = await getCurrentProfile();
  const name =
    profile?.full_name || profile?.first_name || profile?.email?.split('@')[0] || 'Account';
  const initial = (name.trim()[0] ?? 'A').toUpperCase();
  const avatarUrl = await getSignedAvatarUrl(profile?.avatar_url ?? null);
  const [canUsers, canCompanies, canContacts, canProjects, canCatalog, canQuotes, canInvoices, canPayments, canPaymentLinks, canSubscriptions, canFunnels] = await Promise.all([
    hasPermission('users.read'),
    hasPermission('companies.read'),
    hasPermission('contacts.read'),
    hasPermission('projects.read'),
    hasPermission('catalog.read'),
    hasPermission('quotes.read'),
    hasPermission('invoices.read'),
    hasPermission('payments.read'),
    hasPermission('payment_links.read'),
    hasPermission('subscriptions.read'),
    hasPermission('funnels.read'),
  ]);
  const canSubscriptionChanges = await hasPermission('subscriptions.request_change');
  const canWebsiteReports = await hasPermission('website_reports.read');

  return (
    <header className="border-b border-ink/10 bg-paper-2">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <span className="font-display text-lg text-ink">
            <BrandLogo />
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/app/dashboard" className="text-ink-soft transition-colors hover:text-ink">
              Dashboard
            </Link>
            {canCompanies ? (
              <Link href="/app/companies" className="text-ink-soft transition-colors hover:text-ink">
                Companies
              </Link>
            ) : null}
            {canContacts ? (
              <Link href="/app/contacts" className="text-ink-soft transition-colors hover:text-ink">
                Contacts
              </Link>
            ) : null}
            {canProjects ? (
              <Link href="/app/projects" className="text-ink-soft transition-colors hover:text-ink">
                Projects
              </Link>
            ) : null}
            {canCatalog ? (
              <Link href="/app/catalog" className="text-ink-soft transition-colors hover:text-ink">
                Catalog
              </Link>
            ) : null}
            {canQuotes ? (
              <Link href="/app/quotes" className="text-ink-soft transition-colors hover:text-ink">
                Quotes
              </Link>
            ) : null}
            {canInvoices ? (
              <Link href="/app/invoices" className="text-ink-soft transition-colors hover:text-ink">
                Invoices
              </Link>
            ) : null}
            {canPayments ? (
              <Link href="/app/payments" className="text-ink-soft transition-colors hover:text-ink">
                Payments
              </Link>
            ) : null}
            {canPaymentLinks ? (
              <Link href="/app/payment-links" className="text-ink-soft transition-colors hover:text-ink">
                Payment links
              </Link>
            ) : null}
            {canSubscriptions ? (
              <Link href="/app/subscriptions" className="text-ink-soft transition-colors hover:text-ink">
                Subscriptions
              </Link>
            ) : null}
            {canSubscriptionChanges ? (
              <Link href="/app/subscription-changes" className="text-ink-soft transition-colors hover:text-ink">
                Sub changes
              </Link>
            ) : null}
            {canFunnels ? (
              <Link href="/app/funnels" className="text-ink-soft transition-colors hover:text-ink">
                Funnels
              </Link>
            ) : null}
            {canWebsiteReports ? (
              <Link href="/app/website-reports" className="text-ink-soft transition-colors hover:text-ink">
                Reports
              </Link>
            ) : null}
            {canWebsiteReports ? (
              <Link href="/app/website-reports/deliveries" className="text-ink-soft transition-colors hover:text-ink">
                Deliveries
              </Link>
            ) : null}
            {canWebsiteReports && env.enableFollowUpWorklist ? (
              <Link href="/app/website-reports/follow-ups" className="text-ink-soft transition-colors hover:text-ink">
                Follow-ups
              </Link>
            ) : null}
            {canUsers ? (
              <Link href="/app/users" className="text-ink-soft transition-colors hover:text-ink">
                Users
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/app/profile"
            title="Your account"
            aria-label="Your account"
            className="rounded-full outline-none ring-offset-2 ring-offset-paper-2 focus-visible:ring-2 focus-visible:ring-red"
          >
            <Avatar src={avatarUrl} alt={`${name} — your account`} initial={initial} />
          </Link>
        </div>
      </div>
    </header>
  );
}
