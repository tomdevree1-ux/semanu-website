/**
 * The semanu wordmark for running text and headings (rebrand: no exclamation mark).
 * The word inherits the surrounding text colour, so it fits any background.
 * The literal domain "semanu.eu" stays plain (URLs, email, SEO titles, legal pages)
 * — do NOT use this there.
 */
export function Brand({ className = '' }: { className?: string }) {
  return <span className={`brand-mark ${className}`}>semanu</span>;
}
