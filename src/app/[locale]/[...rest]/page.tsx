import { notFound } from 'next/navigation';

// Catch-all for unknown paths under a locale: hands them to the localised
// [locale]/not-found.tsx instead of Next's bare default 404.
export default function CatchAll() {
  notFound();
}
