# semanu.eu

Public website of SEMANU (SEMANU BV, Antwerp) at https://www.semanu.eu: 3D configurators,
business software and consultancy. Five languages (nl, en, de, fr, es).

Working context and house rules: [CLAUDE.md](./CLAUDE.md). Deploy runbook (Dutch):
[deploy/README-DEPLOY.md](./deploy/README-DEPLOY.md).

## Stack

Next.js 15 (App Router, TypeScript, standalone output) · next-intl · Tailwind CSS v4 (design
tokens in `src/app/globals.css`) · zod · vitest. No database of its own: form submissions are
forwarded server side to the SEMANU Supabase edge function `submit-contact`.

## Quick start

```bash
npm ci
cp .env.example .env.local   # SITE_ENV=staging, SEMANU_SUPABASE_ANON_KEY of the staging project
npm run dev                  # http://localhost:3000
```

| Goal | Command |
|---|---|
| Type check | `npm run typecheck` |
| Unit tests | `npm test` |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| Deploy staging / live | `./deploy/deploy.sh acc` / `./deploy/deploy.sh live` |
| IndexNow ping (after a live deploy) | `INDEXNOW_KEY=... npm run indexnow` |

## Layout

- `src/app/[locale]/` pages; `src/app/api/leads` form endpoint; `robots.ts`, `sitemap.ts`,
  `manifest.ts`, `llms.txt/route.ts`.
- `src/messages/*.json` short UI copy (five locales in parity); `src/content/` long typed copy
  (services, landing pages, references, FAQ); `content/blog` and `content/legal` markdown.
- `src/lib/env.ts` environment access (`SITE_ENV`, site URL, SEMANU Supabase);
  `src/lib/semanu-leads.ts` mapping to `submit-contact`.
- `deploy/` Caddyfile, systemd units, deploy script, build env files.
- `_archive/` material from the amai.ch era kept for reference; not part of the site.

## Environments

| | Live | Staging |
|---|---|---|
| URL | https://www.semanu.eu | https://acc.semanu.eu (password) |
| `SITE_ENV` | `production` | `staging` |
| Indexing | yes | `noindex` (robots.txt, meta, `X-Robots-Tag`) |
| Leads go to | SEMANU prod Supabase | SEMANU staging Supabase |
