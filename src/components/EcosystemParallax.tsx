'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Classy pointer parallax for the services ecosystem orbit. Wraps the desktop SVG in a
 * div that, while the cursor is over it, gently leans the whole orbit toward the mouse
 * (a subtle 3D tilt that makes it feel like it stretches toward the pointer) and eases
 * back to rest on leave. Understated: max tilt about 7deg, smooth easing.
 *
 * Enabled only for fine pointers (mouse / trackpad) and disabled entirely under
 * prefers-reduced-motion: reduce. On coarse pointers / reduced motion it renders the
 * children unchanged, so the orbit stays static and upright. Client component.
 */

const MAX_TILT = 7; // degrees

export function EcosystemParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [transform, setTransform] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const fine = window.matchMedia('(pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(fine.matches && !reduce.matches);
    sync();
    fine.addEventListener('change', sync);
    reduce.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      reduce.removeEventListener('change', sync);
    };
  }, []);

  if (!enabled) return <>{children}</>;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Cursor offset from the element centre, normalised to roughly -1..1.
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTransform(
      `perspective(1000px) rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg)`,
    );
  };

  const handleLeave = () => setTransform(undefined);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        transform,
        transition: 'transform .35s cubic-bezier(.22,.61,.36,1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
