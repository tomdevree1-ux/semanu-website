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
import { CONTACT_EMAIL, PHONE_E164 } from '@/lib/contact';
import { env } from '@/lib/env';
import { AREA_SERVED } from '@/lib/seo/area-served';
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
  // hreflang for every locale + x-default (the routing default locale).
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}`]),
  );
  languages['x-default'] = `/${routing.defaultLocale}`;
  const gscVerification = (process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? '').trim();

  return {
    metadataBase: new URL(env.siteUrl),
    title: t('title'),
    description: t('description'),
    // Only the live site is indexable; staging (acc.semanu.eu) and local are noindex.
    robots: env.isProduction
      ? {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
          'max-video-preview': -1,
        }
      : { index: false, follow: false },
    ...(gscVerification ? { verification: { google: gscVerification } } : {}),
    other: {
      'geo.region': 'BE-VAN',
      'geo.placename': 'Antwerpen',
      'geo.position': '51.2194;4.4025',
      ICBM: '51.2194, 4.4025',
    },
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: 'semanu',
      locale,
      alternateLocale: routing.locales.filter((l) => l !== locale),
      type: 'website',
      images: ['/og.png?v=4'],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og.png?v=4'],
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

  const siteUrl = env.siteUrl;
  // Single canonical organisation node. Every other page references it by this
  // @id instead of repeating a partial Organization, so search + AI see one
  // unambiguous entity for SEMANU.
  const orgId = `${siteUrl}/#organization`;
  // Dedicated Person node for E-E-A-T: the organisation links to it via founder/@id.
  const personId = `${siteUrl}/#tom-de-vree`;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: 'Tom de Vree',
    jobTitle: 'Founder and managing director',
    image: `${siteUrl}/team/tom.png`,
    worksFor: { '@id': orgId },
    knowsAbout: [
      '3D product configurators',
      'Custom business software',
      'ERP integration',
      'Workflow automation',
      'Business analysis',
    ],
    sameAs: ['https://www.linkedin.com/in/tom-de-vree-06910494/'],
  };
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': orgId,
    name: 'SEMANU',
    alternateName: ['semanu', 'semanu.eu'],
    legalName: 'SEMANU BV',
    vatID: 'BE0828.291.116',
    taxID: '0828.291.116',
    founder: { '@type': 'Person', '@id': personId, name: 'Tom de Vree' },
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og.png?v=4`,
    description:
      'SEMANU is a digital partner from Antwerp, Belgium: 3D product configurators and custom business software, built AI-first, including design, build, hosting and ongoing support.',
    email: CONTACT_EMAIL,
    telephone: PHONE_E164,
    areaServed: AREA_SERVED,
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
    sameAs: ['https://www.linkedin.com/company/semanu', 'https://www.semanu.be'],
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
    name: 'semanu',
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
