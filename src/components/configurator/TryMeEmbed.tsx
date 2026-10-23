'use client';

import { useState } from 'react';
import { TRY_ME, type ConfLocale } from '@/content/configurators';

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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper/55 px-6 text-center backdrop-blur-[3px]">
          <button type="button" onClick={() => setActive(true)} className="btn btn-primary text-[17px]">
            {t.button} <span aria-hidden className="btn-arrow" />
          </button>
          <p className="max-w-[44ch] rounded-full bg-white/85 px-4 py-1.5 text-sm text-ink-soft">{t.text}</p>
        </div>
      )}
    </div>
  );
}
