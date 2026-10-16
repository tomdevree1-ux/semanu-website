/**
 * PURE follow-up worklist logic (P17 / WAF-3.2). No DB, no env, no secrets — so the read-only query module can
 * use it and the unit tests can exercise it directly. Turns the read-only P15 + P16 signals already on a
 * delivery row into (a) a priority bucket + reason for the sales worklist and (b) an engagement-insights
 * summary. Mutates nothing; engagement never changes funnel status — this only classifies for display.
 *
 * Open/click are tracking-pixel signals (P16): they only ever exist on a row when tracking was on, and existing
 * values are always surfaced (per the P16 display rule "enabled OR value exists"). The buckets therefore trigger
 * on value presence; `openClickEnabled` is threaded through for parity with the P16 rule + the insights gate.
 */

export type WorklistBucket =
  | 'delivery_problem'    // bounced or complained — the lead never got it / asked to stop
  | 'follow_up_due'       // a planned follow-up date has arrived
  | 'clicked'             // clicked a link (strong intent) and not yet followed up
  | 'opened_no_follow_up' // opened the report and not yet followed up
  | 'delivered_cold'      // delivered, not opened, going cold
  | 'none';               // nothing actionable right now

/** Days after delivery with no open before a report is considered "cold". Locked P17 decision: 3 days. */
export const DELIVERED_COLD_DAYS = 3;

const PRIORITY: Record<WorklistBucket, number> = {
  delivery_problem: 1,
  follow_up_due: 2,
  clicked: 3,
  opened_no_follow_up: 4,
  delivered_cold: 5,
  none: 99,
};

/** The read-only signal slice a delivery row contributes (P15 status/follow-up + P16 engagement). */
export type WorklistSignal = {
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  followUpStatus: string; // none | planned | done
  followUpAt: string | null;
  archivedAt: string | null;
};

export type WorklistClassification = {
  bucket: WorklistBucket;
  priority: number; // lower = more urgent (sort ascending)
  reason: string;
  actionable: boolean; // bucket !== 'none'
};

function mk(bucket: WorklistBucket, reason = ''): WorklistClassification {
  return { bucket, priority: PRIORITY[bucket], reason, actionable: bucket !== 'none' };
}

/**
 * Classify one delivery into a worklist bucket. Highest-urgency match wins. A `done` follow-up or an archived
 * row is never actionable. A bounce/complaint outranks everything (the report never landed). Open/click buckets
 * require the value to exist (which, per P16, only happens when tracking captured it) and that there is no
 * follow-up yet; `openClickEnabled` keeps parity with the P16 "enabled OR value exists" rule.
 */
export function classifyWorklistItem(
  s: WorklistSignal,
  opts: { openClickEnabled: boolean; nowMs: number },
): WorklistClassification {
  if (s.archivedAt || s.followUpStatus === 'done') return mk('none');

  if (s.bouncedAt) return mk('delivery_problem', 'Delivery failed — check the contact email');
  if (s.complainedAt) return mk('delivery_problem', 'Marked as spam — pause outreach to this contact');

  if (s.followUpStatus === 'planned' && s.followUpAt && Date.parse(s.followUpAt) <= opts.nowMs) {
    return mk('follow_up_due', 'Follow up is due');
  }

  const noFollowUp = s.followUpStatus === 'none';
  const clickVisible = !!s.clickedAt && (opts.openClickEnabled || !!s.clickedAt);
  if (noFollowUp && clickVisible) return mk('clicked', 'Clicked a link — strong intent, no follow up yet');

  const openVisible = !!s.openedAt && (opts.openClickEnabled || !!s.openedAt);
  if (noFollowUp && openVisible) return mk('opened_no_follow_up', 'Opened the report — no follow up yet');

  if (
    noFollowUp &&
    s.deliveredAt &&
    !s.openedAt &&
    opts.nowMs - Date.parse(s.deliveredAt) >= DELIVERED_COLD_DAYS * 86_400_000
  ) {
    return mk('delivered_cold', `Delivered, not opened in ${DELIVERED_COLD_DAYS}+ days`);
  }

  return mk('none');
}

/** Stable worklist sort: most urgent bucket first, then oldest-sent first (most overdue), then oldest delivery. */
export function compareWorklist(
  a: { priority: number; sentAt: string | null; deliveredAt: string | null },
  b: { priority: number; sentAt: string | null; deliveredAt: string | null },
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const at = Date.parse(a.sentAt ?? a.deliveredAt ?? '') || 0;
  const bt = Date.parse(b.sentAt ?? b.deliveredAt ?? '') || 0;
  return at - bt; // older first
}

// ── engagement insights (compact, read-only) ────────────────────────────────
export type EngagementCountInput = {
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
};

export type EngagementInsights = {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  deliveredRate: number; // % of total
  openRate: number; // % of delivered
  clickRate: number; // % of delivered
  bounceRate: number; // % of total
  complaintRate: number; // % of total
  openClickVisible: boolean; // gate display of open/click figures (P16 rule)
};

/** One-decimal percentage, divide-by-zero safe. */
function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

/**
 * Summarise a set of deliveries into compact insights. delivered/bounced/complained are always counted;
 * open/click figures are computed too, but `openClickVisible` (enabled OR any value present) tells the UI
 * whether to show them, keeping open/click privacy-gated and consistent with P16.
 */
export function summariseEngagement(
  rows: EngagementCountInput[],
  opts: { openClickEnabled: boolean },
): EngagementInsights {
  const total = rows.length;
  const c = (pred: (r: EngagementCountInput) => boolean) => rows.reduce((n, r) => (pred(r) ? n + 1 : n), 0);
  const delivered = c((r) => !!r.deliveredAt);
  const opened = c((r) => !!r.openedAt);
  const clicked = c((r) => !!r.clickedAt);
  const bounced = c((r) => !!r.bouncedAt);
  const complained = c((r) => !!r.complainedAt);
  return {
    total,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    deliveredRate: pct(delivered, total),
    openRate: pct(opened, delivered),
    clickRate: pct(clicked, delivered),
    bounceRate: pct(bounced, total),
    complaintRate: pct(complained, total),
    openClickVisible: opts.openClickEnabled || opened > 0 || clicked > 0,
  };
}
