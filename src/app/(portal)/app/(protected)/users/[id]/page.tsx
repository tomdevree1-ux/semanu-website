import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions, isPlatformSuperAdmin } from '@/lib/security/authorize';
import { getUserDetail } from '@/modules/users/queries';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { UserDetailHeader } from '@/components/portal/users/UserDetailHeader';
import { UserDetailActions } from '@/components/portal/users/UserDetailActions';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('users.read');
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();

  const [permKeys, isSuperAdmin, rows] =
    await Promise.all([
      getUserPermissions(),
      isPlatformSuperAdmin(),
      getHistory('profile', id, 50, 0),
    ]);
  const canUpdate = permKeys.includes('users.update');
  const canCreate = permKeys.includes('users.create');
  const canChangeRole = permKeys.includes('users.change_role');
  const canDisable = permKeys.includes('users.disable');
  const canArchive = permKeys.includes('users.archive');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('profile', id, 50);
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

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/users" className="text-sm text-red hover:underline">
        ← Back to users
      </Link>

      <div className="mt-3">
        <UserDetailHeader
          user={user}
          action={<HistoryButton rows={rows} technical={technical} title="User history" />}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {new Date(user.createdAt).toLocaleDateString()}</div>
        <div>
          {user.lastLoginAt
            ? `Last sign in ${new Date(user.lastLoginAt).toLocaleDateString()}`
            : 'Never signed in'}
        </div>
      </div>

      <div className="mt-4">
        <UserDetailActions
          user={user}
          canUpdate={canUpdate}
          canCreate={canCreate}
          canChangeRole={canChangeRole}
          canDisable={canDisable}
          canArchive={canArchive}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
}
