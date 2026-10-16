import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { TrackedLink } from '@/components/TrackedLink';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { env } from '@/lib/env';
import { pageMetadata } from '@/lib/seo/metadata';
import { REFERENZEN, REF_IMAGES, type RefLocale } from '@/content/referenzen';

function pick(locale: string): RefLocale {
  return (['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as RefLocale;
}

/** First sentence of a longer text, as a concise card teaser. */
function teaser(text: string): string {
  const m = text.match(/^(.*?[.!?])(\s|$)/);
  return (m ? m[1] : text).trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = REFERENZEN[pick(locale)];
  return pageMetadata({
    title: `${c.title} · amai.ch`,
    description: c.description,
    path: '/referenzen',
    locale,
  });
}

export default async function ReferenzenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = REFERENZEN[pick(locale)];

  // Manual display order; any case not listed keeps its authored order after these.
  const ORDER = ['Poortland', 'amai! interactieve kiosk'];
  const HIDDEN = ['3D Configurator', 'amai.ch', 'SEMANU'];
  const rank = (name: string) => {
    const i = ORDER.indexOf(name);
    return i === -1 ? ORDER.length : i;
  };
  const cases = [...c.cases].filter((x) => !HIDDEN.includes(x.name)).sort((a, b) => rank(a.name) - rank(b.name));

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: cases.map((cs, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cs.name,
      ...(cs.href ? { url: cs.href } : {}),
    })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'amai.ch', item: `${env.siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: c.h1.replace(/\n/g, ' '), item: `${env.siteUrl}/${locale}/referenzen` },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={[itemListLd, breadcrumbLd]} />

      {/* Hero — full-bleed light photo (tablet). Navy text on the bright left side,
          with a soft light wash for legibility and a scroll-down affordance. */}
      <section className="relative -mt-[72px] flex min-h-[520px] items-end overflow-hidden text-ink md:min-h-0 md:aspect-[16/9]">
        <Image
          src="/referenties-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(244,246,250,0.95) 0%, rgba(244,246,250,0.8) 42%, rgba(244,246,250,0.2) 68%, rgba(244,246,250,0) 82%)',
          }}
        />
        <div className="container-site relative pb-14 pt-[calc(72px+3rem)]">
          <h1 className="max-w-[20ch] whitespace-pre-line font-display font-semibold leading-[1.0] tracking-[-0.04em] text-navy text-[clamp(38px,5vw,76px)]">
            <BrandText>{c.h1}</BrandText>
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
            <BrandText>{c.intro}</BrandText>
          </p>
          <a
            href="#cases"
            aria-label={c.heroViewProjects}
            className="mt-9 inline-flex h-12 w-12 items-center justify-center rounded-full border border-navy/30 text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2.5v11M3.5 9l4.5 4.5L12.5 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      <Breadcrumb
        items={[{ name: 'amai.ch', href: '/' }, { name: c.h1.replace(/\n/g, ' ') }]}
        locale={locale}
        jsonLd={false}
        className="bg-paper pt-8"
      />

      {/* Cases — two-column grid: image, category, title, one-line teaser. */}
      <section id="cases" className="bg-paper py-[clamp(56px,9vh,110px)] text-ink">
        <div className="container-site">
          <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2">
            {cases.map((cs) => {
              const img = REF_IMAGES[cs.name]?.[0] ?? null;
              const href = cs.href ?? '/kontakt';
              const external = href.startsWith('http');
              const inner = (
                <>
                  <div className="relative aspect-[16/11] overflow-hidden rounded-[20px] bg-paper-2">
                    {img ? (
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 768px) 46vw, 100vw"
                        className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <span className="mt-6 block font-mono text-xs font-bold uppercase tracking-[0.14em] text-mint-deep">
                    {cs.tag}
                  </span>
                  <h2 className="mt-2.5 font-mono text-[24px] font-extrabold leading-tight tracking-[-0.015em] text-navy sm:text-[28px]">
                    <BrandText>{cs.name}</BrandText>
                  </h2>
                  <p className="mt-2.5 max-w-[46ch] leading-relaxed text-ink-soft">
                    <BrandText>{teaser(cs.result)}</BrandText>
                  </p>
                </>
              );
              return external ? (
                <a key={cs.name} href={href} target="_blank" rel="noopener noreferrer" className="group block">
                  {inner}
                </a>
              ) : (
                <Link key={cs.name} href={href} className="group block">
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink py-16 text-paper">
        <div className="container-site flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="h3 text-white">
              <BrandText>{c.ctaTitle}</BrandText>
            </h2>
            <p className="mt-2 max-w-xl text-paper/80">
              <BrandText>{c.ctaText}</BrandText>
            </p>
          </div>
          <TrackedLink
            href="/kontakt"
            className="btn btn-spark shrink-0"
            event="contact_cta_clicked"
            eventParams={{ from: 'referenzen' }}
          >
            {c.ctaButton} <span aria-hidden className="btn-arrow" />
          </TrackedLink>
        </div>
      </section>
    </SiteShell>
  );
}
