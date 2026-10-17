// Unified service-page layout (2026-10) in the iO-inspired structure, semanu style:
// visible breadcrumb, a navy hero banner with a trust strip, an answer-first
// definition block (GEO), a statement + author card, a big Q&A accordion (the
// questions are real headings and mirror the FAQPage schema emitted by the page),
// a "why work with us" card trio, related-service links and a final CTA.
// All four services route here; content comes from services.ts + serviceDetail.ts.

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { BrandText } from '@/components/BrandText';
import { TrackedLink } from '@/components/TrackedLink';
import { FaqAccordion } from '@/components/FaqAccordion';
import { DemoNotice } from '@/components/configurator/DemoNotice';
import { FinalCTA } from './blocks';
import type { Service, ServicesContent } from '@/content/services';
import type { ServiceDetail } from '@/content/serviceDetail';

type Props = {
  service: Service;
  detail: ServiceDetail;
  content: ServicesContent;
  navServicesLabel: string;
  locale: string;
};

const Arrow = () => <span aria-hidden className="btn-arrow" />;

// Live cabinet configurator per site language (hosted on SEMANU, same look as semanu).
// The "#e30" hash is an empty default state that makes the configurator skip its
// landing page and open straight on the configurator screen.
const CONFIGURATOR_URL: Record<string, string> = {
  nl: 'https://www.semanu.be/kastenconfigurator',
  fr: 'https://www.semanu.be/configurateurdressing',
  en: 'https://www.semanu.be/cabinetconfigurator',
  de: 'https://www.semanu.be/schrankplaner',
  es: 'https://www.semanu.be/configuradorarmarios',
};

