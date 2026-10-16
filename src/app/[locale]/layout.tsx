import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Instrument_Sans, Archivo } from 'next/font/google';
import { routing, type Locale } from '@/i18n/routing';
import { CookieBanner } from '@/components/CookieBanner';
import { Analytics } from '@/components/Analytics';
import { JsonLd } from '@/components/JsonLd';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PHONE_DISPLAY } from '@/lib/contact';
import '../globals.css';

// Self-hosted at build time by next/font; exposed as CSS vars used in globals.css @theme.
const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
  display: 'swap',
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

// Pre-render all locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amai.ch'),
    title: t('title'),
    description: t('description'),
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    other: {
      'geo.region': 'CH-BE',
      'geo.placename': 'Bern',
      'geo.position': '46.9577;7.4521',
      ICBM: '46.9577, 7.4521',
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { de: '/de', fr: '/fr', en: '/en', es: '/es', nl: '/nl', 'x-default': '/de' },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: 'amai',
      locale,
      alternateLocale: routing.locales.filter((l) => l !== locale),
      type: 'website',
      images: ['/og.png?v=3'],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og.png?v=3'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  // Enables static rendering for this locale.
  setRequestLocale(locale);
  const messages = await getMessages();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amai.ch';
  // Single canonical organisation node. Every other page references it by this
  // @id instead of repeating a partial Organization, so search + AI see one
  // unambiguous entity for amai.
  const orgId = `${siteUrl}/#organization`;
  // Dedicated Person node for E-E-A-T: AI systems and Google weigh provable
  // human expertise. The organisation links to it via founder/@id.
  const personId = `${siteUrl}/#tom-de-vree`;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: 'Tom de Vree',
    jobTitle: 'Gründer und Inhaber',
    image: `${siteUrl}/team/tom.png`,
    worksFor: { '@id': orgId },
    knowsAbout: [
      'Web design',
      'Customer portals',
      'CRM systems',
      'Marketing automation',
      'Business dashboards',
      'AI assistants',
      'Search engine optimization',
      'Generative engine optimisation',
    ],
    sameAs: ['https://www.instagram.com/amai.swiss'],
  };
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': orgId,
    name: 'amai',
    alternateName: ['amai Bern', 'amai.ch'],
    legalName: 'SEMANU BV',
    // Entity disambiguation: several unrelated companies share the "amai" token
    // (notably AMAI GmbH / am.ai in Karlsruhe, Germany). State plainly who we are
    // so search and AI models resolve amai.ch to the Swiss agency, not the others.
    disambiguatingDescription:
      'amai! (amai.ch) is a Swiss digital agency based in Bern, Switzerland, serving Swiss SMEs. It is a separate company from AMAI GmbH (am.ai) in Karlsruhe, Germany, and from other businesses named Amai.',
    founder: { '@type': 'Person', '@id': personId, name: 'Tom de Vree' },
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og.png?v=3`,
    description:
      'amai! is a digital partner from Bern for Swiss SMEs: 3D product configurators and custom business software, built AI-first, including design, build, hosting and ongoing support.',
    email: 'hello@amai.ch',
    telephone: PHONE_DISPLAY,
    areaServed: ['CH', 'Bern', 'Canton of Bern'],
    knowsAbout: [
      '3D Product Configurators',
      'Custom Business Software',
      'ERP Integration',
      'Workflow Automation',
      'AI-first Software Development',
    ],
    makesOffer: [
      '3D Product Configurators',
      'Custom Business Software',
    ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    sameAs: [
      'https://www.instagram.com/amai.swiss',
      'https://www.linkedin.com/company/137144354',
      'https://share.google/Z0fKFASrxVzu9Ko4i',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kattendijkdok-Oostkaai 9',
      postalCode: '2000',
      addressLocality: 'Antwerpen',
      addressCountry: 'BE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 51.2194, longitude: 4.4025 },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'amai',
    url: siteUrl,
    inLanguage: locale,
    publisher: { '@id': orgId },
  };

  return (
    <html
      lang={locale}
      className={`${instrument.variable} ${archivo.variable}`}
    >
      <body>
        <JsonLd data={[organization, person, website]} />
        <NextIntlClientProvider messages={messages}>
          {children}
          <WhatsAppButton />
          <CookieBanner />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
