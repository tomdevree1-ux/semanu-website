import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { BrandText } from '@/components/BrandText';
import type { LandingContent } from '@/content/landing/types';
import { LandingIcon } from './LandingIcon';
import { BookCallButton } from '@/components/BookCallButton';
import { WhyWheel } from '@/components/WhyWheel';
import { FaqAccordion } from '@/components/FaqAccordion';
import { getTranslations } from 'next-intl/server';

/**
 * Shared, designed template for the SEO landing pages.
 *
 * Layout: a brand hero with a decorative browser mock (hidden on small screens),
 * a trust stat band, a feature row that is a swipeable carousel on mobile and a
 * hover-reveal grid on desktop, a rhythm of contained section cards with a
 * bordeaux visual panel, internal-link cards and a closing CTA band.
 *
 * Server-rendered; all motion is CSS only and honours prefers-reduced-motion.
 * Mobile first: the feature detail is always visible on touch (no hover needed).
 */
export async function LandingTemplate({
  content,
  slug,
}: {
  content: LandingContent;
  slug: string;
}) {
  // Cold ad traffic converts better on the low-barrier free analysis than on
  // contact or checkout, so the landing pages lead with it as the primary CTA
  // and keep contact as the secondary action.
  const tn = await getTranslations('nav');
  const analysisLabel = tn('strategyCall');
  const num = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <SiteShell>
      {/* Hero — light hero-wash, aligned with the homepage / referenzen /
          how-it-works heroes (navy eyebrow, ink heading, mint accents). */}
      <section className="lp-hero relative overflow-hidden flow-herowash-paper py-16 text-ink sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mint/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[3px] border-navy/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-2 top-28 h-40 w-40 rounded-full border-[3px] border-navy/10"
        />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <span className="eyebrow text-navy">{content.eyebrow}</span>
            <h1 className="h1 mt-5 text-balance"><BrandText>{content.h1}</BrandText></h1>
            <p className="lead mt-5 text-ink-soft"><BrandText>{content.intro}</BrandText></p>
            {content.heroBullets && content.heroBullets.length > 0 ? (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {content.heroBullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span aria-hidden className="text-ok">
                      ✓
                    </span>
                    <BrandText>{b}</BrandText>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3.5">
              <BookCallButton className="btn btn-primary">
                {analysisLabel} <span aria-hidden className="btn-arrow" />
              </BookCallButton>
              <Link href={content.heroSecondaryCta?.href ?? '/kontakt'} className="btn btn-ghost-ink">
                {content.heroSecondaryCta?.label ?? content.ctaButton}
              </Link>
            </div>
          </div>

          {/* Decorative website mock (desktop only) */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-mint/30" />
              <div className="relative rotate-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-2xl">
                <div className="flex items-center gap-1.5 bg-ink px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-spark" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="ml-3 flex-1 rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-white/70">
                    amai.ch
                  </span>
                </div>
                <div className="space-y-3 p-6">
                  <div className="h-3 w-1/2 rounded bg-ink/80" />
                  <div className="h-2.5 w-4/5 rounded bg-paper-2" />
                  <div className="h-2.5 w-3/4 rounded bg-paper-2" />
                  <div className="mt-1 h-8 w-2/5 rounded-pill bg-red" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-20 rounded-lg bg-paper" />
                    <div className="h-20 rounded-lg bg-paper" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      {content.stats && content.stats.length > 0 ? (
        <section className="bg-paper-2 py-7 text-ink">
          <div className="container-site grid grid-cols-1 gap-5 sm:grid-cols-3">
            {content.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red/10 text-red">
                  <LandingIcon name={s.icon} />
                </span>
                <div className="leading-tight">
                  <div className="font-display text-base text-ink">{s.value}</div>
                  {s.label ? <div className="text-sm text-ink-soft"><BrandText>{s.label}</BrandText></div> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Benefit bar */}
      {content.benefits && content.benefits.length > 0 ? (
        <section className="flow-soft-paper2 py-10">
          <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {content.benefits.map((b, i) => (
              <div key={i} className="flex flex-col gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red/10 text-red">
                  <LandingIcon name={b.icon} />
                </span>
                <h3 className="font-display text-base text-ink"><BrandText>{b.title}</BrandText></h3>
                <p className="text-sm text-ink-soft"><BrandText>{b.text}</BrandText></p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Problem recognition */}
      {content.problem ? (
        <section className="flow-soft-white py-16 text-ink">
          <div className="container-site">
            <h2 className="h2 max-w-2xl"><BrandText>{content.problem.heading}</BrandText></h2>
            <p className="lead mt-4 max-w-2xl text-ink-soft"><BrandText>{content.problem.intro}</BrandText></p>
            {content.problem.cards && content.problem.cards.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {content.problem.cards.map((c, i) => (
                  <div key={i} className="rounded-lg border border-[var(--line)] bg-paper/50 p-5">
                    <h3 className="font-display text-base text-ink"><BrandText>{c.title}</BrandText></h3>
                    <p className="mt-2 text-sm text-ink-soft"><BrandText>{c.text}</BrandText></p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Solution */}
      {content.solution ? (
        <section className="bg-paper py-16 text-ink">
          <div className="container-site max-w-3xl">
            <h2 className="h2"><BrandText>{content.solution.heading}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{content.solution.body}</BrandText></p>
          </div>
        </section>
      ) : null}

      {/* What you get: a segmented pie wheel (same style as the so-funktioniert
          WhyWheel). Each feature becomes a numbered segment with its title and
          short description placed around the central amai! hub. */}
      {content.features && content.features.length > 0 ? (
        <section className="relative z-10 bg-paper py-16">
          <div className="container-site">
            {content.featuresHeading ? (
              <span className="eyebrow text-navy"><BrandText>{content.featuresHeading}</BrandText></span>
            ) : null}
            <WhyWheel points={content.features.map((f) => ({ title: f.title, text: f.text }))} />
          </div>
        </section>
      ) : null}

      {/* Process steps */}
      {content.process ? (
        <section className="flow-soft-white py-16 text-ink">
          <div className="container-site">
            <h2 className="h2 max-w-2xl"><BrandText>{content.process.heading}</BrandText></h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {content.process.steps.map((s, i) => (
                <li key={i} className="rounded-lg border border-[var(--line)] bg-paper/50 p-5">
                  <span className="font-mono text-xs text-red">{num(i)}</span>
                  <h3 className="mt-2 font-display text-base text-ink"><BrandText>{s.title}</BrandText></h3>
                  <p className="mt-2 text-sm text-ink-soft"><BrandText>{s.text}</BrandText></p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Pricing teaser */}
      {content.pricing ? (
        <section className="bg-paper py-16 text-ink">
          <div className="container-site">
            <h2 className="h2 max-w-2xl"><BrandText>{content.pricing.heading}</BrandText></h2>
            <p className="lead mt-4 max-w-2xl text-ink-soft"><BrandText>{content.pricing.intro}</BrandText></p>
            {content.pricing.cards.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {content.pricing.cards.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-6"
                >
                  <h3 className="font-display text-xl text-ink"><BrandText>{c.name}</BrandText></h3>
                  <div className="mt-2 font-display text-2xl text-red">{c.price}</div>
                  <p className="mt-2 text-sm text-ink-soft"><BrandText>{c.desc}</BrandText></p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {c.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span aria-hidden className="text-red">
                          ✓
                        </span>
                        <span><BrandText>{p}</BrandText></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            ) : null}
            <p className="mt-5 text-xs text-ink-soft"><BrandText>{content.pricing.note}</BrandText></p>
            <div className="mt-6">
              <Link href={content.pricing.cta.href} className="btn btn-onink">
                {content.pricing.cta.label} <span aria-hidden className="btn-arrow" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Why amai! */}
      {content.reasons ? (
        <section className="flow-soft-white py-16 text-ink">
          <div className="container-site">
            <h2 className="h2 max-w-2xl"><BrandText>{content.reasons.heading}</BrandText></h2>
            {content.reasons.entitySentence ? (
              <p className="lead mt-4 max-w-3xl text-ink-soft"><BrandText>{content.reasons.entitySentence}</BrandText></p>
            ) : null}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.reasons.items.map((r, i) => (
                <div key={i} className="rounded-lg border border-[var(--line)] bg-paper/50 p-5">
                  <h3 className="font-display text-base text-ink"><BrandText>{r.title}</BrandText></h3>
                  <p className="mt-2 text-sm text-ink-soft"><BrandText>{r.text}</BrandText></p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Ideal customer */}
      {content.audience ? (
        <section className="bg-paper py-16 text-ink">
          <div className="container-site max-w-3xl">
            <h2 className="h2"><BrandText>{content.audience.heading}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{content.audience.intro}</BrandText></p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {content.audience.items.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span aria-hidden className="text-red">
                    ✓
                  </span>
                  <span><BrandText>{a}</BrandText></span>
                </li>
              ))}
            </ul>
            {content.audience.closing ? (
              <p className="mt-6 text-ink-soft"><BrandText>{content.audience.closing}</BrandText></p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Section cards: contained, alternating, with a bordeaux visual panel */}
      {content.sections.length > 0 ? (
      <section className="flow-soft-white py-16 text-ink">
        <div className="container-site space-y-6">
          {content.sections.map((s, i) => {
            const flip = i % 2 === 0;
            return (
              <div
                key={i}
                className="lp-reveal grid items-stretch overflow-hidden rounded-2xl border border-[var(--line)] md:grid-cols-2"
              >
                <div className={`flex flex-col justify-center p-7 sm:p-9 ${flip ? 'md:order-2' : ''}`}>
                  <span className="font-mono text-xs text-red">{num(i)}</span>
                  <h2 className="h3 mt-2 text-ink"><BrandText>{s.heading}</BrandText></h2>
                  <p className="mt-3 text-ink-soft"><BrandText>{s.body}</BrandText></p>
                  {s.points && s.points.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      {s.points.map((p, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-ink">
                          <span aria-hidden className="text-red">
                            ✓
                          </span>
                          <span><BrandText>{p}</BrandText></span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div
                  aria-hidden
                  className={`relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] bg-paper-2 md:min-h-[260px] ${
                    flip ? 'md:order-1' : ''
                  }`}
                >
                  <span className="absolute select-none font-display text-[120px] leading-none text-ink/[0.06] md:text-[160px]">
                    {num(i)}
                  </span>
                  <span className="absolute h-40 w-40 rounded-full border border-ink/10" />
                  <span className="absolute h-60 w-60 rounded-full border border-ink/[0.06]" />
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-red/10 text-red">
                    <LandingIcon name={s.icon ?? 'default'} size={38} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      ) : null}

      {/* Internal links */}
      <section className="bg-paper py-14">
        <div className="container-site grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex h-full flex-col rounded-lg border border-[var(--line)] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red"
            >
              <span className="font-display text-ink"><BrandText>{l.label}</BrandText></span>
              {l.desc ? <span className="mt-1 flex-1 text-sm text-ink-soft"><BrandText>{l.desc}</BrandText></span> : null}
              <span className="mt-3 text-red transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      {content.faq ? (
        <section className="flow-soft-white py-16 text-ink">
          <div className="container-site">
            <h2 className="h2"><BrandText>{content.faq.heading}</BrandText></h2>
            <FaqAccordion items={content.faq.items} />
          </div>
        </section>
      ) : null}

      {/* CTA band */}
      <section className="bg-ink py-16 text-paper">
        <div className="container-site flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="h3 text-white"><BrandText>{content.ctaTitle}</BrandText></h2>
            <p className="mt-2 max-w-xl text-paper/80"><BrandText>{content.ctaText}</BrandText></p>
          </div>
          <BookCallButton className="btn btn-spark shrink-0">
            {analysisLabel} <span aria-hidden className="btn-arrow" />
          </BookCallButton>
        </div>
      </section>

      <style>{`
        .lp-hero{animation:lp-fade .6s ease-out both}
        @keyframes lp-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .lp-features{scrollbar-width:none;-ms-overflow-style:none}
        .lp-features::-webkit-scrollbar{display:none}
        @media (min-width:1024px){
          /* Premium easing for the card expand + recolour. */
          .lp-card,.lp-more{transition-duration:.55s;transition-timing-function:cubic-bezier(.22,1,.36,1)}
        }
        @supports (animation-timeline: view()){
          .lp-reveal{animation:lp-rise linear both;animation-timeline:view();animation-range:entry 0% cover 16%}
          @keyframes lp-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
        }
        @media (prefers-reduced-motion: reduce){
          .lp-hero{animation:none}
          .lp-card,.lp-more{transition:none}
          .lp-reveal{animation:none}
        }
      `}</style>
    </SiteShell>
  );
}
