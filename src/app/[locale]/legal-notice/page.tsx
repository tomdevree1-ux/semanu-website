import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { getLegalDoc } from '@/lib/legal';
import { pageMetadata } from '@/lib/seo/metadata';

const UPDATED_LABEL: Record<string, string> = {
  de: 'Zuletzt aktualisiert',
  fr: 'Dernière mise à jour',
  en: 'Last updated',
};

// One-line factual meta description per locale (house copy rules: no dashes, no
// comma before und/et/and, standard German ß).
const DESC: Record<string, string> = {
  de: "Impressum von semanu: Anbieter, Kontaktdaten, Unternehmens- und Mehrwertsteuernummer sowie rechtliche Angaben der SEMANU BV in Antwerpen, Belgien.",
  fr: "Mentions légales de semanu : éditeur, coordonnées, numéros d’entreprise et de TVA et informations juridiques de SEMANU BV à Anvers, en Belgique.",
  en: "Legal notice of semanu: provider, contact details, company and VAT number and the legal information of SEMANU BV in Antwerp, Belgium.",
  nl: "Colofon van semanu: aanbieder, contactgegevens, ondernemings- en btw-nummer en de juridische gegevens van SEMANU BV in Antwerpen, België.",
  es: "Aviso legal de semanu: titular, datos de contacto, número de empresa y de IVA y la información legal de SEMANU BV en Amberes, Bélgica.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = await getLegalDoc('legal-notice', locale);
  return pageMetadata({
    title: `${doc?.title ?? 'Impressum'} · semanu.eu`,
    description: DESC[locale] ?? DESC.de,
    path: '/legal-notice',
    locale,
  });
}

function formatDate(date: string, locale: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = await getLegalDoc('legal-notice', locale);
  if (!doc) notFound();

  return (
    <SiteShell>
      <section className="bg-paper text-ink">
        <div className="container-site max-w-3xl pb-20 pt-10">
          <h1 className="h2">{doc.title}</h1>
          {doc.updated ? (
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
              {UPDATED_LABEL[locale] ?? UPDATED_LABEL.de} {formatDate(doc.updated, locale)}
            </p>
          ) : null}
          <div
            className="mt-8 space-y-4 leading-relaxed text-ink-soft [&_a]:text-red [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_li]:mt-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        </div>
      </section>
    </SiteShell>
  );
}
