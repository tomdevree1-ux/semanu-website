// Shared, flow-agnostic building blocks for the individual service pages.
// These are composed differently by each of the three flow layouts, so the
// pages stay consistent without looking identical. All copy is passed in
// (translatable) and rendered as real text, so search engines and AI systems
// can read everything. Animations are CSS only (.semanu-reveal) and respect
// prefers-reduced-motion via the global rule in globals.css.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandText } from '@/components/BrandText';
import { TrackedLink } from '@/components/TrackedLink';
import { ServiceIcon } from '@/components/ServiceIcon';
import { SERVICE_SLUG, type Service } from '@/content/services';
import { RELATED_SERVICES, type DetailCard, type ServiceDetail } from '@/content/serviceDetail';

/** Small mint check, decorative. */
export function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l3.5 3.5L16 5.5" />
    </svg>
  );
}

/** Row of short promises with a mint check. Sits on a light section. */
export function TrustStrip({ items }: { items: string[] }) {
  return (
    <ul className="semanu-reveal flex flex-wrap gap-x-6 gap-y-3">
      {items.map((it) => (
        <li key={it} className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
            <Check className="h-3 w-3" />
          </span>
          <BrandText>{it}</BrandText>
        </li>
      ))}
    </ul>
  );
}

/** Small mono uppercase section label. Sits above an h2 to give every section
 *  the same premium rhythm across all service pages. */
// Eyebrows (small uppercase kicker labels) are hidden site wide by request.
// The component is kept (call sites stay valid) but renders nothing.
export function Eyebrow(_props: { children: string; tone?: 'mint' | 'onDark' }) {
  return null;
}

