import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { FaqSearch } from '@/components/faq/FaqSearch';
import { FAQ_SERVICES, FAQ_UI, type FaqLocale } from '@/content/faqServices';
import { pageMetadata } from '@/lib/seo/metadata';

// SEO description per locale. The faq namespace only holds eyebrow/h2/items, so a
// dedicated, concise meta sentence lives here (house copy rules: no dashes, no
// comma before und/oder, Swiss ss, AI stays "AI" in every language).
const FAQ_DESC: Record<string, string> = {
  de: 'semanu beantwortet häufige Fragen zu 3D-Konfiguratoren und Unternehmenssoftware nach Mass für Schweizer KMU: Ablauf, Preise, Wartung und Sicherheit.',
  fr: 'semanu répond aux questions fréquentes sur les configurateurs 3D et les logiciels d’entreprise sur mesure pour les PME suisses: déroulement, prix, maintenance et sécurité.',
  en: 'semanu answers common questions about 3D configurators and custom business software for Swiss SMEs: process, pricing, maintenance and security.',
};

// Query-bearing titles (decoupled from the nav label "FAQ" so the <title> can
// carry the topics people actually search for).
const FAQ_TITLE: Record<string, string> = {
  de: 'FAQ: Website Abo, digitale Plattformen und AI · semanu.eu',
  fr: 'FAQ: abonnement site, plateformes digitales et AI · semanu.eu',
  en: 'FAQ: website plans, digital platforms and AI · semanu.eu',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    title: FAQ_TITLE[locale] ?? FAQ_TITLE.de,
    description: FAQ_DESC[locale] ?? FAQ_DESC.de,
    path: '/faq',
    locale,
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tnav = await getTranslations('nav');

  // The FAQ content is its own typed source (src/content/faqServices.ts), one
  // block per locale. Fall back to DE for any unexpected locale.
  const loc: FaqLocale = (['de', 'fr', 'en', 'es', 'nl'] as const).includes(
    locale as FaqLocale,
  )
    ? (locale as FaqLocale)
    : 'de';
  const services = FAQ_SERVICES[loc];

  // FAQPage structured data built from EVERY question across all services, so the
  // rich result reflects the full page.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: services.flatMap((s) =>
      s.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    ),
  };

  const ui = FAQ_UI[loc];

  return (
    <SiteShell>
      <JsonLd data={faqLd} />
      <Breadcrumb items={[{ name: 'semanu.eu', href: '/' }, { name: tnav('faq') }]} locale={locale} />
      <section className="flow-herowash-paper py-16 text-ink sm:py-20">
        <div className="container-site grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="max-w-md lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow text-navy">{ui.brandTag}</span>
            <h1 className="h1-svc mt-5">
              {ui.heroH1a}
              <br />
              {ui.heroH1b}
            </h1>
            <p className="lead mt-5 text-ink-soft">{ui.heroSub}</p>
          </div>

          <div>
            <FaqSearch ui={ui} services={services} contactHref="/kontakt" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
