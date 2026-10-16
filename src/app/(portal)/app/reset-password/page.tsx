import Link from 'next/link';
import { getSessionUser } from '@/lib/security/rbac';
import { AuthCard } from '@/components/portal/ui/AuthCard';
import { ResetForm } from './ResetForm';

export default async function ResetPasswordPage() {
  // The recovery link routes through /app/auth/confirm (verifyOtp), which sets
  // the session before redirecting here.
  const user = await getSessionUser();
  if (!user) {
    return (
      <AuthCard
        title="Reset link"
        subtitle="This reset link is invalid or has expired."
        footer={
          <Link href="/app/forgot-password" className="text-navy hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-ink-soft">
          Please request a new password reset link to continue.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a strong password for your account.">
      <ResetForm />
    </AuthCard>
  );
}
