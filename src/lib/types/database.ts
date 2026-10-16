/**
 * Typed schema for the amai Supabase project (ref bkwwlmflsbhrsfwydbnv), aligned to the
 * **live** schema (B2 / task #73). The portal was built ADDITIVELY on the existing internal
 * platform, so: roles are `admin/analyst/sales/reviewer/read_only` (smallint), the RBAC lives
 * in `user_roles`, the audit table is `audit_logs` (plural, extended), and `profiles` keeps
 * `full_name`/`is_active` plus the added `first_name/last_name/status/avatar_url/created_by`.
 *
 * This is a focused, hand-maintained view covering the tables the app queries + the portal
 * RPCs. Regenerate fully with `supabase gen types typescript --project-id bkwwlmflsbhrsfwydbnv`
 * if you need the outreach/CRM tables typed too.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── standalone aliases the app imports ──────────────────────
// Keep in sync with the orders/subscriptions `plan` CHECK constraint
// (migration 0017 added 'webshop').
export type PlanId = 'starter' | 'business' | 'webshop';
/** Live `roles.key` values (smallint role catalog: admin/analyst/sales/reviewer/read_only). */
export type Role = 'admin' | 'analyst' | 'sales' | 'reviewer' | 'read_only';
export type UserStatus = 'active' | 'disabled' | 'invited' | 'archived';
/** CRM company lifecycle (migration 0022; orthogonal to the prospecting `lead_status`). */
export type CompanyCrmStatus = 'lead' | 'qualified' | 'active' | 'dormant' | 'lost' | 'blocked' | 'archived';
/** CRM contact lifecycle (migration 0022; no `lost`). */
export type ContactStatus = 'lead' | 'qualified' | 'active' | 'dormant' | 'blocked' | 'archived';
/** Project lifecycle (migration 0023; Ring D). */
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
/** Catalog item lifecycle (migration 0024; Ring D). */
export type CatalogStatus = 'draft' | 'active' | 'inactive' | 'archived';
/** Quote lifecycle (migration 0025; Ring D). */
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'archived';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void' | 'archived';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'archived';
export type PaymentLinkStatus = 'draft' | 'active' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'archived';
/**
 * Internal sync-state of a customer_subscriptions registry row (migration 0029; Ring D, P12A).
 * NOTE: the Stripe-mirrored `status` column is intentionally NOT a closed union (Stripe may add
 * subscription statuses); treat it as `string` and map known values in the status helper.
 */
export type CustomerSubscriptionSyncStatus = 'pending' | 'synced' | 'failed' | 'stale';
/** Subscription-change-request lifecycle (migration 0030; Ring D, P12B1). `executing`/`executed` are
 * reserved for P12B2 — no P12B1 code path sets them. */
export type SubscriptionChangeStatus =
  | 'draft' | 'previewed' | 'approved' | 'executing' | 'executed' | 'failed' | 'cancelled' | 'archived';
export type SubscriptionChangeAction =
  | 'change_plan' | 'change_quantity' | 'cancel_at_period_end' | 'undo_cancel_at_period_end'
  | 'cancel_immediately' | 'pause_collection' | 'resume_collection';
/** Website funnel / lead-magnet submission (migration 0032; Ring E, P13). */
export type FunnelSourceType =
  | 'website_analysis' | 'website_cost_calculator' | 'strategy_call' | 'maintenance_security_scan';
export type FunnelStatus =
  | 'new' | 'to_review' | 'qualified' | 'in_progress' | 'analyzed' | 'report_sent'
  | 'contacted' | 'follow_up_planned' | 'converted' | 'closed_not_relevant' | 'archived';
