import { requireAuth } from '@/lib/security/rbac';
import { getSignedAvatarUrl } from '@/modules/profile/queries';
import { Avatar } from '@/components/portal/ui/Avatar';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { ProfileForm } from '@/components/portal/profile/ProfileForm';
import { AvatarUpload } from '@/components/portal/profile/AvatarUpload';

export default async function ProfilePage() {
  const profile = await requireAuth();
  const avatarUrl = await getSignedAvatarUrl(profile.avatar_url);

  const name =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const initial = (name.trim()[0] ?? 'A').toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head">
        <div>
          <span className="pa-eyebrow">amai platform</span>
          <h1 className="page-title">Your profile</h1>
        </div>
      </div>

      <div className="space-y-6">
        <section className="card flex items-center gap-4">
          <Avatar src={avatarUrl} alt={name} initial={initial} size={64} />
          <div className="min-w-0">
            <div className="font-display text-lg text-ink">{name}</div>
            <div className="truncate text-sm text-ink-soft">{profile.email}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <StatusBadge entityType="user" status={profile.status} />
              {profile.last_login_at ? (
                <span>Last sign in {new Date(profile.last_login_at).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-4 font-display text-lg text-ink">Profile photo</h2>
          <AvatarUpload
            avatarUrl={avatarUrl}
            name={name}
            initialLetter={initial}
            hasAvatar={!!profile.avatar_url}
          />
        </section>

        <ProfileForm
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={profile.email}
        />
      </div>
    </div>
  );
}
