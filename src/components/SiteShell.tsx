import { useTranslations } from 'next-intl';
import { Header } from './Header';
import { Footer } from './Footer';

/** Standard marketing-page chrome: skip link + sticky header + main + footer. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  return (
    <>
      {/* First focusable element: lets keyboard users jump past the header and
          mega menu straight to the page content. Parked off-screen above the
          viewport and slid in (as a mint pill) only on keyboard focus, so mouse
          users never see it. */}
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[200] -translate-y-20 whitespace-nowrap rounded-pill bg-mint px-4 py-2 font-semibold text-ink shadow-lg transition-transform focus:translate-y-0"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="scroll-mt-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
