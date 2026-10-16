import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { UserForm } from '@/components/portal/users/UserForm';

export default async function NewUserPage() {
  await requirePermission('users.create');
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/users" className="text-sm text-red hover:underline">
        ← Back to users
      </Link>
      <h1 className="mt-2 font-display text-3xl text-ink">New user</h1>
      <p className="mt-1 text-sm text-ink-soft">Create a platform user and send them an invite.</p>
      <div className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
        <UserForm />
      </div>
    </div>
  );
}
