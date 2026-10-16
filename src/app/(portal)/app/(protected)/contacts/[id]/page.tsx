import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getContact } from '@/modules/contacts/queries';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { ContactDetailActions } from '@/components/portal/contacts/ContactDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('contacts.read');
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();

  const [permKeys, rows] = await Promise.all([
    getUserPermissions(),
    getHistory('contact', id, 50, 0),
  ]);
  const canUpdate = permKeys.includes('contacts.update');
  const canArchive = permKeys.includes('contacts.archive');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('contact', id, 50);
    technical = {};
    for (const r of raw) {
      technical[r.id] = {
        metadata: r.metadata,
        old_values: r.old_values,
        new_values: r.new_values,
        ip_address: r.ip_address,
        user_agent: r.user_agent,
      };
    }
  }

  const name = contact.name || contact.email || 'Unnamed contact';

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/contacts" className="text-sm text-red hover:underline">
        ← Back to contacts
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge entityType="contact" status={contact.contactStatus} size="md" />
            {contact.isPrimary ? (
              <span className="rounded-pill bg-spark/30 px-2 py-0.5 text-xs font-medium text-ink">Primary</span>
            ) : null}
            <span className="text-sm text-ink-soft">
              at{' '}
              <Link href={`/app/companies/${contact.companyId}`} className="text-red hover:underline">
                {contact.companyName || 'company'}
              </Link>
            </span>
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Contact history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {fmt(contact.createdAt)}</div>
        <div>Updated {fmt(contact.updatedAt)}</div>
      </div>

      <div className="mt-4">
        <ContactDetailActions contact={contact} canUpdate={canUpdate} canArchive={canArchive} />
      </div>
    </div>
  );
}