export type FunnelSpamStatus = 'pending' | 'ham' | 'suspected' | 'spam';
/** Website analysis report engine (migration 0033; Ring E, P14 / WAF-2). */
export type WebsiteReportGenerationStatus = 'queued' | 'fetching' | 'analyzing' | 'succeeded' | 'failed';
export type WebsiteReportReviewStatus = 'review_needed' | 'approved' | 'rejected';
/** Website report delivery (migration 0034; Ring E, P15 / WAF-3). */
export type ReportDeliveryStatus = 'queued' | 'rendering' | 'sending' | 'sent' | 'failed' | 'bounced' | 'cancelled';
export type ReportDeliveryFollowUpStatus = 'none' | 'planned' | 'done';
export type ActorType = 'internal_user' | 'external_user' | 'system' | 'link_user' | 'integration';
export type AuditSource = 'portal' | 'public_link' | 'email_link' | 'api' | 'system_job' | 'webhook' | 'platform';
export type AuditSeverity = 'info' | 'warning' | 'critical';

/** Display-safe audit row returned by the audit_history() RPC (no technical fields). */
export type AuditHistoryRow = {
  id: number;
  created_at: string;
  actor_name: string | null;
  actor_role: string | null;
  actor_type: ActorType;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_display_name: string | null;
  old_status: string | null;
  new_status: string | null;
  source: AuditSource;
  severity: AuditSeverity;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string; created_at: string; form_type: string;
          firstname: string; lastname: string; email: string;
          company: string | null; phone: string | null; message: string | null;
          lang: string; consent: boolean; source_locale: string | null;
          user_agent: string | null; ip_hash: string | null; status: string; channel: string; notes: string | null;
          lost_reason: string | null; company_id: string | null; contact_id: string | null; assigned_to: string | null;
        };
        Insert: {
          id?: string; created_at?: string; form_type: string;
          firstname: string; lastname: string; email: string;
          company?: string | null; phone?: string | null; message?: string | null;
          lang?: string; consent?: boolean; source_locale?: string | null;
          user_agent?: string | null; ip_hash?: string | null; status?: string; channel?: string; notes?: string | null;
          lost_reason?: string | null; company_id?: string | null; contact_id?: string | null; assigned_to?: string | null;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
        Relationships: [];
      };
      lead_notes: {
        Row: {
          id: string; lead_id: string; body: string; current_version: number;
          created_by: string | null; created_at: string; updated_by: string | null; updated_at: string;
        };
        Insert: {
          id?: string; lead_id: string; body: string; current_version?: number;
          created_by?: string | null; created_at?: string; updated_by?: string | null; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_notes']['Insert']>;
        Relationships: [];
      };
      lead_note_versions: {
        Row: {
          id: string; note_id: string; version: number; body: string;
          created_by: string | null; created_at: string;
        };
        Insert: {
          id?: string; note_id: string; version: number; body: string;
          created_by?: string | null; created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_note_versions']['Insert']>;
        Relationships: [];
      };
      lead_submissions: {
        Row: {
          id: string; lead_id: string; form_type: string | null; channel: string | null;
          message: string | null; lang: string | null; page_path: string | null; source: string | null; created_at: string;
        };
        Insert: {
          id?: string; lead_id: string; form_type?: string | null; channel?: string | null;
          message?: string | null; lang?: string | null; page_path?: string | null; source?: string | null; created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_submissions']['Insert']>;
        Relationships: [];
      };
      configurations: {
        Row: {
          id: string; created_at: string; updated_at: string; config_number: string;
          title: string; situation: string; status: string; current_version: number;
          lead_id: string | null; company_id: string | null; quote_id: string | null;
          source: string; archived_at: string | null; archived_by: string | null;
          created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; config_number?: string;
          title?: string; situation?: string; status?: string; current_version?: number;
          lead_id?: string | null; company_id?: string | null; quote_id?: string | null;
          source?: string; archived_at?: string | null; archived_by?: string | null;
          created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['configurations']['Insert']>;
        Relationships: [];
      };
      configuration_versions: {
        Row: {
          id: string; configuration_id: string; version: number; payload: Json;
          monthly_total: number; onetime_total: number; note: string | null;
          created_at: string; created_by: string | null;
        };
        Insert: {
          id?: string; configuration_id: string; version: number; payload: Json;
          monthly_total?: number; onetime_total?: number; note?: string | null;
          created_at?: string; created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['configuration_versions']['Insert']>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string; created_at: string; updated_at: string;
          stripe_customer_id: string | null; email: string; name: string | null;
          user_id: string | null; company_id: string | null; contact_person: string | null;
          phone: string | null; website_url: string | null; billing_email: string | null;
          billing_address: string | null; country: string; language_pref: string | null;
          notes: string | null; customer_status: string; payment_status: string;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          stripe_customer_id?: string | null; email: string; name?: string | null;
          user_id?: string | null; company_id?: string | null; contact_person?: string | null;
          phone?: string | null; website_url?: string | null; billing_email?: string | null;
          billing_address?: string | null; country?: string; language_pref?: string | null;
          notes?: string | null; customer_status?: string; payment_status?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string; created_at: string; updated_at: string; status: string;
          plan: PlanId; addon: boolean; firstname: string; lastname: string; email: string;
          company: string | null; phone: string | null; consent: boolean; locale: string;
          amount_plan_chf: number; amount_addon_chf: number;
          stripe_session_id: string | null; stripe_customer_id: string | null;
          stripe_subscription_id: string | null; customer_id: string | null;
          customer_type: string; vat_number: string | null;
          billing_street: string | null; billing_postal_code: string | null;
          billing_city: string | null; billing_country: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; status?: string;
          plan: PlanId; addon?: boolean; firstname: string; lastname: string; email: string;
          company?: string | null; phone?: string | null; consent?: boolean; locale?: string;
          amount_plan_chf: number; amount_addon_chf?: number;
          stripe_session_id?: string | null; stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null; customer_id?: string | null;
          customer_type?: string; vat_number?: string | null;
          billing_street?: string | null; billing_postal_code?: string | null;
          billing_city?: string | null; billing_country?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string; created_at: string; updated_at: string; customer_id: string;
          status: string; plan: PlanId | null; current_period_end: string | null;
          cancel_at_period_end: boolean;
        };
        Insert: {
          id: string; created_at?: string; updated_at?: string; customer_id: string;
          status: string; plan?: PlanId | null; current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [];
      };
      // CRM core (Ring C). Pre-existing prospecting columns + the CRM lifecycle layer
      // added additively in migration 0022. The prospecting `lead_status` is left intact.
      companies: {
        Row: {
          id: string; created_at: string; updated_at: string; company_name: string;
          domain: string | null; website_url: string | null; email: string | null;
          contact_person: string | null; phone: string | null; city: string | null;
          canton: string | null; country: string; language_pref: string | null;
          industry: string | null; source: string; notes: string | null;
          lead_status: string; lead_priority: string | null;
          import_batch_id: string | null; last_scanned_at: string | null;
          // CRM lifecycle layer (0022)
          crm_status: string; owner_id: string | null;
          archived_at: string | null; archived_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; company_name: string;
          domain?: string | null; website_url?: string | null; email?: string | null;
          contact_person?: string | null; phone?: string | null; city?: string | null;
          canton?: string | null; country?: string; language_pref?: string | null;
          industry?: string | null; source?: string; notes?: string | null;
          lead_status?: string; lead_priority?: string | null;
          import_batch_id?: string | null; last_scanned_at?: string | null;
          crm_status?: string; owner_id?: string | null;
          archived_at?: string | null; archived_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
        Relationships: [];
      };
      company_contacts: {
        Row: {
          id: string; created_at: string; company_id: string;
          name: string | null; email: string | null; phone: string | null; role: string | null;
          // CRM contact layer (0022)
          contact_status: string; updated_at: string; is_primary: boolean;
          archived_at: string | null; archived_by: string | null;
          created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; company_id: string;
          name?: string | null; email?: string | null; phone?: string | null; role?: string | null;
          contact_status?: string; updated_at?: string; is_primary?: boolean;
          archived_at?: string | null; archived_by?: string | null;
          created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['company_contacts']['Insert']>;
        Relationships: [];
      };
      // Ring D — Projects Core (migration 0023). Greenfield bridge from CRM to ERP.
      projects: {
        Row: {
          id: string; created_at: string; updated_at: string; name: string;
          description: string | null; company_id: string; primary_contact_id: string | null;
          owner_id: string | null; status: string; start_date: string | null; due_date: string | null;
          archived_at: string | null; archived_by: string | null;
          created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; name: string;
          description?: string | null; company_id: string; primary_contact_id?: string | null;
          owner_id?: string | null; status?: string; start_date?: string | null; due_date?: string | null;
          archived_at?: string | null; archived_by?: string | null;
          created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
        Relationships: [];
      };
      // Ring D — Products & Services Catalog (migration 0024). Internal catalog master.
      catalog_items: {
        Row: {
          id: string; created_at: string; updated_at: string; name: string;
          code: string | null; description: string | null; item_type: string; status: string;
          category: string | null; base_price: number | null; currency: string;
          price_is_from: boolean; billing_interval: string; setup_fee: number | null;
          is_public: boolean; archived_at: string | null; archived_by: string | null;
          created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; name: string;
          code?: string | null; description?: string | null; item_type: string; status?: string;
          category?: string | null; base_price?: number | null; currency?: string;
          price_is_from?: boolean; billing_interval?: string; setup_fee?: number | null;
          is_public?: boolean; archived_at?: string | null; archived_by?: string | null;
          created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['catalog_items']['Insert']>;
        Relationships: [];
      };
      // Ring D — Quotes Core (migration 0025). Parent quote + line items.
      quotes: {
        Row: {
          id: string; created_at: string; updated_at: string; quote_number: string; title: string;
          company_id: string; contact_id: string | null; project_id: string | null; status: string;
          currency: string; subtotal: number; discount_amount: number; tax_amount: number; total_amount: number;
          valid_until: string | null; notes: string | null; internal_notes: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; quote_number?: string; title: string;
          company_id: string; contact_id?: string | null; project_id?: string | null; status?: string;
          currency?: string; subtotal?: number; discount_amount?: number; tax_amount?: number; total_amount?: number;
          valid_until?: string | null; notes?: string | null; internal_notes?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
        Relationships: [];
      };
      quote_items: {
        Row: {
          id: string; quote_id: string; catalog_item_id: string | null; position: number;
          name: string; description: string | null; quantity: number; unit_price: number;
          billing_interval: string | null; line_subtotal: number; line_total: number;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; quote_id: string; catalog_item_id?: string | null; position?: number;
          name: string; description?: string | null; quantity?: number; unit_price?: number;
          billing_interval?: string | null; line_subtotal?: number; line_total?: number;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quote_items']['Insert']>;
        Relationships: [];
      };
      // Ring D — Invoices Core (migration 0026). Parent invoice + line items.
      invoices: {
        Row: {
          id: string; created_at: string; updated_at: string; invoice_number: string; title: string;
          company_id: string; contact_id: string | null; project_id: string | null; quote_id: string | null;
          status: string; currency: string; subtotal: number; discount_amount: number; tax_amount: number;
          total_amount: number; amount_paid: number; balance_due: number;
          issue_date: string | null; due_date: string | null; paid_at: string | null;
          notes: string | null; internal_notes: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; invoice_number?: string; title: string;
          company_id: string; contact_id?: string | null; project_id?: string | null; quote_id?: string | null;
          status?: string; currency?: string; subtotal?: number; discount_amount?: number; tax_amount?: number;
          total_amount?: number; amount_paid?: number; balance_due?: number;
          issue_date?: string | null; due_date?: string | null; paid_at?: string | null;
          notes?: string | null; internal_notes?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string; invoice_id: string; quote_item_id: string | null; catalog_item_id: string | null;
          position: number; name: string; description: string | null; quantity: number; unit_price: number;
          billing_interval: string | null; line_subtotal: number; line_total: number;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; invoice_id: string; quote_item_id?: string | null; catalog_item_id?: string | null;
          position?: number; name: string; description?: string | null; quantity?: number; unit_price?: number;
          billing_interval?: string | null; line_subtotal?: number; line_total?: number;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
        Relationships: [];
      };
      // Ring D — Payments Core (migration 0027). Internal payment records linked to an invoice.
      invoice_payments: {
        Row: {
          id: string; created_at: string; updated_at: string; invoice_id: string; company_id: string;
          amount: number; currency: string; status: string; method: string; provider: string;
          provider_payment_id: string | null; provider_checkout_session_id: string | null;
          provider_payment_intent_id: string | null; legacy_payment_id: string | null; payment_link_id: string | null;
          paid_at: string | null; failed_at: string | null; refunded_at: string | null;
          notes: string | null; internal_notes: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; invoice_id: string; company_id: string;
          amount: number; currency?: string; status?: string; method?: string; provider?: string;
          provider_payment_id?: string | null; provider_checkout_session_id?: string | null;
          provider_payment_intent_id?: string | null; legacy_payment_id?: string | null; payment_link_id?: string | null;
          paid_at?: string | null; failed_at?: string | null; refunded_at?: string | null;
          notes?: string | null; internal_notes?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['invoice_payments']['Insert']>;
        Relationships: [];
      };
      // Ring D — Stripe Payment Links from invoices (migration 0028).
      invoice_payment_links: {
        Row: {
          id: string; created_at: string; updated_at: string; invoice_id: string; company_id: string;
          invoice_payment_id: string | null; amount: number; currency: string; status: string; provider: string;
          provider_payment_link_id: string | null; provider_checkout_session_id: string | null;
          provider_payment_intent_id: string | null; url: string | null; expires_at: string | null;
          paid_at: string | null; cancelled_at: string | null; failed_at: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null; internal_notes: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; invoice_id: string; company_id: string;
          invoice_payment_id?: string | null; amount: number; currency?: string; status?: string; provider?: string;
          provider_payment_link_id?: string | null; provider_checkout_session_id?: string | null;
          provider_payment_intent_id?: string | null; url?: string | null; expires_at?: string | null;
          paid_at?: string | null; cancelled_at?: string | null; failed_at?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null; internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['invoice_payment_links']['Insert']>;
        Relationships: [];
      };
      // Ring D — Stripe Subscription Registry / Read & Link (migration 0029, P12A). Portal-owned
      // registry: links an existing Stripe subscription to a CRM company/contact/customer and stores
      // a SYNCED SNAPSHOT of its Stripe state. Stripe stays authoritative; this is never the billing
      // authority. The legacy `subscriptions` mirror + checkout/webhook are untouched.
      customer_subscriptions: {
        Row: {
          id: string; created_at: string; updated_at: string;
          company_id: string | null; contact_id: string | null; customer_id: string | null;
          stripe_customer_id: string; stripe_subscription_id: string;
          stripe_product_id: string | null; stripe_price_id: string | null; plan_key: string | null;
          status: string; current_period_start: string | null; current_period_end: string | null;
          cancel_at_period_end: boolean; cancelled_at: string | null;
          trial_start: string | null; trial_end: string | null;
          quantity: number | null; currency: string | null; amount: number | null; interval: string | null;
          metadata: Json; last_synced_at: string | null; sync_status: string;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null; internal_notes: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          company_id?: string | null; contact_id?: string | null; customer_id?: string | null;
          stripe_customer_id: string; stripe_subscription_id: string;
          stripe_product_id?: string | null; stripe_price_id?: string | null; plan_key?: string | null;
          status?: string; current_period_start?: string | null; current_period_end?: string | null;
          cancel_at_period_end?: boolean; cancelled_at?: string | null;
          trial_start?: string | null; trial_end?: string | null;
          quantity?: number | null; currency?: string | null; amount?: number | null; interval?: string | null;
          metadata?: Json; last_synced_at?: string | null; sync_status?: string;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null; internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customer_subscriptions']['Insert']>;
        Relationships: [];
      };
      // Ring D — Subscription Change Requests + Preview (migration 0030, P12B1). Request/log layer for
      // subscription mutations, entered through a customer_subscriptions row. P12B1 = request + preview
      // only (no Stripe writes); `executing`/`executed` + execute perms are P12B2.
      subscription_change_requests: {
        Row: {
          id: string; created_at: string; updated_at: string;
          customer_subscription_id: string; company_id: string | null; contact_id: string | null;
          stripe_subscription_id: string; action_type: string; status: string;
          proration_behavior: string | null; subscription_item_id: string | null;
          requested_by: string | null; approved_by: string | null; executed_by: string | null;
          requested_at: string | null; approved_at: string | null; executed_at: string | null; failed_at: string | null;
          request_payload: Json; preview_payload: Json | null; result_payload: Json | null; safe_summary: Json;
          error_summary: string | null; idempotency_key: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null; internal_notes: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          customer_subscription_id: string; company_id?: string | null; contact_id?: string | null;
          stripe_subscription_id: string; action_type: string; status?: string;
          proration_behavior?: string | null; subscription_item_id?: string | null;
          requested_by?: string | null; approved_by?: string | null; executed_by?: string | null;
          requested_at?: string | null; approved_at?: string | null; executed_at?: string | null; failed_at?: string | null;
          request_payload?: Json; preview_payload?: Json | null; result_payload?: Json | null; safe_summary?: Json;
          error_summary?: string | null; idempotency_key?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null; internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subscription_change_requests']['Insert']>;
        Relationships: [];
      };
      // Ring E — Website Sales Funnels / Lead Magnets (migration 0032, P13). Public-to-portal funnel
      // ingestion record; CRM companies/contacts stay the source of truth (links are nullable).
      funnel_submissions: {
        Row: {
          id: string; created_at: string; updated_at: string;
          source_type: string; status: string; spam_status: string; spam_score: number | null;
          contact_id: string | null; company_id: string | null; owner_id: string | null;
          first_name: string | null; last_name: string | null; email: string; phone: string | null;
          website_url: string | null; normalized_domain: string | null; company_name: string | null;
          payload: Json;
          utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
          utm_term: string | null; utm_content: string | null;
          referrer: string | null; page_path: string | null; locale: string | null;
          user_agent_hash: string | null; ip_hash: string | null;
          consent_privacy: boolean; consent_marketing: boolean;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null; internal_notes: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          source_type: string; status?: string; spam_status?: string; spam_score?: number | null;
          contact_id?: string | null; company_id?: string | null; owner_id?: string | null;
          first_name?: string | null; last_name?: string | null; email: string; phone?: string | null;
          website_url?: string | null; normalized_domain?: string | null; company_name?: string | null;
          payload?: Json;
          utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
          utm_term?: string | null; utm_content?: string | null;
          referrer?: string | null; page_path?: string | null; locale?: string | null;
          user_agent_hash?: string | null; ip_hash?: string | null;
          consent_privacy?: boolean; consent_marketing?: boolean;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null; internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['funnel_submissions']['Insert']>;
        Relationships: [];
      };
      website_analysis_reports: {
        Row: {
          id: string; created_at: string; updated_at: string;
          funnel_submission_id: string; version: number; is_current: boolean;
          company_id: string | null; contact_id: string | null;
          website_url: string; normalized_domain: string | null;
          generation_status: string; review_status: string;
          model_provider: string | null; model_name: string | null; prompt_version: string | null;
          input_snapshot: Json; crawl_snapshot: Json;
          report_json: Json | null; report_markdown: string | null;
          score_overall: number | null; score_seo: number | null; score_ux: number | null;
          score_conversion: number | null; score_performance: number | null; score_trust: number | null;
          score_content: number | null; score_mobile: number | null;
          recommendations: Json; internal_sales_notes: string | null;
          error_summary: string | null; cost_estimate: number | null; token_usage: Json;
          generated_at: string | null; reviewed_at: string | null; reviewed_by: string | null;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null; internal_notes: string | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          funnel_submission_id: string; version?: number; is_current?: boolean;
          company_id?: string | null; contact_id?: string | null;
          website_url: string; normalized_domain?: string | null;
          generation_status?: string; review_status?: string;
          model_provider?: string | null; model_name?: string | null; prompt_version?: string | null;
          input_snapshot?: Json; crawl_snapshot?: Json;
          report_json?: Json | null; report_markdown?: string | null;
          score_overall?: number | null; score_seo?: number | null; score_ux?: number | null;
          score_conversion?: number | null; score_performance?: number | null; score_trust?: number | null;
          score_content?: number | null; score_mobile?: number | null;
          recommendations?: Json; internal_sales_notes?: string | null;
          error_summary?: string | null; cost_estimate?: number | null; token_usage?: Json;
          generated_at?: string | null; reviewed_at?: string | null; reviewed_by?: string | null;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null; internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['website_analysis_reports']['Insert']>;
        Relationships: [];
      };
      website_report_deliveries: {
        Row: {
          id: string; created_at: string; updated_at: string;
          report_id: string; funnel_submission_id: string;
          contact_id: string | null; company_id: string | null;
          to_email: string; channel: string; status: string;
          pdf_bucket: string | null; pdf_path: string | null; pdf_size_bytes: number | null;
          outbox_id: string | null; provider_message_id: string | null; subject: string | null;
          error_summary: string | null; sent_at: string | null; failed_at: string | null;
          follow_up_at: string | null; follow_up_status: string;
          archived_at: string | null; archived_by: string | null; created_by: string | null; updated_by: string | null;
          notes: string | null;
          // P16 engagement (Resend webhook). Reliable: delivered/bounced/complained. Indicative + gated: opened/clicked.
          delivered_at: string | null; bounced_at: string | null; complained_at: string | null;
          first_opened_at: string | null; opened_at: string | null; clicked_at: string | null;
          open_count: number; click_count: number; last_event_at: string | null;
          bounce_type: string | null; engagement: Json;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string;
          report_id: string; funnel_submission_id: string;
          contact_id?: string | null; company_id?: string | null;
          to_email: string; channel?: string; status?: string;
          pdf_bucket?: string | null; pdf_path?: string | null; pdf_size_bytes?: number | null;
          outbox_id?: string | null; provider_message_id?: string | null; subject?: string | null;
          error_summary?: string | null; sent_at?: string | null; failed_at?: string | null;
          follow_up_at?: string | null; follow_up_status?: string;
          archived_at?: string | null; archived_by?: string | null; created_by?: string | null; updated_by?: string | null;
          notes?: string | null;
          delivered_at?: string | null; bounced_at?: string | null; complained_at?: string | null;
          first_opened_at?: string | null; opened_at?: string | null; clicked_at?: string | null;
          open_count?: number; click_count?: number; last_event_at?: string | null;
          bounce_type?: string | null; engagement?: Json;
        };
        Update: Partial<Database['public']['Tables']['website_report_deliveries']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string; created_at: string; updated_at: string; email: string;
          full_name: string | null; is_active: boolean; last_login_at: string | null;
          first_name: string | null; last_name: string | null; status: string;
          avatar_url: string | null; created_by: string | null;
          archived_at: string | null; archived_by: string | null;
        };
        Insert: {
          id: string; created_at?: string; updated_at?: string; email: string;
          full_name?: string | null; is_active?: boolean; last_login_at?: string | null;
          first_name?: string | null; last_name?: string | null; status?: string;
          avatar_url?: string | null; created_by?: string | null;
          archived_at?: string | null; archived_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      outbox: {
        Row: {
          id: string; created_at: string; updated_at: string; organization_id: string | null;
          channel: string; dedupe_key: string; payload: Json; status: string;
          attempts: number; max_attempts: number; last_attempt_at: string | null;
          next_retry_at: string | null; locked_at: string | null; locked_by: string | null;
          provider_message_id: string | null; error: string | null; audit_event_id: number | null;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; organization_id?: string | null;
          channel?: string; dedupe_key: string; payload: Json; status?: string;
          attempts?: number; max_attempts?: number; last_attempt_at?: string | null;
          next_retry_at?: string | null; locked_at?: string | null; locked_by?: string | null;
          provider_message_id?: string | null; error?: string | null; audit_event_id?: number | null;
        };
        Update: Partial<Database['public']['Tables']['outbox']['Insert']>;
        Relationships: [];
      };
      email_log: {
        Row: {
          id: string; created_at: string; outbox_id: string | null; organization_id: string | null;
          to_email: string; subject: string; template_key: string | null; status: string;
          provider_message_id: string | null; error: string | null; audit_event_id: number | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number; created_at: string; actor_id: string | null; action: string;
          entity_type: string | null; entity_id: string | null; metadata: Json | null;
          organization_id: string | null; actor_email: string | null; actor_name: string | null;
          actor_role: string | null; actor_type: string; entity_display_name: string | null;
          parent_entity_type: string | null; parent_entity_id: string | null;
          old_status: string | null; new_status: string | null;
          old_values: Json | null; new_values: Json | null;
          ip_address: string | null; user_agent: string | null;
          request_id: string | null; session_id: string | null;
          source: string; severity: string; visible_to_admin: boolean; visible_to_client: boolean;
        };
        Insert: Record<string, never>; // append-only — writes only via log_event()
        Update: Record<string, never>;
        Relationships: [];
      };
      roles: {
        Row: { id: number; key: string; label: string };
        Insert: { id?: number; key: string; label: string };
        Update: { id?: number; key?: string; label?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role_id: number };
        Insert: { user_id: string; role_id: number };
        Update: { user_id?: string; role_id?: number };
        Relationships: [];
      };
      platform_admins: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string; created_at: string; updated_at: string; organization_id: string;
          user_id: string; role_id: number; member_type: string; status: string;
        };
        Insert: {
          id?: string; created_at?: string; updated_at?: string; organization_id: string;
          user_id: string; role_id: number; member_type?: string; status?: string;
        };
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_org: { Args: Record<string, never>; Returns: string };
      has_permission: { Args: { p_key: string }; Returns: boolean };
      is_org_admin: { Args: Record<string, never>; Returns: boolean };
      is_platform_super_admin: { Args: Record<string, never>; Returns: boolean };
      get_user_permissions: { Args: Record<string, never>; Returns: string[] };
      hit_rate_limit: {
        Args: { p_bucket: string; p_identifier: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      log_event: {
        Args: {
          p_action: string; p_actor_id?: string | null; p_actor_type?: string;
          p_entity_type?: string | null; p_entity_id?: string | null; p_entity_display_name?: string | null;
          p_old_status?: string | null; p_new_status?: string | null;
          p_old_values?: Json | null; p_new_values?: Json | null; p_metadata?: Json | null;
          p_organization_id?: string | null; p_severity?: string; p_source?: string;
          p_ip?: string | null; p_user_agent?: string | null;
          p_request_id?: string | null; p_session_id?: string | null;
        };
        Returns: number;
      };
      audit_history: {
        Args: { p_entity_type: string; p_entity_id: string; p_limit?: number; p_offset?: number };
        Returns: AuditHistoryRow[];
      };
      anonymize_audit_actor: { Args: { p_actor_id: string }; Returns: undefined };
      claim_outbox: {
        Args: { p_limit: number; p_worker: string };
        Returns: Database['public']['Tables']['outbox']['Row'][];
      };
      complete_outbox: {
        Args: { p_id: string; p_success: boolean; p_provider_message_id?: string | null; p_error?: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
