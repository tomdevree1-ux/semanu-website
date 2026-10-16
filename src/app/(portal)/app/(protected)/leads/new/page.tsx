import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listAssignableUsers } from '@/modules/leads/queries';
import { LeadForm } from '@/components/portal/leads/LeadForm';

export default async function NewLeadPage() {
  await requirePermission('leads.manage');
  const users = await listAssignableUsers();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/leads" className="text-sm text-ink-soft hover:underline">← Leads</Link>
      <div className="page-head mt-3">
        <div>
          <span className="pa-eyebrow">amai platform</span>
          <h1 className="page-title">New lead</h1>
          <p className="page-sub">Add a lead to your pipeline manually.</p>
        </div>
      </div>
      <LeadForm users={users} />
    </div>
  );
}
