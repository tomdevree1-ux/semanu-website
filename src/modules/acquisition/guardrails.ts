/**
 * The calm engine. Turns a source's metrics + the targets into ONE status +
 * recommendation. Order matters: operational/tracking problems first, then
 * "too early" (protect against premature conclusions), then economics. The
 * default answer for thin data is "hold", never "change now".
 */
import { cac as cacFn, maxAllowedCac } from './calc';
import type { AcquisitionTargets, Recommendation, SourceMetrics } from './types';

const DAY_MS = 86_400_000;

/** Whole days between an ISO timestamp and `now`, or null if absent/invalid. */
export function daysSince(iso: string | null | undefined, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / DAY_MS);
}

const round = (n: number) => Math.round(n);

export function classifySource(
  m: SourceMetrics,
  t: AcquisitionTargets,
  now: number = Date.now(),
): Recommendation {
  // 1. Change fatigue — too many changes to read clean data.
  if ((m.changesInLast14Days ?? 0) > 3) {
    return {
      status: 'cooldown',
      title: 'Change fatigue',
      meaning: 'Too many changes in the last 14 days to read clean data on this source.',
      action: 'Stop changing this source and let the data settle.',
      reviewInDays: t.campaignCooldownDays,
    };
  }

  // 2. Cooldown — a change was made recently; still learning.
  const sinceChange = daysSince(m.lastChangedAt, now);
  if (sinceChange != null && sinceChange < t.campaignCooldownDays) {
    return {
      status: 'cooldown',
      title: 'Learning / cooldown',
      meaning: 'A change was made recently; the channel is still settling.',
      action: 'Do not judge performance until the cooldown ends.',
      reviewInDays: t.campaignCooldownDays - sinceChange,
    };
  }

  // 3. Spend but no leads — almost always a tracking gap, not a bad campaign.
  if (m.spend > 0 && m.leads === 0) {
    return {
      status: 'tracking_issue',
      title: 'Spend but no leads',
      meaning: 'Money is going out but no leads are tracked — usually a tracking gap.',
      action: 'Check UTM/GCLID capture, the landing page and the form events before judging.',
      reviewInDays: 3,
    };
  }

  // 4. Paid clicks that cannot be matched to spend.
  if (m.hasGclidButNoCampaignId) {
    return {
      status: 'tracking_issue',
      title: 'Paid clicks without campaign id',
      meaning: 'Paid traffic has a GCLID but no campaign_id / UTM campaign, so spend cannot be matched reliably.',
      action: 'Fix the Final URL suffix / tracking template (ValueTrack {campaignid}).',
      reviewInDays: 3,
    };
  }

  // 5. Too early — not enough leads to read the source.
  if (m.leads < t.minLeadsBeforeJudgement) {
    return {
      status: 'too_early',
      title: 'Too early to judge',
      meaning: `Only ${m.leads} lead(s) — below the ${t.minLeadsBeforeJudgement} needed to read this source.`,
      action: 'Hold. Keep collecting data.',
      reviewInDays: 14,
    };
  }

  // 6. Leads but no customers — a sales/quality question, not an ads one.
  if (m.customers === 0) {
    return {
      status: 'watch',
      title: 'Leads but no customers',
      meaning: 'Leads come in but none have converted to a subscription yet.',
      action: 'Check lead quality and sales follow-up before touching the ads.',
      reviewInDays: 14,
    };
  }

  // 7. High early churn — fit/expectation problem, only once enough customers.
  if (m.customers >= t.minCustomersBeforeJudgement && m.earlyChurnCount / m.customers >= 0.34) {
    return {
      status: 'problem',
      title: 'High early churn',
      meaning: 'A large share of this source’s customers cancel quickly — likely a fit or expectation problem.',
      action: 'Review lead quality, expectations, onboarding and channel fit.',
      reviewInDays: 30,
    };
  }

  // 8. Economics.
  const cacVal = cacFn(m.spend, m.customers);
  const ceiling = maxAllowedCac(
    t.defaultSubscriptionPrice,
    t.expectedRetentionMonths,
    t.targetLtvCacRatio,
    t.targetPaybackMonths,
  );
  if (cacVal == null) {
    return {
      status: 'too_early',
      title: 'No CAC yet',
      meaning: 'No paying customers attributed to this source yet.',
      action: 'Hold. Keep collecting data.',
      reviewInDays: 14,
    };
  }
  if (cacVal <= ceiling) {
    // Scaling is CONVERSION-based, not calendar-based: enough conversion volume
    // (Google Smart Bidding calibrates around ~30–50 events / 2–3 cycles) AND a
    // stable window with no recent change. Below that, healthy but "hold to scale".
    const stable = (m.changesInLast14Days ?? 0) <= 1 && (sinceChange == null || sinceChange >= t.stableWindowDays);
    if (m.leads >= t.minConversionsToScale && stable) {
      return {
        status: 'healthy',
        title: 'Scale candidate',
        meaning: `CAC ${round(cacVal)} is within the limit (${round(ceiling)}), with ${m.leads} conversions and no recent changes.`,
        action: `Ready to scale IF the campaign is budget-limited (or still has profitable volume). Raise budget ~${t.scaleStepPct}% and re-measure for ${t.stableWindowDays} days before the next step. Avoid big changes that reset the learning phase.`,
        reviewInDays: t.stableWindowDays,
      };
    }
    return {
      status: 'healthy',
      title: 'Economics healthy (hold to scale)',
      meaning: `CAC ${round(cacVal)} is within the limit (${round(ceiling)}), but ${m.leads} conversion(s) is below the ${t.minConversionsToScale} for confident scaling.`,
      action: 'Keep running. Collect more conversions before scaling, and only in small steps.',
      reviewInDays: 14,
    };
  }
  if (m.customers < t.minCustomersBeforeJudgement) {
    return {
      status: 'watch',
      title: 'CAC above target (low sample)',
      meaning: `CAC ${round(cacVal)} is above the limit (${round(ceiling)}) but only ${m.customers} customer(s) — too few to act on.`,
      action: 'Do not overreact yet. Collect more data.',
      reviewInDays: 14,
    };
  }
  return {
    status: 'problem',
    title: 'CAC above target',
    meaning: `CAC ${round(cacVal)} exceeds the healthy limit (${round(ceiling)}) with enough data.`,
    action: 'Investigate targeting, search terms, landing page and offer.',
    reviewInDays: 14,
  };
}
