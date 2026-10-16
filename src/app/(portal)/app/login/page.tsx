import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/security/rbac';
import { AuthCard } from '@/components/portal/ui/AuthCard';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Already signed in + active → straight to the dashboard.
  const profile = await getCurrentProfile();
  if (profile && profile.status === 'active') redirect('/app/dashboard');

  const sp = await searchParams;
  const notice =
    sp.reset === 'ok'
      ? { text: 'Password updated. You can now sign in.', kind: 'success' as const }
      : sp.disabled
        ? { text: 'Your account has been deactivated.', kind: 'error' as const }
        : sp.error === 'link'
          ? { text: 'That link was invalid or expired. Please sign in again.', kind: 'error' as const }
          : null;

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to the amai admin portal.">
      <LoginForm next={sp.next ?? null} notice={notice} />
    </AuthCard>
  );
}
