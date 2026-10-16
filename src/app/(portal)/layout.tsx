import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Instrument_Sans, Archivo } from 'next/font/google';
import { env } from '@/lib/env';
import { BackspaceNav } from '@/components/portal/BackspaceNav';
import '../globals.css';
import './portal.css';

// Same brand fonts as the marketing site (rebrand): Instrument Sans for text,
// Archivo for labels. Exposed as the CSS vars portal.css maps to --sans / --mono.
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

export const metadata: Metadata = {
  title: 'amai! portal',
  robots: { index: false, follow: false },
};

/** English-only portal root layout (isolated from the multilingual marketing site). */
export default function PortalRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-richting="helder"
      data-density="comfortable"
      data-motion="on"
      className={`${instrument.variable} ${archivo.variable}`}
    >
      <body className="antialiased">
        <BackspaceNav />
        <PortalGate>{children}</PortalGate>
      </body>
    </html>
  );
}

/** Hard-disable the whole portal via PORTAL_ENABLED without a redeploy of the
 *  marketing site (renders a 404 inside the portal's own html/body — no i18n loop). */
function PortalGate({ children }: { children: ReactNode }) {
  if (!env.portalEnabled) notFound();
  return <>{children}</>;
}
