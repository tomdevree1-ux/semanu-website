import { redirect } from 'next/navigation';
import { getUserPermissions } from '@/lib/security/authorize';

/**
 * The dashboard hub was removed. `/app/dashboard` stays as the canonical landing
 * path (post-login, logo, breadcrumb) but now bounces the user straight into the
 * first area their role can access — never a page they must look at.
 */
const LANDING: Array<[perm: string, href: string]> = [
  ['leads.read', '/app/leads'],
  ['companies.read', '/app/companies'],
  ['contacts.read', '/app/contacts'],
  ['projects.read', '/app/projects'],
  ['quotes.read', '/app/quotes'],
  ['invoices.read', '/app/invoices'],
  ['funnels.read', '/app/funnels'],
  ['website_reports.read', '/app/website-reports'],
  ['catalog.read', '/app/catalog'],
  ['payments.read', '/app/payments'],
  ['subscriptions.read', '/app/subscriptions'],
  ['users.read', '/app/users'],
  ['acquisition.read', '/app/acquisition'],
];

export default async function DashboardRedirect() {
  const keys = new Set(await getUserPermissions());
  const target = LANDING.find(([perm]) => keys.has(perm))?.[1] ?? '/app/profile';
  redirect(target);
}
