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
// comma before und/oder, standard German ß, AI stays "AI" in every language).
const FAQ_DESC: Record<string, string> = {
  nl: 'semanu beantwoordt veelgestelde vragen over 3D-configuratoren en bedrijfssoftware op maat voor kmo’s in Europa: aanpak, prijzen, hosting in de EU en onderhoud.',
  de: 'semanu beantwortet häufige Fragen zu 3D-Konfiguratoren und Unternehmenssoftware nach Maß für KMU in Europa: Ablauf, Preise, Hosting in der EU und Wartung.',
  fr: 'semanu répond aux questions fréquentes sur les configurateurs 3D et les logiciels d’entreprise sur mesure pour les PME en Europe : déroulement, prix, hébergement dans l’UE et maintenance.',
  en: 'semanu answers common questions about 3D configurators and custom business software for SMEs in Europe: process, pricing, hosting in the EU and maintenance.',
  es: 'semanu responde a las preguntas frecuentes sobre configuradores 3D y software empresarial a medida para pymes en Europa: proceso, precios, hosting en la UE y mantenimiento.',
};

// Query-bearing titles (decoupled from the nav label "FAQ" so the <title> can
// carry the topics people actually search for).
const FAQ_TITLE: Record<string, string> = {
  nl: 'FAQ: 3D-configuratoren, bedrijfssoftware en AI · semanu.eu',
  de: 'FAQ: 3D-Konfiguratoren, Unternehmenssoftware und AI · semanu.eu',
  fr: 'FAQ : configurateurs 3D, logiciels d’entreprise et AI · semanu.eu',
  en: 'FAQ: 3D configurators, business software and AI · semanu.eu',
  es: 'FAQ: configuradores 3D, software empresarial y AI · semanu.eu',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    title: FAQ_TITLE[locale] ?? FAQ_TITLE.en,
    description: FAQ_DESC[locale] ?? FAQ_DESC.en,
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

  // FAQPage structured data built from EVERY question across all groups, so the
  // rich result always matches the visible page in this locale.
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
            <FaqSearch ui={ui} services={services} contactHref="/contact" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
