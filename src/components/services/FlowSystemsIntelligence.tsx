// Flow 3 — Systems & Intelligence (business-systems, ai-assistants).
// A calm, modular, dashboard like page. Cooler base, the signature hub or
// assistant visual in the hero, a problem section, a modules section (the three
// system paths for Business Systems, or a builds + control panel for AI),
// use cases, a process, outcomes, FAQ and final CTA.

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BusinessAnalysisBox } from '@/components/BusinessAnalysisBox';
import { BrandText } from '@/components/BrandText';
import { TrackedLink } from '@/components/TrackedLink';
import { ServiceIcon } from '@/components/ServiceIcon';
import { FaqAccordion } from '@/components/FaqAccordion';
import { TrustStrip, ProblemCards, ChipGroup, ProcessSteps, UseCaseCards, OutcomeList, ScenarioCard, FinalCTA, RelatedServices, Check, Eyebrow } from './blocks';
import { ServiceSignature } from './visuals';
import type { Service, ServicesContent } from '@/content/services';
import type { ServiceDetail } from '@/content/serviceDetail';

type Props = {
  service: Service;
  detail: ServiceDetail;
  content: ServicesContent;
  navServicesLabel: string;
};

export async function FlowSystemsIntelligence({ service, detail, content, navServicesLabel }: Props) {
  const t = await getTranslations('serviceUi');
  // The business analysis box applies to the systems projects, not the AI assistants page.
  const showAnalysis = ['business-systems', 'customer-portals', 'crm'].includes(service.id);
  return (
    <>
      {/* Hero (cool base, calm visual) */}
      <section className="relative overflow-hidden flow-portfolio-paper py-16 text-ink sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[3px] border-navy/10" />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
              <Link href="/" className="transition-colors hover:text-navy">
                <BrandText>{navServicesLabel}</BrandText>
              </Link>
              <span aria-hidden>/</span>
              <span className="text-navy"><BrandText>{service.title}</BrandText></span>
            </nav>
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-mint">
              <ServiceIcon id={service.icon} className="h-6 w-6" />
              {service.id === 'ai-assistants' ? (
                <span aria-hidden className="semanu-pulse absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-white" />
              ) : null}
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
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <ServiceSignature id={service.id} detail={detail} />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-paper py-16 sm:py-20">
        <ProblemCards title={detail.problemTitle} intro={detail.problemIntro} cards={detail.problemCards} />
        {showAnalysis ? (
          <div className="container-site mt-12">
            <BusinessAnalysisBox />
          </div>
        ) : null}
      </section>

      {/* Modules / paths */}
      <section className="flow-soft-bandtint py-16 sm:py-20">
        <div className="container-site">
          <div className="max-w-2xl">
            <Eyebrow>{t('eyebrowEngine')}</Eyebrow>
            <h2 className="h2 mt-3 text-ink"><BrandText>{detail.engineTitle}</BrandText></h2>
            <p className="lead mt-4 text-ink-soft"><BrandText>{detail.engineText}</BrandText></p>
          </div>

          {service.subs ? (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {service.subs.map((sub) => (
                <div key={sub.title} className="semanu-reveal rounded-2xl border border-[var(--line)] bg-white p-6">
                  <h3 className="font-display text-lg text-ink"><BrandText>{sub.title}</BrandText></h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft"><BrandText>{sub.short}</BrandText></p>
                  <div className="mt-4 rounded-lg bg-paper p-3.5">
                    <h4 className="text-sm font-semibold text-ink"><BrandText>{sub.explainerTitle}</BrandText></h4>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft"><BrandText>{sub.explainerText}</BrandText></p>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {sub.benefits.slice(0, 4).map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] leading-snug text-ink-soft">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <BrandText>{b}</BrandText>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="semanu-reveal rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8">
                <ChipGroup label={detail.buildsTitle} items={service.builds} />
                <div className="mt-7 border-t border-[var(--line)] pt-7">
                  <ChipGroup label={content.forWhoLabel} items={service.audience} />
                </div>
              </div>
              {/* Control & safety panel (calm, no hype) */}
              <div className="rounded-2xl bg-navy p-6 text-paper sm:p-8">
                <span className="font-mono text-xs uppercase tracking-wider text-mint"><BrandText>{detail.outcomesTitle}</BrandText></span>
                <ul className="mt-4 space-y-2.5">
                  {detail.trust.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-paper">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                        <Check className="h-3 w-3" />
                      </span>
                      <BrandText>{t}</BrandText>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Builds + who it is for (only when a service uses sub-modules; the
          no-subs pages show builds + audience in the card above). */}
      {service.subs ? (
        <section className="bg-paper py-16 sm:py-20">
          <div className="container-site grid gap-10 sm:grid-cols-2">
            <ChipGroup label={detail.buildsTitle} items={service.builds} variant="outline" />
            <ChipGroup label={content.forWhoLabel} items={service.audience} variant="outline" />
          </div>
        </section>
      ) : null}

      {/* Use cases */}
      <section className="flow-soft-white py-16 sm:py-20">
        <UseCaseCards title={detail.useCasesTitle} lead={detail.useCasesLead} cards={detail.useCases} variant="cards" />
        {detail.example ? (
          <div className="container-site mt-8">
            <div className="semanu-reveal max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-6">
              <span className="font-mono text-xs uppercase tracking-wider text-navy"><BrandText>{detail.example.label}</BrandText></span>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft"><BrandText>{detail.example.text}</BrandText></p>
              <Link
                href="/referenzen"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy transition-colors hover:text-ink"
              >
                <BrandText>{detail.example.linkLabel}</BrandText> <span aria-hidden className="btn-arrow" />
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {/* One recognisable scenario (PAS), gated by detail.scenario */}
      {detail.scenario ? (
        <section className="bg-paper py-16 sm:py-20">
          <ScenarioCard scenario={detail.scenario} />
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
