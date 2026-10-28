import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { FaqAccordion } from '@/components/FaqAccordion';
import { FinalCTA } from '@/components/services/blocks';
import { TrackedLink } from '@/components/TrackedLink';
import { pageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';
import { getAiNativeFaq } from '@/content/aiNativeFaq';
import { getBusinessSoftware } from '@/content/businessSoftware';
import { AREA_SERVED } from '@/lib/seo/area-served';

// Business software service page. Same visual language as the 3D-configurators
// page (fonts, colours, rounded corners, cards, dark blocks). Copy per locale in
// src/content/businessSoftware.ts; the FAQ in src/content/aiNativeFaq.ts.
const CTA_HREF = '/contact?interest=business-software';

const DARK_GRADIENT =
  'radial-gradient(120% 140% at 88% 8%, rgba(147,230,190,0.20), rgba(147,230,190,0) 55%), radial-gradient(90% 120% at 0% 100%, rgba(147,230,190,0.10), rgba(147,230,190,0) 50%)';

const Arrow = () => <span aria-hidden className="btn-arrow" />;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const AI = getBusinessSoftware(locale);
  return pageMetadata({
    title: AI.metaTitle,
    description: AI.metaDescription,
    path: '/services/business-software',
    locale,
  });
}

export default async function AiNativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const AI = getBusinessSoftware(locale);
  const faq = getAiNativeFaq(locale);

  const url = `${env.siteUrl}/${locale}/services/business-software`;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'semanu.eu', item: `${env.siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: AI.serviceName, item: url },
    ],
  };
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: AI.serviceName,
    description: AI.metaDescription,
    serviceType: AI.serviceType,
    provider: { '@id': `${env.siteUrl}/#organization` },
    areaServed: AREA_SERVED,
    url,
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <SiteShell>
      <JsonLd data={[breadcrumbLd, serviceLd, faqLd]} />

      {/* ── HERO ─────────────────────────────────────────────── */}
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
              <BrandText>{AI.heroHeadline}</BrandText>
            </h1>
            <p className="mt-[clamp(22px,2.2vw,34px)] max-w-[46ch] text-[clamp(17px,1.3vw,21px)] leading-[1.6] text-ink-soft">
              <BrandText>{AI.heroSub}</BrandText>
            </p>
            <TrackedLink
              href={CTA_HREF}
              className="btn btn-primary mt-[clamp(32px,3.4vw,48px)]"
              event="service_cta_clicked"
              eventParams={{ service: 'ai-native', from: 'service_hero' }}
            >
              {AI.heroCta} <Arrow />
            </TrackedLink>
          </div>
          {/* Laptop mockup with a business-platform dashboard */}
          <div className="lg:col-span-6">
            <div className="mx-auto w-full max-w-[840px] lg:ml-auto lg:mr-0 lg:max-w-[940px] lg:translate-x-[8%]">
              <div className="rounded-[14px] bg-navy p-[1.4%] shadow-[0_34px_90px_-50px_rgba(16,35,61,0.55)]">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[7px] bg-white">
                  <Image
                    src="/hero-dashboard.jpg"
                    alt={AI.heroImageAlt}
                    fill
                    priority
                    sizes="(min-width:1024px) 42vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <div className="relative left-1/2 h-[14px] w-[112%] -translate-x-1/2 rounded-b-[12px] rounded-t-[2px] bg-gradient-to-b from-[#d8dde7] to-[#aeb6c6]">
                <span aria-hidden className="absolute left-1/2 top-0 h-[4px] w-[13%] -translate-x-1/2 rounded-b-[4px] bg-[#9aa3b5]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO — two-column card (text left, image right) ───── */}
      <section className="bg-paper pt-[clamp(4px,1.5vw,24px)] pb-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white lg:grid-cols-2">
            <div className="order-2 flex flex-col justify-center p-[clamp(28px,4vw,56px)] lg:order-1">
              <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(28px,3.2vw,46px)]">
                {AI.introTitle}
              </h2>
              <div className="mt-6 max-w-[52ch] space-y-4 text-[clamp(17px,1.4vw,21px)] leading-[1.6] text-ink-soft">
                {AI.introText.split('\n\n').map((para, i) => (
                  <p key={i}>
                    <BrandText>{para}</BrandText>
                  </p>
                ))}
              </div>
            </div>
            <div className="relative order-1 min-h-[260px] lg:order-2 lg:min-h-[460px]">
              <Image
                src="/ai-native-intro.jpg"
                alt={AI.introImageAlt}
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES THE DIFFERENCE (3 tall cards) ─────────── */}
      <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
            {AI.diffTitle}
          </h2>
          <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 lg:grid-cols-3">
            {AI.diffCards.map((c) => (
              <div
                key={c.n}
                className="relative flex min-h-[clamp(360px,34vw,460px)] flex-col overflow-hidden rounded-[28px] border border-[var(--line)] p-[clamp(28px,2.6vw,40px)]"
                style={{ backgroundImage: 'linear-gradient(180deg, #E2E8F2 0%, #ffffff 68%)' }}
              >
                {/* Card number shown as that many favicon marks (1, 2, 3). */}
                <span className="flex gap-1.5" role="img" aria-label={c.n}>
                  {Array.from({ length: Number(c.n) || 1 }, (_, k) => (
                    <svg key={k} viewBox="0 0 44 44" aria-hidden className="h-7 w-7 rounded-[6px]">
                      <rect width="44" height="44" fill="#16233D" />
                      <path d="M16 12L27 22L16 32" fill="none" stroke="#93E6BE" strokeWidth="6" strokeLinejoin="miter" />
                    </svg>
                  ))}
                </span>
                <div className="mt-[clamp(120px,15vw,200px)]">
                  <h3 className="font-display font-semibold tracking-[-0.02em] text-navy text-[clamp(22px,2vw,30px)]">
                    {c.title}
                  </h3>
                  <p className="mt-3 max-w-[34ch] text-[clamp(15px,1.2vw,17px)] leading-relaxed text-ink-soft">
                    {c.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI-FIRST (comparison) ────────────────────────────── */}
      <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <div className="max-w-[60ch]">
            <h2 className="whitespace-pre-line font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
              {AI.aiTitle}
            </h2>
            <p className="mt-6 text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-ink-soft">{AI.aiText}</p>
          </div>
          <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[var(--line)] bg-white p-[clamp(28px,3vw,48px)]">
              <span className="text-[15px] font-semibold text-ink-soft">{AI.aiOldLabel}</span>
              <ul className="mt-6 space-y-4">
                {AI.aiOld.map((x) => (
                  <li key={x} className="text-[clamp(18px,1.5vw,22px)] leading-snug text-ink-soft">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-[28px] border border-mint-deep/30 p-[clamp(28px,3vw,48px)]"
              style={{ backgroundImage: 'linear-gradient(180deg, rgba(147,230,190,0.18), rgba(147,230,190,0.04))' }}
            >
              <span className="text-[15px] font-semibold text-mint-deep">{AI.aiNewLabel}</span>
              <ul className="mt-6 space-y-4">
                {AI.aiNew.map((x) => (
                  <li key={x} className="flex items-start gap-3 text-[clamp(18px,1.5vw,22px)] font-medium leading-snug text-navy">
                    <span aria-hidden className="mt-[2px] text-mint-deep">✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULAR (4 steps + dark configurator block) ──────── */}
      <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <div className="max-w-[60ch]">
            <h2 className="whitespace-pre-line font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
              {AI.modTitle}
            </h2>
            <p className="mt-6 text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-ink-soft">{AI.modText}</p>
          </div>
          <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AI.modSteps.map((s, i) => (
              <div key={s.n} className="relative rounded-[24px] border border-[var(--line)] bg-white p-[clamp(24px,2vw,32px)]">
                <span className="font-mono text-[13px] tracking-[0.1em] text-mint-deep">{s.n}</span>
                <h3 className="mt-4 font-display text-[clamp(18px,1.5vw,22px)] font-semibold leading-tight tracking-[-0.02em] text-navy">
                  {s.title}
                </h3>
                {i < AI.modSteps.length - 1 ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-[-18px] top-1/2 hidden h-[2px] w-[18px] -translate-y-1/2 bg-[var(--line)] lg:block"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div
            className="relative mt-[clamp(32px,4vw,56px)] overflow-hidden rounded-[32px] bg-navy p-[clamp(32px,5vw,72px)] text-white sm:rounded-[40px]"
            style={{ backgroundImage: DARK_GRADIENT }}
          >
            <div className="relative max-w-[70ch]">
              <h3 className="font-display font-semibold tracking-[-0.03em] text-white text-[clamp(24px,2.8vw,40px)]">
                <BrandText>{AI.confTitle}</BrandText>
              </h3>
              <p className="mt-5 text-[clamp(17px,1.3vw,20px)] leading-[1.6] text-paper/85">{AI.confText}</p>
              <Link href="/services/3d-configurators" className="btn btn-spark mt-8">
                {AI.confCta} <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── IT TO OT (office systems connected to the shop floor) ── */}
      <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <div className="max-w-[60ch]">
            <h2 className="whitespace-pre-line font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)]">
              {AI.otTitle}
            </h2>
            {AI.otText.split('\n\n').map((para) => (
              <p key={para.slice(0, 24)} className="mt-6 text-[clamp(17px,1.3vw,20px)] leading-[1.65] text-ink-soft">
                <BrandText>{para}</BrandText>
              </p>
            ))}
          </div>
          <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 lg:grid-cols-3">
            {AI.otCards.map((c) => (
              <div key={c.title} className="rounded-[24px] border border-[var(--line)] bg-white p-[clamp(24px,2.4vw,36px)]">
                <span className="font-mono text-[13px] tracking-[0.1em] text-mint-deep">{c.label}</span>
                <h3 className="mt-4 font-display text-[clamp(20px,1.7vw,26px)] font-semibold leading-tight tracking-[-0.02em] text-navy">
                  {c.title}
                </h3>
                <p className="mt-3 text-[clamp(15px,1.15vw,17px)] leading-relaxed text-ink-soft">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site">
          <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,52px)] max-w-[22ch]">
            {faq.title}
          </h2>
          <FaqAccordion items={faq.items} />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <FinalCTA
        title={AI.finalTitle}
        text={AI.finalText}
        ctaLabel={AI.finalCta}
        ctaHref={CTA_HREF}
        secondaryLabel={AI.finalSecondary}
        secondaryHref="/services/3d-configurators"
        serviceId="ai-native"
      />
    </SiteShell>
  );
}
