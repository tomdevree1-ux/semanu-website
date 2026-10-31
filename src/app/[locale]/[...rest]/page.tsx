import { notFound } from 'next/navigation';

// Never cache: bots probe random paths (/.env, /user_secrets.yml); without this Next
// tries to write a prerender cache entry per path into the read-only release.
export const dynamic = 'force-dynamic';

// Catch-all for unknown paths under a locale: hands them to the localised
// [locale]/not-found.tsx instead of Next's bare default 404.
export default function CatchAll() {
  notFound();
}
