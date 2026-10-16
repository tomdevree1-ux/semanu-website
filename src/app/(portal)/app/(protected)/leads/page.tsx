import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listLeads, listAssignableUsers } from '@/modules/leads/queries';
import { LEAD_CHANNELS, LEAD_CHANNEL_LABELS, LEAD_STATUSES } from '@/modules/leads/types';
import { LeadBoard } from '@/components/portal/leads/LeadBoard';
import { FilterSelect, NewButton } from '@/components/portal/ui/ListChrome';

/**
 * Leads board. The pipeline is the sales lifecycle (New / Assigned / Contacting /
 * Proposal / Won / Lost / On Hold) rendered as a kanban: one query per stage.
 * Managers can drag cards between stages; a click opens the lead detail, where the
 * stage, channel, note and delete live. Search + channel filters apply everywhere.
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('leads.read');
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const channel = sp.channel || undefined;

  const [columns, permKeys, assignableUsers] = await Promise.all([
    Promise.all(
      LEAD_STATUSES.map(async (status) => {
        const { rows, total } = await listLeads({ q, status, channel, page: 1 });
        return { status, rows, total };
      }),
    ),
    getUserPermissions(),
    listAssignableUsers(),
  ]);
  const canManage = permKeys.includes('leads.manage');

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="pa-eyebrow">amai platform</span>
          <h1 className="page-title">Leads</h1>
          <p className="page-sub">Enquiries and opportunities across your sales pipeline. Drag a card to move its stage.</p>
        </div>
        {canManage ? (
          <div className="page-head-actions">
            <NewButton href="/app/leads/new" label="New lead" />
          </div>
        ) : null}
      </div>

      <form method="get" className="toolbar">
        <div className="search-inline filter-search">
          <svg viewBox="0 0 20 20" aria-hidden>
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Search name, email or company" aria-label="Search leads" />
        </div>
        <FilterSelect
          name="channel"
          defaultValue={sp.channel}
          allLabel="All channels"
          options={LEAD_CHANNELS.map((c) => ({ value: c, label: LEAD_CHANNEL_LABELS[c] }))}
        />
        <button type="submit" className="pa-btn pa-btn-ghost pa-btn-sm">Filter</button>
      </form>

      <LeadBoard columns={columns} canManage={canManage} users={assignableUsers} />
    </div>
  );
}
