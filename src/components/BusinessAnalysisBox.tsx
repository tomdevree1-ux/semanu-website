import { getTranslations } from 'next-intl/server';
import { ServiceIcon } from './ServiceIcon';

/**
 * The "Business analysis" preparation note. Reused on the systems service pages
 * (business-systems, customer-portals, crm) and on the pricing page. The copy
 * lives in the `serviceUi` message namespace (analysisEyebrow/Title/Text).
 */
export async function BusinessAnalysisBox({ className = '' }: { className?: string }) {
  const t = await getTranslations('serviceUi');
  return (
    <div
      className={`semanu-reveal relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8 ${className}`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-mint" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-mint">
          <ServiceIcon id="audit" className="h-5 w-5" />
        </span>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-navy">{t('analysisEyebrow')}</span>
          <h2 className="h3 mt-1 text-ink">{t('analysisTitle')}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">{t('analysisText')}</p>
        </div>
      </div>
    </div>
  );
}
