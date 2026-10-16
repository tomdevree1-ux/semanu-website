/**
 * The amai chevron mark (the favicon mark) used as a premium list bullet,
 * site-wide. Replaces plain dots on USP / feature lists. Inherits size from the
 * passed className; colour defaults to mint-deep (on light surfaces).
 */
export function BrandBullet({ className = 'h-3 w-2' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 20"
      fill="none"
      aria-hidden
      className={`shrink-0 text-mint-deep ${className}`}
    >
      <path
        d="M2.2 2.2L11.8 10L2.2 17.8"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}
