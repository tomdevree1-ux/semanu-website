'use client';

import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { updateMyProfile } from '@/modules/profile/actions';

const input =
  'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

export function ProfileForm({
  firstName,
  lastName,
  email,
}: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return (
    <div className="space-y-6">
      <EditableBlock
        title="Name"
        action={updateMyProfile}
        readView={
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-soft">First name</dt>
              <dd className="text-ink">{firstName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Last name</dt>
              <dd className="text-ink">{lastName || '—'}</dd>
            </div>
          </dl>
        }
        editView={(pending) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">First name</span>
              <input
                name="first_name"
                type="text"
                maxLength={80}
                autoComplete="given-name"
                defaultValue={firstName ?? ''}
                disabled={pending}
                className={input}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Last name</span>
              <input
                name="last_name"
                type="text"
                maxLength={80}
                autoComplete="family-name"
                defaultValue={lastName ?? ''}
                disabled={pending}
                className={input}
              />
            </label>
          </div>
        )}
      />

      <section className="card">
        <h2 className="mb-3 font-display text-lg text-ink">Email</h2>
        <p className="text-sm text-ink">{email}</p>
        <p className="mt-1 text-xs text-ink-soft">Email cannot be changed here.</p>
      </section>
    </div>
  );
}
