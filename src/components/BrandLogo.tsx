/**
 * The semanu logo lockup for the header and footer (rebrand): a mint chevron mark
 * followed by the "semanu" wordmark. The wordmark inherits currentColor (navy on
 * light, white on dark); the chevron stays mint. No exclamation mark, no spin.
 */
export function BrandLogo({
  className = '',
  chevronColor = 'var(--color-mint)',
}: {
  className?: string;
  /** Chevron stroke colour. Mint on dark surfaces, deep green on light ones. */
  chevronColor?: string;
}) {
  return (
    <span className={`brand-mark inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width="0.39em"
        height="0.56em"
        viewBox="0 0 14 20"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M2.2 2.2L11.8 10L2.2 17.8"
          fill="none"
          stroke={chevronColor}
          strokeWidth="4.4"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        />
      </svg>
      semanu
    </span>
  );
}