/** Problem section: eyebrow, heading, short intro and three cards. */
export async function ProblemCards({
  title,
  intro,
  cards,
}: {
  title: string;
  intro: string;
  cards: DetailCard[];
}) {
  const t = await getTranslations('serviceUi');
  return (
    <div className="container-site">
      <div className="max-w-2xl">
        <Eyebrow>{t('eyebrowChallenge')}</Eyebrow>
        <h2 className="h2 mt-3 text-ink"><BrandText>{title}</BrandText></h2>
        <p className="lead mt-4 text-ink-soft"><BrandText>{intro}</BrandText></p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="semanu-reveal rounded-2xl border border-[var(--line)] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[var(--shadow-pop)]"
          >
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </span>
            <h3 className="mt-4 font-display text-lg leading-tight text-ink"><BrandText>{c.title}</BrandText></h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft"><BrandText>{c.text}</BrandText></p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A labelled cluster of chips (audience / builds). Light surface. */
export function ChipGroup({
  label,
  items,
  variant = 'soft',
}: {
  label: string;
  items: string[];
  variant?: 'soft' | 'outline' | 'onDark';
}) {
  const chip =
    variant === 'onDark'
      ? 'rounded-pill border border-white/15 bg-white/8 px-3 py-1 text-[13px] leading-snug text-paper/85'
      : variant === 'outline'
        ? 'rounded-pill border border-[var(--line)] bg-white px-3 py-1 text-[13px] leading-snug text-ink-soft'
        : 'rounded-pill bg-paper-2 px-3 py-1 text-[13px] leading-snug text-ink-soft';
  const labelColor = variant === 'onDark' ? 'text-mint' : 'text-navy';
  return (
    <div>
      <span className={`font-mono text-xs uppercase tracking-wider ${labelColor}`}><BrandText>{label}</BrandText></span>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it} className={chip}>
            <BrandText>{it}</BrandText>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Process steps. Two presentations so flows can differ. */
export async function ProcessSteps({
  title,
  steps,
  variant = 'horizontal',
  onDark = false,
}: {
  title: string;
  steps: DetailCard[];
  variant?: 'horizontal' | 'vertical';
  onDark?: boolean;
}) {
  const t = await getTranslations('serviceUi');
  const eyebrow = <Eyebrow tone={onDark ? 'onDark' : 'mint'}>{t('eyebrowProcess')}</Eyebrow>;
  const headColor = onDark ? 'text-white' : 'text-ink';
  const numColor = onDark ? 'text-mint' : 'text-navy';
  const titleColor = onDark ? 'text-white' : 'text-ink';
  const textColor = onDark ? 'text-paper/75' : 'text-ink-soft';
  const cardCls = onDark
    ? 'rounded-2xl border border-[var(--line-light)] bg-white/5 p-6'
    : 'rounded-2xl border border-[var(--line)] bg-white p-6';

  if (variant === 'vertical') {
    return (
      <div className="container-site">
        {eyebrow}
        <h2 className={`h2 mt-3 ${headColor}`}><BrandText>{title}</BrandText></h2>
        <ol className="mt-8 max-w-3xl">
          {steps.map((s, i) => (
            <li key={s.title} className="semanu-reveal flex gap-5 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`font-display text-xl ${numColor}`}>{String(i + 1).padStart(2, '0')}</span>
                {i < steps.length - 1 ? (
                  <span aria-hidden className={`mt-2 w-px flex-1 ${onDark ? 'bg-white/20' : 'bg-[var(--line-strong)]'}`} />
                ) : null}
              </div>
              <div className="pb-2">
                <p className={`font-semibold ${titleColor}`}><BrandText>{s.title}</BrandText></p>
                <p className={`mt-1 text-sm leading-relaxed ${textColor}`}><BrandText>{s.text}</BrandText></p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="container-site">
      {eyebrow}
      <h2 className={`h2 mt-3 ${headColor}`}><BrandText>{title}</BrandText></h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className={`semanu-reveal ${cardCls}`}>
            <span className={`font-display text-2xl ${numColor}`}>{String(i + 1).padStart(2, '0')}</span>
            <p className={`mt-3 font-semibold ${titleColor}`}><BrandText>{s.title}</BrandText></p>
            <p className={`mt-2 text-sm leading-relaxed ${textColor}`}><BrandText>{s.text}</BrandText></p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Use case cards. Plain card grid or a before/after pairing. */
export async function UseCaseCards({
  title,
  lead,
  cards,
  variant = 'cards',
}: {
  title: string;
  lead: string;
  cards: DetailCard[];
  variant?: 'cards' | 'beforeAfter';
}) {
  const t = await getTranslations('serviceUi');
  return (
    <div className="container-site">
      <div className="max-w-2xl">
        <Eyebrow>{t('eyebrowExamples')}</Eyebrow>
        <h2 className="h2 mt-3 whitespace-pre-line text-ink"><BrandText>{title}</BrandText></h2>
        <p className="lead mt-4 text-ink-soft"><BrandText>{lead}</BrandText></p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="semanu-reveal flex flex-col rounded-2xl border border-[var(--line)] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[var(--shadow-pop)]">
            {variant === 'beforeAfter' ? (
              <>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{t('before')}</span>
                <p className="mt-1 font-semibold leading-snug text-ink"><BrandText>{c.title}</BrandText></p>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-navy">
                  {t('after')} <span aria-hidden className="btn-arrow" />
                </span>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft"><BrandText>{c.text}</BrandText></p>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg leading-tight text-ink"><BrandText>{c.title}</BrandText></h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft"><BrandText>{c.text}</BrandText></p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One recognisable SME scenario in PAS style: a short problem, the pain it
 * causes, how semanu solves it and the result. Rendered on every service page
 * (gated by detail.scenario). Light Marine + Mint card, all copy passed in and
 * rendered as real text so crawlers and AI systems read it.
 */
export async function ScenarioCard({
  scenario,
}: {
  scenario: NonNullable<ServiceDetail['scenario']>;
}) {
  const t = await getTranslations('serviceUi');
  const cols: { label: string; value: string; tone: 'problem' | 'solution' | 'result' }[] = [
    { label: t('scenarioProblem'), value: scenario.problem, tone: 'problem' },
    { label: t('scenarioSolution'), value: scenario.solution, tone: 'solution' },
    { label: t('scenarioResult'), value: scenario.result, tone: 'result' },
  ];
  const labelColor = { problem: 'text-danger', solution: 'text-navy', result: 'text-mint-deep' };
  return (
    <div className="container-site">
      <div className="max-w-2xl">
        <Eyebrow>{t('scenarioTag')}</Eyebrow>
        <h2 className="h2 mt-3 text-ink"><BrandText>{scenario.title}</BrandText></h2>
      </div>
      <div className="semanu-reveal mt-8 grid overflow-hidden rounded-2xl border border-[var(--line)] sm:grid-cols-3">
        {cols.map((c, i) => (
          <div
            key={c.label}
            className={[
              'p-6 sm:p-7',
              c.tone === 'result' ? 'bg-hero-wash' : 'bg-white',
              i > 0 ? 'border-t border-[var(--line)] sm:border-l sm:border-t-0' : '',
            ].join(' ')}
          >
            <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${labelColor[c.tone]}`}>
              {c.label}
            </span>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft"><BrandText>{c.value}</BrandText></p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Outcome list: benefits with checks, on a light surface. */
export async function OutcomeList({
  title,
  lead,
  items,
}: {
  title: string;
  lead: string;
  items: string[];
}) {
  const t = await getTranslations('serviceUi');
  return (
    <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="max-w-md">
        <Eyebrow>{t('eyebrowOutcomes')}</Eyebrow>
        <h2 className="h2 mt-3 text-ink"><BrandText>{title}</BrandText></h2>
        <p className="lead mt-4 text-ink-soft"><BrandText>{lead}</BrandText></p>
      </div>
      <ul className="grid content-start gap-x-10 self-center sm:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={it}
            className="semanu-reveal flex items-baseline gap-4 border-b border-[var(--line)] py-4"
          >
            <span className="font-display text-2xl leading-none text-navy">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-medium leading-snug text-ink"><BrandText>{it}</BrandText></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dark ink final call to action with a primary + secondary action. */
export function FinalCTA({
  title,
  text,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  serviceId,
}: {
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  serviceId: string;
}) {
  return (
    <section className="bg-ink py-16 text-paper sm:py-20">
      <div className="container-site flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="h2 text-white"><BrandText>{title}</BrandText></h2>
          <p className="mt-3 max-w-xl text-paper/80"><BrandText>{text}</BrandText></p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <TrackedLink
            href={ctaHref}
            className="btn btn-spark"
            event="service_cta_clicked"
            eventParams={{ service: serviceId, from: 'service_final' }}
          >
            <BrandText>{ctaLabel}</BrandText> <span aria-hidden className="btn-arrow" />
          </TrackedLink>
          <Link href={secondaryHref} className="btn btn-ghost">
            <BrandText>{secondaryLabel}</BrandText>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Related-service cross links (2 neighbours) shown near the foot of each service
 * page. Connects the six service pages sideways so authority spreads and AI can
 * map how the services relate. Driven by RELATED_SERVICES, keyed by service id.
 */
export async function RelatedServices({
  currentId,
  services,
}: {
  currentId: string;
  services: Service[];
}) {
  const t = await getTranslations('serviceUi');
  const items = (RELATED_SERVICES[currentId] ?? [])
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is Service => Boolean(s));
  if (items.length === 0) return null;
  return (
    <section className="bg-paper py-16 sm:py-20">
      <div className="container-site">
        <h2 className="h3 text-ink"><BrandText>{t('relatedTitle')}</BrandText></h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((s) => (
            <Link
              key={s.id}
              href={`/services/${SERVICE_SLUG[s.id] ?? s.id}`}
              className="semanu-reveal group flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-white p-6 transition-shadow hover:shadow-[var(--shadow-pop)]"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-navy transition-colors group-hover:bg-navy group-hover:text-mint">
                <ServiceIcon id={s.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-lg leading-tight text-ink transition-colors group-hover:text-navy">
                  <BrandText>{s.title}</BrandText>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft"><BrandText>{s.short}</BrandText></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

