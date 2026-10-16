/**
 * Centralised, lazily-validated environment access.
 * Getters throw only when *accessed* with a missing value, so the project
 * still builds before `.env.local` is filled in. NEXT_PUBLIC_* references are
 * written out literally so Next can inline them in the client bundle.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example → .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  /** SERVER ONLY — bypasses RLS. Never reference from client components. */
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amai.ch';
  },
  /**
   * Order flow mode (server-authoritative): 'request' routes the subscribe form
   * to an enquiry email (no payment); 'stripe' uses live Stripe Checkout.
   * Defaults to 'request'.
   */
  get orderFlowMode(): 'request' | 'stripe' {
    return process.env.ORDER_FLOW_MODE === 'stripe' ? 'stripe' : 'request';
  },
  /** Single password gate for the internal /admin area. Empty = admin locked.
   *  Trimmed so a stray newline/space in the Vercel value cannot lock you out. */
  get adminPassword() {
    return (process.env.ADMIN_PASSWORD ?? '').trim();
  },

  // ── Stripe ──────────────────────────────────────────────────────────────
  /** SERVER ONLY — full API access. Never reference from client components. */
  get stripeSecretKey() {
    return required('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY);
  },
  /** SERVER ONLY — verifies webhook signatures. */
  get stripeWebhookSecret() {
    return required('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET);
  },
  get stripePublishableKey() {
    return required(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
  },
  /** Recurring monthly Price id for the legacy Starter plan (discontinued 2026-06; scaffolding kept). */
  get stripePriceStarter() {
    return required('STRIPE_PRICE_STARTER', process.env.STRIPE_PRICE_STARTER);
  },
  /** Recurring monthly Price id for the Business plan (79 CHF/mo). */
  get stripePriceBusiness() {
    return required('STRIPE_PRICE_BUSINESS', process.env.STRIPE_PRICE_BUSINESS);
  },
  /** Recurring monthly Price id for the Webshop plan (99 CHF/mo). */
  get stripePriceWebshop() {
    return required('STRIPE_PRICE_WEBSHOP', process.env.STRIPE_PRICE_WEBSHOP);
  },
  /** One-time Price id for the Logo + brand guidelines add-on (375 CHF during the 50% promo, else 750 CHF). */
  get stripePriceLogo() {
    return required('STRIPE_PRICE_LOGO', process.env.STRIPE_PRICE_LOGO);
  },
  /** Recurring monthly Price id for the Google Ads management add-on (200 CHF/mo). */
  get stripePriceGoogleAds() {
    return required('STRIPE_PRICE_GOOGLE_ADS', process.env.STRIPE_PRICE_GOOGLE_ADS);
  },

  /** Server-only pepper for hashing rate-limit identifiers (C7). Empty = no pepper. */
  get rateLimitSalt() {
    return process.env.RATE_LIMIT_SALT ?? '';
  },

  /** Cloudflare Turnstile secret for server-side verification. Empty = Turnstile
   *  not configured (public forms still work — P4-D6 fail-safe). */
  get turnstileSecret() {
    return (process.env.TURNSTILE_SECRET_KEY ?? '').trim();
  },

  // ── Google marketing APIs (GA4 + Search Console) ─────────────────────────
  /** SERVER ONLY — base64 encoded Google service account JSON key. Grant this
   *  service account Viewer on the GA4 property and a user on the GSC site. */
  get googleSaB64() {
    return (process.env.GOOGLE_SA_B64 ?? '').trim();
  },
  /** GA4 property id (numeric). Defaults to the amai! production property. */
  get ga4PropertyId() {
    return (process.env.GA4_PROPERTY_ID ?? '541325140').trim();
  },
  /** Search Console site: 'sc-domain:amai.ch' (Domain property) or
   *  'https://amai.ch/' (URL-prefix property). */
  get gscSiteUrl() {
    return (process.env.GSC_SITE_URL ?? 'sc-domain:amai.ch').trim();
  },

  /** Portal feature flag. /app is enabled only when PORTAL_ENABLED is exactly 'true'. */
  get portalEnabled() {
    return process.env.PORTAL_ENABLED === 'true';
  },
  /**
   * P12B2 execution kill-switch (server-authoritative). Live Stripe subscription mutations
   * (change plan/quantity, cancel/undo) are possible ONLY when this is exactly 'true'. Default
   * off — keep it off in production until the Stripe test-mode smoke has passed. Admin-only
   * permissions are still required in addition to this flag.
   */
  get stripeSubscriptionMutationsEnabled() {
    return process.env.ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS === 'true';
  },
  /**
   * P12C webhook reconciliation flag (server-authoritative). When exactly 'true', the Stripe webhook
   * additionally reconciles `customer.subscription.*` events into the P12A `customer_subscriptions`
   * registry (read/sync only; never touches the legacy mirror or checkout). Default off — the legacy
   * webhook behaves exactly as before when this is unset.
   */
  get enableSubscriptionWebhookSync() {
    return process.env.ENABLE_SUBSCRIPTION_WEBHOOK_SYNC === 'true';
  },
  /** Shared secret guarding the outbox cron route. Empty = route locked. */
  get cronSecret() {
    return (process.env.CRON_SECRET ?? '').trim();
  },

  // ── Email (Resend) — optional; sends are skipped when the key is absent ──
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? '';
  },
  get notificationTo() {
    return process.env.LEAD_NOTIFICATION_TO ?? 'hello@amai.ch';
  },
  get notificationFrom() {
    return process.env.LEAD_NOTIFICATION_FROM ?? 'amai.ch <noreply@amai.ch>';
  },

  // ── Website analysis reports (P14 / WAF-2) ──────────────────────────────
  /**
   * P14 feature flag (server-authoritative). Website analysis report generation/retry/regenerate is
   * possible ONLY when this is exactly 'true'. Default off — keep it off until an AI key + model are set
   * and the SSRF smoke has passed. Permissions are still required in addition to this flag.
   */
  get websiteReportsEnabled() {
    return process.env.WEBSITE_REPORTS_ENABLED === 'true';
  },
  /** AI provider id for report generation (e.g. 'anthropic'). Default 'anthropic'. */
  get aiProvider() {
    return (process.env.AI_PROVIDER ?? 'anthropic').trim();
  },
  /** AI model id for report generation. Empty = not configured → generation fails safely. */
  get aiModel() {
    return (process.env.AI_MODEL ?? '').trim();
  },
  /** SERVER ONLY — Anthropic API key. Never reference from client components. Empty = not configured. */
  get anthropicApiKey() {
    return (process.env.ANTHROPIC_API_KEY ?? '').trim();
  },
  /** Hard per-report cost ceiling (CHF/USD equivalent). Default 1. Generation fails closed above this. */
  get websiteReportMaxCost() {
    const v = Number(process.env.WEBSITE_REPORT_MAX_COST);
    return Number.isFinite(v) && v > 0 ? v : 1;
  },

  // ── Website report delivery (P15 / WAF-3) ───────────────────────────────
  /**
   * P15 delivery flag (server-authoritative). Report PDF generation + email delivery is possible ONLY when
   * this is exactly 'true'. Default off — ships dark; keep off until the combined P14+P15 live smoke passes.
   * Permissions + an approved report are still required in addition to this flag.
   */
  get websiteReportDeliveryEnabled() {
    return process.env.WEBSITE_REPORT_DELIVERY_ENABLED === 'true';
  },
  /** Max report PDF size in bytes (delivery fails closed above this). Default 10 MB. */
  get websiteReportPdfMaxBytes() {
    const v = Number(process.env.WEBSITE_REPORT_PDF_MAX_BYTES);
    return Number.isFinite(v) && v > 0 ? v : 10_000_000;
  },

  // ── Email engagement tracking (P16 / WAF-3.1, Resend webhook) ────────────
  /**
   * P16 master switch (server-authoritative). The /api/webhooks/resend route processes events ONLY when this is
   * exactly 'true'. Default off — ships dark; safe to deploy with this off (the route no-ops → 200 ignored).
   * Enabling it in production is downstream of the combined P14+P15 live smoke + registering the webhook in Resend.
   */
  get enableResendWebhook() {
    return process.env.ENABLE_RESEND_WEBHOOK === 'true';
  },
  /** SERVER ONLY — Resend (Svix) webhook signing secret. Never reference from client components. Empty = every
   *  event is unverifiable → the route returns 400 and processes nothing. */
  get resendWebhookSecret() {
    return (process.env.RESEND_WEBHOOK_SECRET ?? '').trim();
  },
  /**
   * P16 open/click capture (server-authoritative). Opens/clicks are tracking-pixel signals: unreliable and
   * privacy-sensitive, so they are recorded ONLY when this is exactly 'true' (default off). delivered/bounced/
   * complained are recorded whenever ENABLE_RESEND_WEBHOOK is on, independent of this flag. When on, only
   * timestamps + counts are stored — never IP, user-agent or raw provider payload.
   */
  get enableEmailOpenClickTracking() {
    return process.env.ENABLE_EMAIL_OPEN_CLICK_TRACKING === 'true';
  },

  // ── Follow-up worklist (P17 / WAF-3.2) ──────────────────────────────────
  /**
   * P17 flag (server-authoritative). The internal, read-only follow-up worklist + engagement insights page is
   * available ONLY when this is exactly 'true' (default off). Pure read — no writes, no migration, no new
   * permission; viewing reuses website_reports.read, the inline follow-up reuses the P15 website_reports.deliver
   * actions. Ships dark for clean rollback; safe to deploy off.
   */
  get enableFollowUpWorklist() {
    return process.env.ENABLE_FOLLOWUP_WORKLIST === 'true';
  },

  // ── Auto-pilot: auto-generate (+ optional auto-send) on funnel submission (WAF-4) ──
  /**
   * WAF-4 master switch (server-authoritative). When 'true', a public `website_analysis` submission enqueues a
   * background report-generation job (processed by the outbox worker). Default off — ships dark. Generation
   * still obeys the P14 cost cap + SSRF guard, and the public request NEVER runs AI.
   */
  get autoGenerateEnabled() {
    return process.env.AUTO_GENERATE_ENABLED === 'true';
  },
  /**
   * WAF-4 auto-send (server-authoritative). When 'true' AND a job's report generates successfully, the report
   * is system-approved and emailed to the submitter via the P15 PDF path (no link). Default off. Also requires
   * WEBSITE_REPORT_DELIVERY_ENABLED + RESEND_API_KEY to actually send.
   */
  get autoSendEnabled() {
    return process.env.AUTO_SEND_ENABLED === 'true';
  },
  /**
   * WAF-4 global daily ceiling on auto-generations (the cost wall). Worst-case daily AI spend is roughly
   * this number x WEBSITE_REPORT_MAX_COST. Above the cap, submissions are still captured as leads but
   * generate nothing. Default 10; coerced to a positive integer.
   */
  get autoGenerateDailyCap() {
    const v = Number(process.env.AUTO_GENERATE_DAILY_CAP);
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 10;
  },

  // ── External quickscan PDF service (WAF-4: exact weasyprint renderer, hosted separately) ──
  /** Base URL of the quickscan PDF microservice (no trailing slash needed). Empty = not configured. */
  get pdfServiceUrl() {
    return (process.env.PDF_SERVICE_URL ?? '').trim().replace(/\/+$/, '');
  },
  /** SERVER ONLY — shared secret sent as X-Service-Secret to the PDF service. Never reference from client. */
  get pdfServiceSecret() {
    return (process.env.PDF_SERVICE_SECRET ?? '').trim();
  },
};