export function ServiceFlow({ service, detail, content, navServicesLabel, locale }: Props) {
  const isConfigurator = service.id === '3d-configurators';
  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────────
          3D-configurators: full-bleed hero like the homepage — the background
          image runs up behind the sticky transparent header (-mt-[72px]), with
          the breadcrumb sitting over the image. Text left + the LIVE configurator
          running inside a clean laptop mockup (the iframe renders at 2x logical
          width and is scaled down, so the desktop two-panel layout shows crisply
          at any size). Other services: a quiet editorial single text column. */}
      {isConfigurator ? (
        <section className="relative isolate -mt-[72px] flex min-h-[calc(84vh+72px)] flex-col overflow-hidden bg-paper pb-[clamp(48px,7vw,100px)] pt-[72px] text-ink">
          <div aria-hidden className="absolute inset-0 -z-10">
            <Image
              src="/service-heroes/3d-configurators-bg.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="hero-kenburns object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
          </div>
          <div className="container-site grid w-full flex-1 items-center gap-x-16 gap-y-[clamp(40px,6vw,64px)] lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h1 className="max-w-[15ch] font-display font-semibold leading-[1.0] tracking-[-0.035em] text-navy text-[clamp(38px,4.2vw,72px)]">
                <BrandText>{detail.heroHeadline}</BrandText>
              </h1>
              <p className="mt-[clamp(22px,2.2vw,34px)] max-w-[46ch] text-[clamp(17px,1.3vw,21px)] leading-[1.6] text-ink-soft">
                <BrandText>{detail.heroSub}</BrandText>
              </p>
              <TrackedLink
                href={service.ctaHref}
                className="btn btn-primary mt-[clamp(32px,3.4vw,48px)]"
                event="service_cta_clicked"
                eventParams={{ service: service.id, from: 'service_hero' }}
              >
                <BrandText>{service.ctaLabel}</BrandText> <Arrow />
              </TrackedLink>
            </div>

            {/* Laptop mockup with the live configurator as its screen. Pushed to
                the right (and allowed to bleed past the edge, clipped by the
                section's overflow-hidden) so the text column gets more room. */}
            <div className="lg:col-span-6">
              <div className="mx-auto w-full max-w-[840px] lg:ml-auto lg:mr-0 lg:max-w-[940px] lg:translate-x-[8%]">
                <div className="rounded-[14px] bg-navy p-[1.4%] shadow-[0_34px_90px_-50px_rgba(16,35,61,0.55)]">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[7px] bg-white">
                    <iframe
                      src="/configurator-tafel/index.html"
                      title="semanu tafelconfigurator"
                      loading="lazy"
                      className="absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
                    />
                  </div>
                </div>
                <div className="relative left-1/2 h-[14px] w-[112%] -translate-x-1/2 rounded-b-[12px] rounded-t-[2px] bg-gradient-to-b from-[#d8dde7] to-[#aeb6c6]">
                  <span aria-hidden className="absolute left-1/2 top-0 h-[4px] w-[13%] -translate-x-1/2 rounded-b-[4px] bg-[#9aa3b5]" />
                </div>
              </div>
              <DemoNotice locale={locale} className="mx-auto mt-6 max-w-[840px] lg:ml-auto lg:mr-0" />
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-paper pt-[clamp(20px,3.2vw,44px)] pb-[clamp(58px,8.8vw,120px)] text-ink">
          <div className="container-site">
            <h1 className={`whitespace-pre-line font-display font-semibold leading-[1.0] tracking-[-0.035em] text-navy text-[clamp(44px,6vw,104px)] max-w-[16ch]`}>
              <BrandText>{detail.heroHeadline}</BrandText>
            </h1>
            <p className="mt-[clamp(24px,2.4vw,36px)] max-w-[48ch] text-[clamp(18px,1.35vw,22px)] leading-[1.6] text-ink-soft">
              <BrandText>{detail.heroSub}</BrandText>
            </p>
            <TrackedLink
              href={service.ctaHref}
              className="btn btn-primary mt-[clamp(32px,3.4vw,48px)]"
              event="service_cta_clicked"
              eventParams={{ service: service.id, from: 'service_hero' }}
            >
              <BrandText>{service.ctaLabel}</BrandText> <Arrow />
            </TrackedLink>
          </div>
        </section>
      )}

      {/* ── DEFINITION — answer-first (GEO) ──────────────────────────
          Configurator: a navy feature card (same treatment as the homepage
          "AI-first" banner) that answers "what is a 3D product configurator".
          Other services: a quiet editorial accent block. No top border under
          the configurator hero: it fades into paper, so a rule there would
          look stray. */}
      <section className={`bg-paper text-ink${isConfigurator ? ' pt-[clamp(4px,1.5vw,24px)] pb-[clamp(72px,11vw,150px)]' : ' border-t border-[var(--line)] py-[clamp(72px,11vw,150px)]'}`}>
        <div className="container-site">
          {isConfigurator ? (
            <div
              className="relative overflow-hidden rounded-[32px] bg-navy p-[clamp(32px,5vw,72px)] text-white sm:rounded-[40px]"
              style={{
                backgroundImage:
                  'radial-gradient(120% 140% at 88% 8%, rgba(147,230,190,0.20), rgba(147,230,190,0) 55%), radial-gradient(90% 120% at 0% 100%, rgba(147,230,190,0.10), rgba(147,230,190,0) 50%)',
              }}
            >
              <div className="relative flex gap-[clamp(20px,2.4vw,40px)]">
                <span
                  aria-hidden
                  className="w-[4px] shrink-0 self-stretch rounded-full"
                  style={{ background: 'linear-gradient(180deg, #93E6BE 0%, #0A7359 100%)' }}
                />
                <div>
                  <h2 className="font-display font-semibold tracking-[-0.03em] text-white text-[clamp(28px,3.4vw,48px)] lg:whitespace-nowrap">
                    <BrandText>{service.explainerTitle}</BrandText>
                  </h2>
                  <div className="mt-6 max-w-[70ch] space-y-4 text-[clamp(18px,1.4vw,23px)] leading-[1.58] text-paper/85">
                    {service.explainerText.split('\n\n').map((para, i) => (
                      <p key={i}>
                        <BrandText>{para}</BrandText>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[60ch] border-l-2 border-mint pl-[clamp(20px,2vw,32px)]">
              <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(26px,3vw,42px)]">
                <BrandText>{service.explainerTitle}</BrandText>
              </h2>
              <div className="mt-6 space-y-4 text-[clamp(18px,1.4vw,23px)] leading-[1.58] text-ink-soft">
                {service.explainerText.split('\n\n').map((para, i) => (
                  <p key={i}>
                    <BrandText>{para}</BrandText>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FLOW TILES — big rounded cards side by side ─────────────
          Used by the configurator ("Van productkeuze tot concrete aanvraag",
          4 tiles). Same card size, spacing, radius; the column count follows the
          number of tiles. On mobile the cards stack. */}
      {detail.flow && (
        <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
          <div className="container-site">
            <div className="max-w-[60ch]">
              <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)] lg:whitespace-nowrap">
                <BrandText>{detail.flow.title}</BrandText>
              </h2>
            </div>
            <div
              className={`mt-[clamp(32px,4vw,56px)] grid gap-6 sm:grid-cols-2 ${
                detail.flow.tiles.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
              }`}
            >
              {detail.flow.tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="flex flex-col rounded-[24px] border border-[var(--line)] bg-white p-[clamp(24px,2vw,32px)]"
                >
                  <h3 className="font-display text-[clamp(19px,1.5vw,23px)] font-semibold leading-tight tracking-[-0.02em] text-navy">
                    {tile.label}
                  </h3>
                  <p className={`${isConfigurator ? 'mt-6' : 'mt-3'} text-[clamp(17px,1.6vw,20px)] leading-relaxed text-ink-soft`}>
                    <BrandText>{tile.text}</BrandText>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3D CONFIGURATOR DEMO VIDEO — drop the clip at /public/configurator-demo.mp4
          (optional poster at /public/configurator-demo-poster.jpg). ── */}
      {isConfigurator && (
        <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
          <div className="container-site">
            <DemoNotice locale={locale} className="mb-4" />
            <div className="relative w-full overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-[0_34px_90px_-50px_rgba(16,35,61,0.55)]">
              <iframe
                src={`${CONFIGURATOR_URL[locale] ?? CONFIGURATOR_URL.nl}/#e30`}
                title="3D configurator"
                loading="lazy"
                allow="fullscreen"
                className="block h-[clamp(560px,80vh,880px)] w-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── EXPORT DOCUMENTS — showcase under the flow tiles (configurator):
          intro + three document cards (quote / drawing / parts list). ── */}
      {detail.exports && (
        <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
          <div className="container-site">
            <h2 className="whitespace-pre-line font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
              <BrandText>{detail.exports.title}</BrandText>
            </h2>
            <p className="mt-6 max-w-[68ch] text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-ink-soft">
              <BrandText>{detail.exports.intro}</BrandText>
            </p>
            <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 md:grid-cols-3">
              {detail.exports.docs.map((doc) => (
                <div
                  key={doc.label}
                  className="flex flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-white"
                >
                  <div className="relative aspect-[3/4] w-full border-b border-[var(--line)] bg-paper">
                    <Image src={doc.img} alt={doc.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-contain p-4" />
                  </div>
                  <div className="p-[clamp(20px,1.6vw,28px)]">
                    <span className="font-mono text-[12px] font-medium tracking-[0.12em] text-mint-deep">
                      {doc.label}
                    </span>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">
                      <BrandText>{doc.caption}</BrandText>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── INTEGRATIONS — band listing the systems a configurator connects to ── */}
      {detail.integrations && (
        <section className="border-t border-white/10 bg-navy py-[clamp(72px,11vw,150px)] text-white">
          <div className="container-site grid gap-x-16 gap-y-[clamp(32px,4vw,56px)] lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="whitespace-pre-line font-display font-semibold tracking-[-0.03em] text-white text-[clamp(30px,3.4vw,52px)]">
                <BrandText>{detail.integrations.title}</BrandText>
              </h2>
              <p className="mt-6 max-w-[46ch] text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-paper/80">
                <BrandText>{detail.integrations.intro}</BrandText>
              </p>
            </div>
            <div className="lg:col-span-7 lg:pt-2">
              <ul className="flex flex-wrap gap-3">
                {detail.integrations.items.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-[clamp(16px,1.5vw,22px)] py-[clamp(10px,1vw,14px)] text-[clamp(15px,1.2vw,18px)] font-medium text-white"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mint" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Continuous logo band of known platforms (soft fade at both edges). */}
              {detail.integrations.logos && detail.integrations.logos.length > 0 && (
                <div
                  className="semanu-marquee relative mt-[clamp(32px,4vw,56px)] overflow-hidden"
                  style={{
                    maskImage:
                      'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
                    WebkitMaskImage:
                      'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
                  }}
                >
                  <div className="semanu-marquee-track flex w-max items-center gap-[clamp(32px,4vw,64px)] pr-[clamp(32px,4vw,64px)]">
                    {[...detail.integrations.logos, ...detail.integrations.logos].map((logo, i) => (
                      <span
                        key={`${logo.name}-${i}`}
                        aria-hidden={i >= detail.integrations!.logos!.length}
                        className="shrink-0 whitespace-nowrap font-display text-[clamp(18px,1.7vw,26px)] font-semibold tracking-[-0.02em] text-white/45 transition-colors duration-200 hover:text-white/80"
                      >
                        {logo.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo.src} alt={logo.name} className="h-[clamp(20px,1.7vw,30px)] w-auto opacity-70" />
                        ) : (
                          logo.name
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── TAKEAWAYS — compact rows, question bold + answer after (no cards) ── */}
      {detail.takeaways && (
        <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
          <div className="container-site">
            <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
              <BrandText>{detail.takeaways.title}</BrandText>
            </h2>
            <div className="mt-[clamp(28px,3vw,44px)] max-w-[72ch] divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {detail.takeaways.items.map((it) => (
                <p key={it.q} className="py-5 text-[clamp(17px,1.4vw,20px)] leading-[1.6] text-ink-soft">
                  <strong className="font-semibold text-navy">{it.q}</strong> {it.a}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STATEMENT — editorial split (heading left, body right). Skipped for
          the configurator, whose flow tiles take its place. */}
      {!isConfigurator && (
        <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
          <div className="container-site grid gap-x-16 gap-y-8 lg:grid-cols-12">
            <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)] max-w-[15ch] whitespace-pre-line lg:col-span-6">
              <BrandText>{detail.engineTitle}</BrandText>
            </h2>
            <div className="lg:col-span-6 lg:pt-2">
              <p className="max-w-[56ch] text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-ink-soft">
                <BrandText>{detail.engineText}</BrandText>
              </p>
              <Link href="/contact" className="btn btn-ghost-ink mt-[clamp(28px,3vw,40px)]">
                {content.ctaContact} <Arrow />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Q&A — title on top, big equal-size cards below (mirror FAQPage) ── */}
      <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,52px)] max-w-[22ch]">
            <BrandText>{detail.faqTitle}</BrandText>
          </h2>
          <FaqAccordion items={detail.faq} />
        </div>
      </section>

      {/* ── USE CASES — editorial numbered rows (no cards). ── */}
      <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)] max-w-[20ch]">
            <BrandText>{detail.useCasesTitle}</BrandText>
          </h2>
          <div className="mt-[clamp(44px,5vw,72px)] grid gap-x-16 gap-y-[clamp(40px,4vw,56px)] md:grid-cols-3">
            {(isConfigurator ? detail.useCases : detail.useCases.slice(0, 3)).map((c, i) => (
              <div key={c.title} className="border-t border-[var(--line)] pt-6">
                <span className="font-mono text-[13px] tracking-[0.08em] text-mint-deep">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 font-display text-[clamp(20px,1.6vw,24px)] font-semibold tracking-[-0.02em] text-navy">
                  <BrandText>{c.title}</BrandText>
                </h3>
                <p className="mt-3 max-w-[40ch] text-[15.5px] leading-relaxed text-ink-soft">
                  <BrandText>{c.text}</BrandText>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
