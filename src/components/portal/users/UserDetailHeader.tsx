import type { ReactNode } from 'react';
import { Avatar } from '@/components/portal/ui/Avatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import type { UserDetail } from '@/modules/users/types';

/** User detail header: avatar, name, email, badges + an action slot (history clock). */
export function UserDetailHeader({ user, action }: { user: UserDetail; action?: ReactNode }) {
  const name =
    user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-5">
      <Avatar src={user.avatarUrl} alt={name} initial={(name[0] ?? 'A').toUpperCase()} size={56} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl text-ink">{name}</div>
        <div className="truncate text-sm text-ink-soft">{user.email}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge entityType="user" status={user.status} />
          <RoleBadge role={user.role} />
          {user.isPlatformSuperAdmin ? (
            <span className="rounded-pill bg-spark/20 px-2 py-0.5 text-xs font-medium text-ink">
              Platform super-admin
            </span>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
