'use client';

import { useEffect, useRef, useState } from 'react';

type Fact = { value: number | null; unit?: string; prefix?: string; label: string; desc: string };

/**
 * Facts & figures block for the homepage (iO-style stacked rows): a big value on
 * the left, a short description on the right, a hairline between rows. Numeric
 * values count up once the block scrolls into view (respects reduced motion).
 * Non-numeric facts (value: null) show their label as-is (e.g. "AI driven").
 */
export function HomeFacts({ facts }: { facts: Fact[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setRun(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-8">
      {facts.map((f, i) => (
        <div
          key={f.label}
          className="grid grid-cols-1 items-baseline gap-2 border-t border-white/15 py-7 first:border-t-0 last:border-b sm:grid-cols-[1fr_auto] sm:gap-8"
        >
          <div className="font-sans text-[clamp(34px,4.6vw,62px)] font-bold leading-none tracking-[-0.03em] text-white">
            {f.value !== null ? (
              <>
                {f.prefix ? <span className="text-mint">{f.prefix}</span> : null}
                <Counter to={f.value} run={run} />
                {f.unit ? <span className="text-mint">{f.unit}</span> : null} {f.label}
              </>
            ) : (
              <>
                {f.prefix ? <span className="text-mint">{f.prefix}</span> : null} {f.label}
              </>
            )}
          </div>
          <p className="max-w-[40ch] text-[clamp(17px,1.6vw,20px)] text-paper/70 sm:text-right">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function Counter({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const dur = 1100;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);
  return <>{n}</>;
}
