import { Fragment } from 'react';
import { Brand } from './Brand';

/**
 * Renders a translated string, swapping every literal "amai!" for the styled
 * <Brand/> wordmark (rebrand: "amai", no exclamation mark). The word inherits the
 * surrounding text colour, so it fits any background. Use for body copy and
 * headings that mention the brand. The literal domain "amai.ch" is left untouched.
 */
export function BrandText({ children }: { children: string }) {
  const parts = children.split('amai!');
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
