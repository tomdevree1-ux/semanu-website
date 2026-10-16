import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { classifySource } from './guardrails';
import { cac, cpl, leadToCustomer, ltv, ltvCacRatio, paybackMonths } from './calc';
import type { AcquisitionTargets, Recommendation, SourceMetrics } from './types';

/**
 * SERVER ONLY acquisition reads. The Fase-1 tables (marketing_*, acquisition_*)
 * are not in the generated Database types yet, and the live DB carries extra
 * dual-provenance tables, so we deliberately use a loosely-typed service-role
 * client here + explicit local row types — isolated from the rest of the app.
 * Closed loop: lead/funnel attribution (last touch) → paid orders by email → MRR.
 */
function db(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

const lc = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const num = (v: unknown, d = 0): number => (v == null || v === '' ? d : Number(v));

/** Normalize a submission's marketing channel from its attribution fields. */
function channelOf(r: {
  source?: string | null;
  utm_medium?: string | null;
  utm_source?: string | null;
  gclid?: string | null;
  creation_source?: string | null;
}): string {
  if (r.source) return lc(r.source);
  const med = lc(r.utm_medium);
  const src = lc(r.utm_source);
  if (r.gclid || med === 'cpc' || med === 'ppc' || src.includes('google_ads')) return 'google_ads';
  if (med === 'organic') return 'organic_search';
  if (src) return src;
  if (r.creation_source) return lc(r.creation_source);
  return 'direct_unknown';
}

const within = (iso: string | null, from: number, to: number) => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t >= from && t <= to;
};

export async function getTargets(): Promise<AcquisitionTargets> {
  const { data } = await db().from('acquisition_targets').select('*').limit(1).maybeSingle();
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    baseCurrency: (r.base_currency as string) ?? 'CHF',
    defaultSubscriptionPrice: num(r.default_subscription_price, 80),
    expectedRetentionMonths: num(r.expected_retention_months, 24),
    targetLtvCacRatio: num(r.target_ltv_cac_ratio, 3),
    targetPaybackMonths: num(r.target_payback_months, 3),
    minClicksBeforeJudgement: num(r.min_clicks_before_judgement, 100),
    minLeadsBeforeJudgement: num(r.min_leads_before_judgement, 10),
    minCustomersBeforeJudgement: num(r.min_customers_before_judgement, 3),
    earlyChurnWindowDays: num(r.early_churn_window_days, 90),
    campaignCooldownDays: num(r.campaign_cooldown_days, 14),
    minConversionsToScale: num(r.min_conversions_to_scale, 30),
    scaleStepPct: num(r.scale_step_pct, 20),
    stableWindowDays: num(r.stable_window_days, 14),
  };
}

export type SourceRow = SourceMetrics & {
  recommendation: Recommendation;
  cpl: number | null;
  cac: number | null;
  payback: number | null;
  ltvCac: number | null;
  convRate: number | null;
};

export type Overview = {
  targets: AcquisitionTargets;
  rangeLabel: string;
  totals: {
    spend: number;
    leads: number;
    customers: number;
    newMrr: number;
    cpl: number | null;
    cac: number | null;
    ltv: number;
    payback: number | null;
    ltvCac: number | null;
  };
  bySource: SourceRow[];
  funnel: { stage: string; count: number }[];
  dataQuality: { label: string; count: number }[];
  changeLog: Array<{
    channel: string;
    campaign: string | null;
    change_type: string;
    reason: string | null;
    changed_at: string;
    cooldown_until: string | null;
    next_review_at: string | null;
  }>;
};

