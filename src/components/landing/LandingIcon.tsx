import type { ReactNode } from 'react';

// Small inline line-icon set for the landing feature tiles. Stroke inherits
// currentColor so the tile can recolour the icon on hover.
const PATHS: Record<string, ReactNode> = {
  design: (
    <>
      <path d="M4 20l4-1 9-9-3-3-9 9-1 4z" />
      <path d="M13.5 6.5l3 3" />
    </>
  ),
  hosting: (
    <>
      <rect x="3" y="5" width="18" height="6" rx="1.5" />
      <rect x="3" y="13" width="18" height="6" rx="1.5" />
      <path d="M7 8h.01M7 16h.01" />
    </>
  ),
  security: (
    <>
      <path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  seo: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M5 5l4.2 4.2M19 5l-4.2 4.2M5 19l4.2-4.2M19 19l-4.2-4.2" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  local: (
    <>
      <path d="M12 21c4.5-4 7-7 7-10.5A7 7 0 005 10.5C5 14 7.5 17 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
    </>
  ),
  growth: (
    <>
      <path d="M4 16l5-5 3.5 3.5L20 7" />
      <path d="M20 11V7h-4" />
    </>
  ),
  structure: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  trust: (
    <>
      <path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4V5z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </>
  ),
  price: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M14 9.3c-.6-.7-1.4-1-2.3-1-1.2 0-2 .7-2 1.7 0 2.4 4.5 1.3 4.5 3.7 0 1-.9 1.8-2.2 1.8-1 0-1.8-.4-2.4-1.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  default: <circle cx="12" cy="12" r="8" />,
};

export function LandingIcon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.default}
    </svg>
  );
}
