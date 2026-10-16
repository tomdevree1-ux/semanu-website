/**
 * The brand gold "!" spinner — a self-contained loading indicator (no global CSS
 * dependency). Rotates + pulses; falls back to a gentle opacity pulse under
 * prefers-reduced-motion. Client-safe (no hooks) so it renders in any component.
 */
export function Spinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 40 : 24;
  return (
    <span className={`amai-spinner ${className}`} role="status" aria-label="Loading" style={{ fontSize }}>
      !
      <style>{`
        .amai-spinner{display:inline-block;font-family:var(--font-instrument),system-ui,sans-serif;font-weight:700;color:#93E6BE;line-height:1;will-change:transform;animation:amai-spin .9s cubic-bezier(.5,.05,.5,.95) infinite}
        @keyframes amai-spin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(.8)}100%{transform:rotate(360deg) scale(1)}}
        @media (prefers-reduced-motion: reduce){.amai-spinner{animation:amai-pulse 1.2s ease-in-out infinite}@keyframes amai-pulse{0%,100%{opacity:1}50%{opacity:.45}}}
      `}</style>
    </span>
  );
}
