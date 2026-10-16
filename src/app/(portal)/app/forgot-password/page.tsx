import Link from 'next/link';
import { AuthCard } from '@/components/portal/ui/AuthCard';
import { ForgotForm } from './ForgotForm';

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="We will email you a secure reset link."
      footer={
        <Link href="/app/login" className="text-navy hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
