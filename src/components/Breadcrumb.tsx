import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';
import { BrandText } from './BrandText';
import { JsonLd } from './JsonLd';
import { env } from '@/lib/env';

export type Crumb = { name: string; href?: string };

/** Refined chevron separator. */
function Sep() {
  return (
    <svg aria-hidden viewBox="0 0 6 10" className="h-2.5 w-1.5 shrink-0 text-mint-deep/70" fill="none">
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Site-wide premium breadcrumb: an understated, airy trail with a chevron
 * separator. Renders the matching BreadcrumbList JSON-LD alongside the visible
 * trail (so the two never drift) unless `jsonLd` is false — pass false on pages
 * that already emit their own BreadcrumbList to avoid duplicate structured data.
 * The last item is the current page (no href); "amai.ch" (home) is the first.
 */
export function Breadcrumb({
  items,
  locale,
  jsonLd = true,
  className = 'bg-paper pt-6',
}: {
  items: Crumb[];
  locale: string;
  jsonLd?: boolean;
  className?: string;
}) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${env.siteUrl}/${locale}${c.href === '/' ? '' : c.href}` } : {}),
    })),
  };

  return (
    <>
      {jsonLd ? <JsonLd data={ld} /> : null}
      <nav aria-label="Breadcrumb" className={`text-ink ${className}`}>
        <div className="container-site">
          <ol className="flex flex-wrap items-center gap-2.5 text-[12.5px] tracking-[0.01em] text-ink-soft">
            {items.map((c, i) => (
              <Fragment key={i}>
                {i > 0 ? <Sep /> : null}
                <li>
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="underline-offset-4 transition-colors hover:text-navy hover:underline"
                    >
                      <BrandText>{c.name}</BrandText>
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-navy">
                      <BrandText>{c.name}</BrandText>
                    </span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
