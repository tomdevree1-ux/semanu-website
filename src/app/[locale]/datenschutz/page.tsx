import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
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
  de: 'Datenschutzerklärung von semanu: welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.',
  fr: 'Déclaration de confidentialité de semanu: quelles données nous collectons, comment nous les utilisons et quels sont vos droits.',
  en: 'Privacy policy of semanu: which data we collect, how we use it and what rights you have.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = await getLegalDoc('privacy', locale);
  return pageMetadata({
    title: `${doc?.title ?? 'Datenschutz'} · semanu.eu`,
    description: DESC[locale] ?? DESC.de,
    path: '/datenschutz',
    locale,
  });
}

function formatDate(date: string, locale: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
}

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = await getLegalDoc('privacy', locale);
  if (!doc) notFound();

  return (
    <SiteShell>
      <Breadcrumb items={[{ name: 'semanu.eu', href: '/' }, { name: doc.title }]} locale={locale} />
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
