import { Fragment } from 'react';
import { Brand } from './Brand';

/**
 * Reveals a line of copy word by word with a "magical" feel: each word fades up
 * out of a soft blur, and every word gets its own delay AND its own duration, so
 * some words are still materialising while the next already begins. Timings are
 * derived from a deterministic pseudo-random per word index, so the server and
 * client render identically (no hydration jitter) while still looking organic.
 *
 * The literal "amai!" token is swapped for the <Brand/> wordmark, like BrandText.
 * Honors prefers-reduced-motion (the .hero-word CSS falls back to fully visible).
 */
function rand(i: number) {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function HeroWordReveal({
  children,
  startDelay = 0.1,
}: {
  children: string;
  startDelay?: number;
}) {
  const words = children.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => {
        // Scattered in random WAVES: each word is dropped into one of a handful
        // of time buckets at random, so several words light up at once (not one
        // by one) and the order is all over the line, not left to right.
        // Waves so the whole reveal finishes around ~1.7s (startDelay 0.1 +
        // up to 4 * 0.2 = 0.9 start, + up to ~0.85 fade).
        const waves = 4;
        const step = 0.2;
        const delay = startDelay + Math.round(rand(i) * waves) * step;
        // Each word materialises at its own pace (0.45s - 0.85s).
        const duration = 0.45 + rand(i * 2 + 1) * 0.4;
        return (
          <Fragment key={i}>
            <span
              className="hero-word"
              style={{
                animationDelay: `${delay.toFixed(2)}s`,
                animationDuration: `${duration.toFixed(2)}s`,
              }}
            >
              {word === 'amai!' ? <Brand /> : word}
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        );
      })}
    </>
  );
}
