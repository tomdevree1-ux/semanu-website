// Flow 1 — Presence & Growth (websites, email-marketing).
// A marketing/visibility focused page: strong hero with the signature visual,
// trust strip, problem cards, a building blocks band, use cases, a compact
// SEO + GEO trust block, a horizontal process, outcomes, FAQ and final CTA.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandText } from '@/components/BrandText';
import { TrackedLink } from '@/components/TrackedLink';
import { ServiceIcon } from '@/components/ServiceIcon';
import { FaqAccordion } from '@/components/FaqAccordion';
import {
  TrustStrip,
  ProblemCards,
  ChipGroup,
  ProcessSteps,
  UseCaseCards,
  OutcomeList,
  ScenarioCard,
  FinalCTA,
  RelatedServices,
  Eyebrow,
} from './blocks';
import { ServiceSignature } from './visuals';
import type { Service, ServicesContent } from '@/content/services';
import type { ServiceDetail } from '@/content/serviceDetail';

type Props = {
  service: Service;
  detail: ServiceDetail;
  content: ServicesContent;
  navServicesLabel: string;
};

export async function FlowPresenceGrowth({ service, detail, content, navServicesLabel }: Props) {
  const t = await getTranslations('serviceUi');
  const beforeAfter = service.id === 'websites';
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden flow-herowash-paper py-16 text-ink sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[3px] border-navy/12" />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="max-w-2xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
              <Link href="/" className="transition-colors hover:text-navy">
                <BrandText>{navServicesLabel}</BrandText>
              </Link>
              <span aria-hidden>/</span>
              <span className="text-navy"><BrandText>{service.title}</BrandText></span>
            </nav>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-mint">
              <ServiceIcon id={service.icon} className="h-6 w-6" />
            </span>
            <h1 className="h1-svc mt-5 text-balance"><BrandText>{detail.heroHeadline}</BrandText></h1>
            <p className="lead mt-5 text-ink-soft"><BrandText>{detail.heroSub}</BrandText></p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href={service.ctaHref}
                className="btn btn-primary"
                event="service_cta_clicked"
                eventParams={{ service: service.id, from: 'service_hero' }}
              >
                <BrandText>{service.ctaLabel}</BrandText> <span aria-hidden className="btn-arrow" />
              </TrackedLink>
              <Link href={detail.finalSecondaryHref} className="btn btn-ghost-ink">
                <BrandText>{detail.finalSecondaryLabel}</BrandText>
              </Link>
            </div>
            <div className="mt-8">
              <TrustStrip items={detail.trust} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:translate-x-6">
            <ServiceSignature id={service.id} detail={detail} />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-paper py-16 sm:py-20">
        <ProblemCards title={detail.problemTitle} intro={detail.problemIntro} cards={detail.problemCards} />
      </section>

      {/* Engine / building blocks — navy signature band */}
      <section className="bg-navy py-16 text-paper sm:py-20">
        <div className="container-site grid items-start gap-10 lg:grid-cols-2">
          <div className="max-w-xl">
            <Eyebrow tone="onDark">{t('eyebrowEngine')}</Eyebrow>
            <h2 className="mt-3 font-display leading-[0.98] tracking-[-0.025em] text-white whitespace-pre-line text-[clamp(30px,3.6vw,44px)]"><BrandText>{detail.engineTitle}</BrandText></h2>
            <p className="lead mt-4 text-paper/80"><BrandText>{detail.engineText}</BrandText></p>
          </div>
          <div className="semanu-reveal rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <ChipGroup label={detail.buildsTitle} items={service.builds} variant="onDark" />
              <div className="border-t border-white/10 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                <ChipGroup label={content.forWhoLabel} items={service.audience} variant="onDark" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-paper py-16 sm:py-20">
        <UseCaseCards
          title={detail.useCasesTitle}
          lead={detail.useCasesLead}
          cards={detail.useCases}
          variant={beforeAfter ? 'beforeAfter' : 'cards'}
        />
        {detail.example ? (
          <div className="container-site mt-10">
            <div className="semanu-reveal flex flex-col gap-5 rounded-2xl border border-mint/40 bg-hero-wash p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="max-w-2xl">
                <span className="font-mono text-xs uppercase tracking-wider text-navy"><BrandText>{detail.example.label}</BrandText></span>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft"><BrandText>{detail.example.text}</BrandText></p>
              </div>
              <Link href="/references" className="btn btn-primary shrink-0">
                <BrandText>{detail.example.linkLabel}</BrandText> <span aria-hidden className="btn-arrow" />
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {/* One recognisable scenario (PAS), gated by detail.scenario */}
      {detail.scenario ? (
        <section className="flow-soft-bandtint py-16 sm:py-20">
          <ScenarioCard scenario={detail.scenario} />
        </section>
      ) : null}

      {/* SEO + GEO trust (Flow 1 signature) */}
      <section className="flow-soft-white py-16 sm:py-20">
        <div className="container-site">
          <div className="max-w-2xl">
            <h2 className="h2 text-ink whitespace-pre-line"><BrandText>{content.seoGeo.title}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{content.seoGeo.intro}</BrandText></p>
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-paper p-6">
              <h3 className="font-semibold text-ink"><BrandText>{content.seoGeo.explainerTitle}</BrandText></h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft"><BrandText>{content.seoGeo.explainerText}</BrandText></p>
            </div>
          </div>
          <ul className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {content.seoGeo.points.map((p) => (
              <li key={p} className="semanu-reveal flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-paper p-3.5 text-sm text-ink">
                <span aria-hidden className="mt-0.5 font-bold text-navy">
                  ✓
                </span>
                <BrandText>{p}</BrandText>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Built to a published SEO + GEO standard — websites only (gated by
          detail.seoStandard, which only the websites entry sets). Sits right after
          the SEO + GEO section, where "what does base SEO mean" naturally arises. */}
      {detail.seoStandard ? (
        <section className="bg-paper py-16 sm:py-20">
          <div className="container-site">
            <div className="semanu-reveal mx-auto max-w-3xl rounded-2xl border border-mint/50 bg-hero-wash p-7 sm:p-9">
              <h2 className="h3 text-ink"><BrandText>{detail.seoStandard.heading}</BrandText></h2>
              <p className="mt-3 text-ink-soft"><BrandText>{detail.seoStandard.body}</BrandText></p>
              <a
                href={detail.seoStandard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-6"
              >
                {detail.seoStandard.linkLabel} <span aria-hidden className="btn-arrow" />
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* Optional sub-theme spotlight (gated by detail.subTheme). Keeps a searched
          term prominent on the page, e.g. "Website mit KI erstellen lassen". */}
      {detail.subTheme ? (
        <section className="flow-soft-white py-16 sm:py-20">
          <div className="container-site">
            <div className="semanu-reveal mx-auto max-w-3xl rounded-2xl border border-mint/50 bg-hero-wash p-7 sm:p-9">
              <span className="font-mono text-xs uppercase tracking-wider text-navy"><BrandText>{detail.subTheme.label}</BrandText></span>
              <h2 className="h3 mt-2 text-ink"><BrandText>{detail.subTheme.heading}</BrandText></h2>
              <p className="mt-3 leading-relaxed text-ink-soft"><BrandText>{detail.subTheme.body}</BrandText></p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Process */}
      <section className="flow-soft-bandtint py-16 sm:py-20">
        <ProcessSteps title={detail.processTitle} steps={detail.process} variant="horizontal" />
      </section>

      {/* Outcomes */}
      <section className="bg-paper py-16 sm:py-20">
        <OutcomeList title={detail.outcomesTitle} lead={detail.outcomesLead} items={service.benefits} />
      </section>

      {/* FAQ */}
      <section className="flow-soft-white py-16 sm:py-20">
        <div className="container-site">
          <Eyebrow>{t('eyebrowFaq')}</Eyebrow>
          <h2 className="h2 mt-3 text-ink"><BrandText>{detail.faqTitle}</BrandText></h2>
          <FaqAccordion items={detail.faq} />
        </div>
      </section>


      <RelatedServices currentId={service.id} services={content.services} />

      <FinalCTA
        title={detail.finalTitle}
        text={detail.finalText}
        ctaLabel={detail.finalCta}
        ctaHref={service.ctaHref}
        secondaryLabel={detail.finalSecondaryLabel}
        secondaryHref={detail.finalSecondaryHref}
        serviceId={service.id}
      />
    </>
  );
}
