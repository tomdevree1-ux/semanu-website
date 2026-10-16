import { ROLE_LABELS } from '@/modules/users/schema';
import type { Role } from '@/lib/types/database';

/** Neutral pill for a user's role (presentational, server-safe). */
export function RoleBadge({ role }: { role: Role | null }) {
  if (!role) return <span className="text-xs text-ink-soft">—</span>;
  return (
    <span className="rounded-pill border border-ink/15 px-2 py-0.5 text-xs font-medium text-ink">
      {ROLE_LABELS[role]}
    </span>
  );
}
