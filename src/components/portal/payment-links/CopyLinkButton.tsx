'use client';

import { useState } from 'react';

/** Copy a URL to the clipboard with transient feedback. Client-only convenience. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard may be unavailable; the Open button still works */
        }
      }}
      className={className ?? 'rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5'}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
