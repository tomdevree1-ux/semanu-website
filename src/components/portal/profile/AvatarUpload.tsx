'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { uploadMyAvatar, removeMyAvatar } from '@/modules/profile/actions';
import type { ProfileFormState } from '@/modules/profile/schema';
import { Avatar } from '@/components/portal/ui/Avatar';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: ProfileFormState = {};

/**
 * Avatar block (Part V §V4): selecting OR dropping a file auto-starts the upload
 * (no separate Upload button). A local object-URL gives an immediate optimistic
 * preview; on success the server signed URL takes over, on failure the previous
 * avatar remains. Remove photo stays a separate explicit action. All validation
 * stays server-side (type/size/magic-byte, private bucket, signed URL).
 */
export function AvatarUpload({
  avatarUrl,
  name,
  initialLetter,
  hasAvatar,
}: {
  avatarUrl: string | null;
  name: string;
  initialLetter: string;
  hasAvatar: boolean;
}) {
  const [upState, upload, uploading] = useActionState(uploadMyAvatar, empty);
  const [rmState, remove, removing] = useActionState(removeMyAvatar, empty);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevUploading = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);
  const busy = uploading || removing;

  // Revoke the object URL when it changes or on unmount (no leaks).
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // When an upload finishes, drop the preview so the server signed URL (success)
  // or the unchanged previous avatar (failure) is shown; reset the input so the
  // same file can be retried.
  useEffect(() => {
    if (prevUploading.current && !uploading) {
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    }
    prevUploading.current = uploading;
  }, [uploading]);

  function onPick(file: File | null) {
    if (!file) return;
    setPreview(URL.createObjectURL(file)); // optimistic local preview
    formRef.current?.requestSubmit(); // auto-upload via the existing action
  }

  const shown = preview ?? avatarUrl;

  return (
    <div className="mt-3 space-y-3">
      {upState.ok ? <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">Photo updated.</p> : null}
      {rmState.ok ? <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">Photo removed.</p> : null}
      {upState.error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{upState.error}</p> : null}
      {rmState.error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{rmState.error}</p> : null}

      <div
        className="flex items-center gap-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (!file || !inputRef.current) return;
          const dt = new DataTransfer();
          dt.items.add(file);
          inputRef.current.files = dt.files;
          onPick(file);
        }}
        aria-label="Drop a photo here to upload it"
      >
        <div className="relative">
          <Avatar src={shown} alt={name} initial={initialLetter} size={64} />
          {uploading ? (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/40" aria-busy="true" aria-label="Uploading">
              <Spinner size="sm" />
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <form ref={formRef} action={upload}>
            <input
              ref={inputRef}
              id="avatar-file"
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <label
              htmlFor="avatar-file"
              className={`pa-btn pa-btn-primary !py-2 ${busy ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
            >
              {uploading ? 'Uploading…' : 'Choose a photo'}
            </label>
          </form>
          {hasAvatar ? (
            <form action={remove}>
              <button type="submit" disabled={busy} className="text-sm text-red hover:underline disabled:opacity-70">
                {removing ? 'Removing…' : 'Remove photo'}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        PNG, JPG or WebP, up to 2 MB. Drag a photo here or choose one — it uploads automatically.
      </p>
    </div>
  );
}
