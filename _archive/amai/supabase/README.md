# Supabase

Schema for amai.ch lives in `migrations/`. Apply them in order:

- `0001_init_leads.sql` — contact + start-modal submissions (`leads`, RLS locked).
- `0002_init_billing.sql` — Stripe billing: `customers`, `orders`, `subscriptions`
  (RLS on; `orders` locked, `customers`/`subscriptions` carry owner SELECT policies
  for the Phase-4 portal). Pairs with `/api/checkout` + `/api/stripe/webhook`.

## Apply the migration

**Option A — Supabase CLI (recommended for ongoing work)**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B — Dashboard**

Paste the contents of `migrations/0001_init_leads.sql` into the SQL Editor and run it.

## After applying

Regenerate the TypeScript types so `src/lib/types/database.ts` matches the DB:

```bash
npx supabase gen types typescript --project-id <ref> --schema public \
  > src/lib/types/database.ts
```

## Notes

- `leads` has **RLS enabled with no policies** — the anon/authenticated roles
  cannot read or write it. The `/api/leads` route inserts using the
  **service-role key** (server-only, bypasses RLS).
- For a future authenticated admin area, add an explicit `SELECT` policy scoped
  to admin users — don't open the table to `anon`.
