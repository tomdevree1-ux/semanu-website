import { StatusBadge } from '@/components/portal/ui/StatusBadge';

/**
 * Compatibility wrapper over the shared StatusBadge (kept so existing import
 * sites and tests keep working). New code should use StatusBadge directly.
 */
export function UserStatusBadge({ status }: { status: string }) {
  return <StatusBadge entityType="user" status={status} />;
}
