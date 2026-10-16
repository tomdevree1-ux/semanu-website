// Flow 2 — Automation & Operations (marketing-automation, booking).
// A flow/process focused page. It leads with the problem on a dark navy band,
// then explains the trigger -> action -> result idea beside the signature flow
// visual, lists what amai sets up, use cases by business type, a vertical
// process timeline, outcomes, FAQ and final CTA.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandText } from '@/components/BrandText';
import { TrackedLink } from '@/components/TrackedLink';
import { ServiceIcon } from '@/components/ServiceIcon';
import { FaqAccordion } from '@/components/FaqAccordion';
import { TrustStrip, ProblemCards, ChipGroup, ProcessSteps, UseCaseCards, OutcomeList, ScenarioCard, FinalCTA, RelatedServices, Eyebrow } from './blocks';
import { ServiceSignature, WorkflowHeroFlow } from './visuals';
import type { Service, ServicesContent } from '@/content/services';
import type { ServiceDetail } from '@/content/serviceDetail';

type Props = {
  service: Service;
  detail: ServiceDetail;
  content: ServicesContent;
  navServicesLabel: string;
};

export async function FlowAutomationOperations({ service, detail, content, navServicesLabel }: Props) {
  const t = await getTranslations('serviceUi');
  return (
    <>
      {/* Hero (text forward) */}
      <section className="relative overflow-hidden flow-herowash-paper py-16 text-ink sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full border-[3px] border-navy/12" />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
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
          {detail.heroFlow ? (
            <WorkflowHeroFlow steps={detail.heroFlow} />
          ) : (
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <ServiceSignature id={service.id} detail={detail} />
            </div>
          )}
        </div>
      </section>

      {/* Problem (light, matching the websites layout) */}
      <section className="bg-paper py-16 sm:py-20">
        <ProblemCards title={detail.problemTitle} intro={detail.problemIntro} cards={detail.problemCards} />
      </section>

      {/* Engine: trigger -> action -> result — navy band (the signature visual
          now lives in the hero, so this stays a clean single column) */}
      <section className="bg-navy py-16 text-paper sm:py-20">
        <div className="container-site max-w-3xl">
          <Eyebrow tone="onDark">{t('eyebrowEngine')}</Eyebrow>
          <h2 className="h2 mt-3 text-white"><BrandText>{detail.engineTitle}</BrandText></h2>
          <p className="lead mt-4 text-paper/80"><BrandText>{detail.engineText}</BrandText></p>
          <div className="mt-8">
            <ChipGroup label={detail.buildsTitle} items={service.builds} variant="onDark" />
          </div>
        </div>
      </section>

      {/* Marketing automation spotlight (Workflow Automation page only, gated by
          detail.subTheme). Keeps the searched term prominent on the renamed page. */}
      {detail.subTheme ? (
        <section className="flow-soft-white py-16 sm:py-20">
          <div className="container-site">
            <div className="amai-reveal mx-auto max-w-3xl rounded-2xl border border-mint/50 bg-hero-wash p-7 sm:p-9">
              <span className="font-mono text-xs uppercase tracking-wider text-navy"><BrandText>{detail.subTheme.label}</BrandText></span>
              <h2 className="h3 mt-2 text-ink"><BrandText>{detail.subTheme.heading}</BrandText></h2>
              <p className="mt-3 leading-relaxed text-ink-soft"><BrandText>{detail.subTheme.body}</BrandText></p>
              {detail.subTheme.cards ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {detail.subTheme.cards.map((c) => (
                    <div key={c.title} className="rounded-xl border border-[var(--line)] bg-white p-5">
                      <h3 className="font-display text-base leading-tight text-ink"><BrandText>{c.title}</BrandText></h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft"><BrandText>{c.text}</BrandText></p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Use cases */}
      <section className="flow-soft-bandtint py-16 sm:py-20">
        <UseCaseCards title={detail.useCasesTitle} lead={detail.useCasesLead} cards={detail.useCases} variant="cards" />
      </section>

      {/* One recognisable scenario (PAS), gated by detail.scenario */}
      {detail.scenario ? (
        <section className="flow-soft-white py-16 sm:py-20">
          <ScenarioCard scenario={detail.scenario} />
        </section>
      ) : null}

      {/* Who it is for */}
      <section className="bg-paper py-16 sm:py-20">
        <div className="container-site">
          <ChipGroup label={content.forWhoLabel} items={service.audience} variant="outline" />
        </div>
      </section>

      {/* Process (vertical timeline) */}
      <section className="flow-soft-white py-16 sm:py-20">
        <ProcessSteps title={detail.processTitle} steps={detail.process} variant="vertical" />
      </section>

      {/* Outcomes */}
      <section className="flow-soft-bandtint py-16 sm:py-20">
        <OutcomeList title={detail.outcomesTitle} lead={detail.outcomesLead} items={service.benefits} />
      </section>

      {/* FAQ */}
      <section className="bg-paper py-16 sm:py-20">
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
