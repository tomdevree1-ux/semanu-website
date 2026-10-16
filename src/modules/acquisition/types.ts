/**
 * Acquisition domain types (Fase 1). Pure — no server-only, no DB — so the calc +
 * guardrail engine is unit-testable in isolation.
 */
export type Status =
  | 'healthy'
  | 'watch'
  | 'problem'
  | 'too_early'
  | 'tracking_issue'
  | 'cooldown'
  | 'unknown';

/** Economics + guardrail thresholds (one config row: acquisition_targets). */
export type AcquisitionTargets = {
  baseCurrency: string;
  /** Average monthly subscription value, base currency. */
  defaultSubscriptionPrice: number;
  expectedRetentionMonths: number;
  targetLtvCacRatio: number;
  targetPaybackMonths: number;
  minClicksBeforeJudgement: number;
  minLeadsBeforeJudgement: number;
  minCustomersBeforeJudgement: number;
  earlyChurnWindowDays: number;
  campaignCooldownDays: number;
  /** Conversions (ad-conversion events, e.g. leads) a source needs before it is a scale candidate (~30–50, Google Smart Bidding). */
  minConversionsToScale: number;
  /** Budget increase step when scaling, percent (e.g. 20). */
  scaleStepPct: number;
  /** Days a source must be stable (no change) before scaling / re-measuring. */
  stableWindowDays: number;
};

/** Per-source/campaign rollup the dashboard computes from the DB. */
export type SourceMetrics = {
  source: string;
  /** Spend in base currency for the selected period. */
  spend: number;
  clicks: number | null;
  leads: number;
  /** Paying customers attributed to this source. */
  customers: number;
  /** New MRR (base currency) from those customers. */
  newMrr: number;
  /** Customers from this source that cancelled within the early-churn window. */
  earlyChurnCount: number;
  /** Paid traffic that has a gclid but no campaign_id/UTM campaign (can't match spend). */
  hasGclidButNoCampaignId?: boolean;
  /** ISO timestamp of the last logged change for this source (cooldown). */
  lastChangedAt?: string | null;
  changesInLast14Days?: number;
};

/** A computed (not persisted) recommendation for one source. */
export type Recommendation = {
  status: Status;
  title: string;
  meaning: string;
  action: string;
  /** Suggested days until the next review, or null when not applicable. */
  reviewInDays: number | null;
};
