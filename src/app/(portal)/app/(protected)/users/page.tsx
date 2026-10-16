import { requirePermission } from '@/lib/security/rbac';
import { listUsers } from '@/modules/users/queries';
import { ROLES, ROLE_LABELS } from '@/modules/users/schema';
import { UserTable } from '@/components/portal/users/UserTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, Pager } from '@/components/portal/ui/ListChrome';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('users.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const { rows, total, pageSize } = await listUsers({ q: sp.q, status: sp.status, role: sp.role, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.role) u.set('role', sp.role);
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader title="Users" action={<NewButton href="/app/users/new" label="New user" />} />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Name or email" />
        <FilterSelect
          name="status"
          defaultValue={sp.status}
          allLabel="All (active)"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'invited', label: 'Invited' },
            { value: 'disabled', label: 'Disabled' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <FilterSelect name="role" defaultValue={sp.role} allLabel="All roles" options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
      </FilterBar>

      <div className="mt-1">
        <UserTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="users" href={qs} />
    </div>
  );
}
