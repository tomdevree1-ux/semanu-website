/**
 * Centralised, lazily-validated environment access.
 * Getters throw only when *accessed* with a missing value, so the project
 * still builds before `.env.local` is filled in. NEXT_PUBLIC_* references are
 * written out literally so Next can inline them in the client bundle.
 */

/** Canonical public origin of the live site (no trailing slash). */
export const LIVE_SITE_URL = 'https://www.semanu.eu';

/** Supabase projects of the SEMANU back end (leads board, create_lead). */
const SEMANU_SUPABASE = {
  production: 'https://bjpcgqejprkdqqohhere.supabase.co',
  staging: 'https://kiiyvctcfvfrivpjsfjo.supabase.co',
} as const;

export const env = {
  /**
   * Deployment environment: 'production' (www.semanu.eu) or 'staging'
   * (acc.semanu.eu). Staging is noindex everywhere and posts leads to the
   * SEMANU staging project. Anything other than 'production' counts as staging,
   * so a forgotten variable can never index a test server.
   */
  get siteEnv(): 'production' | 'staging' {
    return process.env.SITE_ENV === 'production' ? 'production' : 'staging';
  },
  get isProduction(): boolean {
    return this.siteEnv === 'production';
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? LIVE_SITE_URL).replace(/\/+$/, '');
  },

  // ── Contact form → SEMANU Supabase edge function submit-contact ────────────
  /** Base URL of the SEMANU Supabase project. Override with SEMANU_SUPABASE_URL. */
  get semanuSupabaseUrl() {
    const override = (process.env.SEMANU_SUPABASE_URL ?? '').trim();
    if (override) return override.replace(/\/+$/, '');
    return this.isProduction ? SEMANU_SUPABASE.production : SEMANU_SUPABASE.staging;
  },
  /** Public anon key of that project (sent as apikey + Bearer). Server side only
   *  here, but it is a publishable key, not a secret. Empty = form fails cleanly. */
  get semanuSupabaseAnonKey() {
    return (process.env.SEMANU_SUPABASE_ANON_KEY ?? '').trim();
  },

  /** Cloudflare Turnstile secret for server-side verification. Empty = Turnstile
   *  not configured (public forms still work, fail-safe). */
  get turnstileSecret() {
    return (process.env.TURNSTILE_SECRET_KEY ?? '').trim();
  },
};
