import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listLinkableCompanies } from '@/modules/subscriptions/queries';
import { SubscriptionLinkForm } from '@/components/portal/subscriptions/SubscriptionLinkForm';

export default async function LinkSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('subscriptions.link');
  const sp = await searchParams;
  const companies = await listLinkableCompanies();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/subscriptions" className="text-sm text-red hover:underline">
        ← Back to subscriptions
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">Link a Stripe subscription</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Paste an existing Stripe subscription id. Its status, plan, amount and period are read from Stripe and stored as a
        synced snapshot. This never changes the subscription in Stripe.
      </p>
      <div className="mt-4">
        <SubscriptionLinkForm companies={companies} prefillCompanyId={sp.companyId} />
      </div>
    </div>
  );
}
