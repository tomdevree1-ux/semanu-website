'use client';

import { useState } from 'react';
import { TRY_ME, type ConfLocale } from '@/content/demo';

/**
 * Embedded live configurator behind an activation layer. Until the visitor
 * clicks the button, the layer blocks interaction so scrolling the page never
 * gets captured by the 3D canvas. The layer also carries the demo notice.
 */
export function TryMeEmbed({ src, title, locale }: { src: string; title: string; locale: string }) {
  const [active, setActive] = useState(false);
  const t = TRY_ME[locale as ConfLocale] ?? TRY_ME.en;

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-[0_34px_90px_-50px_rgba(16,35,61,0.55)]">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="fullscreen"
        tabIndex={active ? 0 : -1}
        className="block h-[clamp(560px,80vh,880px)] w-full"
      />
      {!active && (
        <div
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-5 bg-paper/55 px-6 text-center backdrop-blur-[3px]"
          onClick={() => setActive(true)}
        >
          {/* Animated hint: a slowly turning 3D cube with a pulsing mint ring and a tapping hand. */}
          <span aria-hidden className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-mint/50 motion-safe:animate-ping" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_18px_40px_-18px_rgba(16,35,61,0.45)]">
              <svg viewBox="0 0 48 48" className="h-11 w-11 text-navy motion-safe:animate-[tryme-turn_4s_ease-in-out_infinite]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
                <path d="M24 6 40 15v18L24 42 8 33V15z" />
                <path d="M8 15l16 9 16-9M24 24v18" />
              </svg>
              <svg viewBox="0 0 24 24" className="absolute -bottom-1 -right-1 h-8 w-8 text-mint-deep motion-safe:animate-[tryme-tap_1.6s_ease-in-out_infinite]" fill="currentColor">
                <path d="M9 3.5a1.5 1.5 0 0 1 3 0V10l.6-.1a1.5 1.5 0 0 1 1.9 1.1l.1.4.5-.1a1.5 1.5 0 0 1 1.8 1.1l.1.4.4-.1a1.5 1.5 0 0 1 1.8 1.4V17a5 5 0 0 1-5 5h-1.6a5 5 0 0 1-4-2l-3.4-4.5a1.5 1.5 0 0 1 2.3-1.9L9 15V3.5z" stroke="#fff" strokeWidth="1.2" />
              </svg>
            </span>
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive(true); }}
            className="btn btn-primary text-[17px]"
          >
            {t.button} <span aria-hidden className="btn-arrow" />
          </button>
          <p className="max-w-[60ch] rounded-full bg-white/85 px-4 py-1.5 text-sm text-ink-soft">{t.text}</p>
        </div>
      )}
    </div>
  );
}
