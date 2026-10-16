import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SiteShell } from '@/components/SiteShell';
import { Brand } from '@/components/Brand';

// Internal style reference — keep out of search results.
export const metadata: Metadata = {
  title: 'Styleguide · amai.ch',
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: 'navy (primary)', cls: 'bg-navy', hex: '#16233D', text: 'text-white' },
  { name: 'navy-deep', cls: 'bg-navy-deep', hex: '#0E1830', text: 'text-white' },
  { name: 'ink', cls: 'bg-ink', hex: '#16233D', text: 'text-white' },
  { name: 'ink-soft', cls: 'bg-ink-soft', hex: '#5B667C', text: 'text-white' },
  { name: 'paper', cls: 'bg-paper', hex: '#F4F6FA', text: 'text-ink' },
  { name: 'paper-2', cls: 'bg-paper-2', hex: '#E9EEF6', text: 'text-ink' },
  { name: 'mint (accent)', cls: 'bg-mint', hex: '#93E6BE', text: 'text-ink' },
  { name: 'mint-deep', cls: 'bg-mint-deep', hex: '#0A7359', text: 'text-white' },
];

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SiteShell>
      <section className="bg-paper py-24 text-ink">
        <div className="container-site">
          <span className="eyebrow text-navy">Styleguide · Marine + Mint</span>
          <h1 className="h2 mt-4 max-w-2xl">
            <Brand />’s design tokens
          </h1>
          <p className="lead mt-4 text-ink-soft">
            The brand colours below are Tailwind v4 theme tokens (e.g.{' '}
            <code className="font-mono text-sm">bg-navy</code>,{' '}
            <code className="font-mono text-sm">text-ink</code>); the typefaces load
            via <code className="font-mono text-sm">next/font</code>.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <div
                key={s.name}
                className={`${s.cls} ${s.text} flex h-28 flex-col justify-between rounded-card p-4`}
              >
                <span className="font-mono text-xs uppercase tracking-wider">{s.name}</span>
                <span className="font-mono text-sm">{s.hex}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-3 border-t border-[var(--line)] pt-8">
            <p className="font-display text-4xl font-semibold tracking-tight">Instrument Sans · display</p>
            <p className="font-sans text-xl">Instrument Sans · body &amp; UI</p>
            <p className="font-mono text-sm uppercase tracking-widest">
              Archivo · labels · eyebrows
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-[var(--line)] pt-8">
            <span className="btn btn-primary">btn-primary</span>
            <span className="btn btn-onink">btn-onink</span>
            <span className="btn btn-spark">btn-spark</span>
            <span className="btn" style={{ color: 'var(--color-ink)' }}>btn (outline)</span>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
