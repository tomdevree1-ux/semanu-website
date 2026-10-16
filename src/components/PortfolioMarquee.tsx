import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { PROJECTS } from '@/content/portfolio';

/**
 * Full-width, auto-sliding portfolio band. Presentational only (tiles are not
 * links and not clickable). The animation is the pure CSS transform loop defined
 * in globals.css (.marquee / .marquee-track / .marquee-item / .marquee-dup): three
 * tile copies slide as one seamless loop, it pauses on hover, runs slower on mobile,
 * and degrades to a manual swipe row under prefers-reduced-motion. The wrapper clips
 * overflow so the page never scrolls sideways. Used on the homepage and /referenzen.
 */
export async function PortfolioMarquee({ className = '' }: { className?: string }) {
  const t = await getTranslations('portfolio');
  return (
    <div className={`marquee ${className}`.trim()} role="group" aria-label={t('title')}>
      <div className="marquee-track">
        {[0, 1, 2].map((copy) =>
          PROJECTS.map((p, i) => (
            <article
              key={`${copy}-${i}`}
              aria-hidden={copy > 0 || undefined}
              className={[
                'marquee-item shrink-0 overflow-hidden rounded-lg bg-white text-ink shadow-[var(--shadow-pop)]',
                'mr-4 w-[78vw] max-w-[300px] sm:mr-5 sm:w-[360px] sm:max-w-none lg:w-[420px]',
                copy > 0 ? 'marquee-dup' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5 border-b border-[var(--line)] px-3 py-2">
                <i className="h-2 w-2 rounded-full bg-red/70" />
                <i className="h-2 w-2 rounded-full bg-ink/20" />
                <i className="h-2 w-2 rounded-full bg-ink/20" />
                <span className="ml-2 h-3.5 flex-1 rounded-pill bg-ink/10" />
              </div>
              <div className="relative aspect-[16/10] bg-paper-2">
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 640px) 78vw, 420px"
                  className="object-cover"
                />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  <span
                    className={['inline-block h-2 w-2 rounded-full', p.live ? 'bg-ok' : 'bg-spark'].join(
                      ' ',
                    )}
                  />
                  {p.live ? t('statusLive') : t('statusDev')} · {p.tag}
                </div>
                <h3 className="mt-2 min-h-[2.5em] font-display text-xl leading-tight">{p.title}</h3>
              </div>
            </article>
          )),
        )}
      </div>
    </div>
  );
}