/** Build the full acquisition overview for a date range (ISO strings). */
export async function getOverview(fromISO: string, toISO: string, rangeLabel = ''): Promise<Overview> {
  const from = Date.parse(fromISO);
  const to = Date.parse(toISO);
  const targets = await getTargets();
  const sb = db();

  const [leadsRes, funnelsRes, ordersRes, spendRes, changeRes] = await Promise.all([
    sb.from('leads').select('id,email,created_at,source,utm_source,utm_medium,utm_campaign,gclid,creation_source,campaign_id,status'),
    sb.from('funnel_submissions').select('id,email,created_at,utm_source,utm_medium,utm_campaign,source_type,status,company_id'),
    sb.from('orders').select('email,amount_plan_chf,status,created_at,plan'),
    sb.from('marketing_spend_daily').select('*'),
    sb.from('marketing_change_log').select('channel,campaign,change_type,reason,changed_at,cooldown_until,next_review_at').order('changed_at', { ascending: false }).limit(20),
  ]);

  type Sub = { email: string; channel: string; created_at: string | null; status?: string | null; qualified?: boolean };
  const leads = (leadsRes.data ?? []) as Array<Record<string, string | null>>;
  const funnels = (funnelsRes.data ?? []) as Array<Record<string, string | null>>;
  const orders = (ordersRes.data ?? []) as Array<Record<string, string | number | null>>;
  const spendRows = (spendRes.data ?? []) as Array<Record<string, string | number | null>>;

  // Submissions = leads + funnels, each carrying its channel.
  const subs: Sub[] = [
    ...leads.map((l) => ({ email: lc(l.email), channel: channelOf(l), created_at: l.created_at, status: l.status, qualified: false })),
    ...funnels.map((f) => ({
      email: lc(f.email),
      channel: channelOf(f),
      created_at: f.created_at,
      status: f.status,
      qualified: ['qualified', 'in_progress', 'analyzed', 'report_sent', 'contacted', 'follow_up_planned', 'converted'].includes(f.status ?? ''),
    })),
  ];

  // Last-touch channel per email (latest submission wins) — for attributing paid orders.
  const lastChannel = new Map<string, string>();
  for (const s of [...subs].sort((a, b) => Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? ''))) {
    if (s.email) lastChannel.set(s.email, s.channel);
  }

  // Spend by channel (base currency: prefer spend_amount_base, else spend if already base).
  const baseCur = targets.baseCurrency;
  const spendByChannel = new Map<string, { spend: number; clicks: number }>();
  for (const r of spendRows) {
    if (!within((r.date as string) ?? null, from, to)) continue;
    const ch = lc((r.channel as string) ?? (r.source as string) ?? 'unknown');
    const base = r.spend_amount_base != null ? num(r.spend_amount_base) : lc(r.currency as string) === lc(baseCur) ? num(r.spend_amount) : num(r.spend_amount_base);
    const cur = spendByChannel.get(ch) ?? { spend: 0, clicks: 0 };
    cur.spend += base;
    cur.clicks += num(r.clicks);
    spendByChannel.set(ch, cur);
  }

  // Leads in range, grouped by channel.
  const leadsByChannel = new Map<string, number>();
  for (const s of subs) if (within(s.created_at, from, to)) leadsByChannel.set(s.channel, (leadsByChannel.get(s.channel) ?? 0) + 1);

  // Paying customers in range = paid orders, attributed to a channel by last-touch email.
  const custByChannel = new Map<string, { customers: number; mrr: number }>();
  let totalCustomers = 0;
  let totalMrr = 0;
  const seenEmail = new Set<string>();
  for (const o of orders) {
    if (lc(o.status as string) !== 'paid') continue;
    if (!within((o.created_at as string) ?? null, from, to)) continue;
    const email = lc(o.email as string);
    if (!email || seenEmail.has(email)) continue;
    seenEmail.add(email);
    const ch = lastChannel.get(email) ?? 'direct_unknown';
    const mrr = num(o.amount_plan_chf);
    const cur = custByChannel.get(ch) ?? { customers: 0, mrr: 0 };
    cur.customers += 1;
    cur.mrr += mrr;
    custByChannel.set(ch, cur);
    totalCustomers += 1;
    totalMrr += mrr;
  }

  // Change-log signal per channel (cooldown / fatigue).
  const changeLog = (changeRes.data ?? []) as Overview['changeLog'];
  const last14 = Date.now() - 14 * 86_400_000;
  const lastChangeByChannel = new Map<string, string>();
  const changes14ByChannel = new Map<string, number>();
  for (const c of changeLog) {
    const ch = lc(c.channel);
    if (!lastChangeByChannel.has(ch)) lastChangeByChannel.set(ch, c.changed_at);
    if (Date.parse(c.changed_at) >= last14) changes14ByChannel.set(ch, (changes14ByChannel.get(ch) ?? 0) + 1);
  }

  // Assemble per-source rows.
  const channels = new Set<string>([...leadsByChannel.keys(), ...custByChannel.keys(), ...spendByChannel.keys()]);
  const ltvValue = ltv(targets.defaultSubscriptionPrice, targets.expectedRetentionMonths);
  const bySource: SourceRow[] = [...channels]
    .map((ch) => {
      const spend = spendByChannel.get(ch)?.spend ?? 0;
      const clicks = spendByChannel.get(ch)?.clicks ?? 0;
      const leadsN = leadsByChannel.get(ch) ?? 0;
      const customers = custByChannel.get(ch)?.customers ?? 0;
      const newMrr = custByChannel.get(ch)?.mrr ?? 0;
      const m: SourceMetrics = {
        source: ch,
        spend,
        clicks: clicks || null,
        leads: leadsN,
        customers,
        newMrr,
        earlyChurnCount: 0,
        hasGclidButNoCampaignId: false,
        lastChangedAt: lastChangeByChannel.get(ch) ?? null,
        changesInLast14Days: changes14ByChannel.get(ch) ?? 0,
      };
      const cacV = cac(spend, customers);
      return {
        ...m,
        recommendation: classifySource(m, targets),
        cpl: cpl(spend, leadsN),
        cac: cacV,
        payback: paybackMonths(cacV, targets.defaultSubscriptionPrice),
        ltvCac: ltvCacRatio(ltvValue, cacV),
        convRate: leadToCustomer(customers, leadsN),
      };
    })
    .sort((a, b) => b.newMrr - a.newMrr || b.leads - a.leads);

  const totalSpend = [...spendByChannel.values()].reduce((s, v) => s + v.spend, 0);
  const totalLeads = [...leadsByChannel.values()].reduce((s, v) => s + v, 0);
  const cacAll = cac(totalSpend, totalCustomers);

  // Funnel stages from available data.
  const qualified = subs.filter((s) => within(s.created_at, from, to) && s.qualified).length;
  const funnel = [
    { stage: 'Leads', count: totalLeads },
    { stage: 'Qualified', count: qualified },
    { stage: 'Paying customers', count: totalCustomers },
  ];

  // Data-quality warnings.
  const dq: { label: string; count: number }[] = [];
  const leadsNoSource = subs.filter((s) => within(s.created_at, from, to) && s.channel === 'direct_unknown').length;
  if (leadsNoSource) dq.push({ label: 'Leads without a usable source', count: leadsNoSource });
  const unattributedCustomers = [...custByChannel.entries()].find(([ch]) => ch === 'direct_unknown')?.[1]?.customers ?? 0;
  if (unattributedCustomers) dq.push({ label: 'Paying customers with no attributed source', count: unattributedCustomers });
  const spendNoCampaign = spendRows.filter((r) => within((r.date as string) ?? null, from, to) && lc(r.channel as string) === 'google_ads' && !r.campaign_id).length;
  if (spendNoCampaign) dq.push({ label: 'Paid spend rows without a campaign id', count: spendNoCampaign });
  const spendNoLeads = bySource.filter((s) => s.spend > 0 && s.leads === 0).length;
  if (spendNoLeads) dq.push({ label: 'Channels with spend but no tracked leads', count: spendNoLeads });

  return {
    targets,
    rangeLabel,
    totals: {
      spend: totalSpend,
      leads: totalLeads,
      customers: totalCustomers,
      newMrr: totalMrr,
      cpl: cpl(totalSpend, totalLeads),
      cac: cacAll,
      ltv: ltvValue,
      payback: paybackMonths(cacAll, targets.defaultSubscriptionPrice),
      ltvCac: ltvCacRatio(ltvValue, cacAll),
    },
    bySource,
    funnel,
    dataQuality: dq,
    changeLog,
  };
}
