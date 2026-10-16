'use client';

import { useState } from 'react';

/**
 * Circular account avatar. Shows the user's photo (a short-lived signed URL)
 * on a pink background, and falls back to the user's initial when there is no
 * photo or the image fails to load.
 */
export function Avatar({
  src,
  alt,
  initial,
  size = 36,
}: {
  src: string | null;
  alt: string;
  initial: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-pink ring-2 ring-spark"
      style={{ width: size, height: size }}
      title={alt}
      aria-label={alt}
    >
      {showImg ? (
        // Short-lived signed URL; next/image is unnecessary (and would need remote config).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-ink" style={{ fontSize: Math.round(size * 0.4) }}>
          {initial}
        </span>
      )}
    </span>
  );
}
