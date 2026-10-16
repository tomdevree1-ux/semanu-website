import { Fragment } from 'react';
import { Brand } from './Brand';

/** The brand word in running text; not when it is part of the domain "semanu.eu". */
const BRAND_RE = /\bsemanu\b(?!\.[a-z])/;

/**
 * Renders a translated string, swapping every literal "semanu" for the styled
 * <Brand/> wordmark. The word inherits the surrounding text colour, so it fits
 * any background. Use for body copy and headings that mention the brand. The
 * literal domain "semanu.eu" and the legal name "SEMANU BV" are left untouched.
 */
export function BrandText({ children }: { children: string }) {
  const parts = children.split(new RegExp(BRAND_RE.source, 'g'));
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? <Brand /> : null}
        </Fragment>
      ))}
    </>
  );
}
