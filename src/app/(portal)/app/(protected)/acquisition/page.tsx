import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getOverview } from '@/modules/acquisition/queries';
import type { Status } from '@/modules/acquisition/types';

export const dynamic = 'force-dynamic';

const RANGES: Record<string, { days: number; label: string }> = {
  '7d': { days: 7, label: 'Last 7 days' },
  '30d': { days: 30, label: 'Last 30 days' },
  '90d': { days: 90, label: 'Last 90 days' },
};

const chf = (n: number) => `CHF ${Math.round(n).toLocaleString('de-CH')}`;
const money = (n: number | null) => (n == null ? 'n/a' : chf(n));
const pct = (n: number | null) => (n == null ? 'n/a' : `${Math.round(n * 100)}%`);
const months = (n: number | null) => (n == null ? 'n/a' : `${n.toFixed(1)} mo`);
const ratio = (n: number | null) => (n == null ? 'n/a' : `${n.toFixed(1)}:1`);

function chip(status: Status): { cls: string; label: string } {
  const map: Record<Status, { cls: string; label: string }> = {
    healthy: { cls: 'bg-ok/10 text-ok', label: 'Healthy' },
    watch: { cls: 'bg-[#fef3c7] text-[#8a5a00]', label: 'Watch' },
    problem: { cls: 'bg-danger/10 text-danger', label: 'Problem' },
    too_early: { cls: 'bg-navy/10 text-navy', label: 'Too early' },
    tracking_issue: { cls: 'bg-[#fef3c7] text-[#8a5a00]', label: 'Tracking' },
    cooldown: { cls: 'bg-navy/10 text-navy', label: 'Cooldown' },
    unknown: { cls: 'bg-ink/10 text-ink-soft', label: 'Unknown' },
  };
  return map[status];
}

function Kpi({ label, value, sub, tone = 'ink' }: { label: string; value: string; sub?: string; tone?: 'ink' | 'ok' | 'danger' | 'navy' }) {
  const toneCls = { ink: 'text-ink', ok: 'text-ok', danger: 'text-danger', navy: 'text-navy' }[tone];
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{label}</div>
      <div className={`mt-1 font-display text-2xl ${toneCls}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink-soft">{sub}</div> : null}
    </div>
  );
}

export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requirePermission('acquisition.read');
  const canManage = (await getUserPermissions()).includes('acquisition.manage');
  const sp = await searchParams;
  const rangeKey = sp.range && RANGES[sp.range] ? sp.range : '30d';
  const { days, label } = RANGES[rangeKey];
  const to = new Date();
  const from = new Date(Date.now() - days * 86_400_000);
  const o = await getOverview(from.toISOString(), to.toISOString(), label);

  const t = o.targets;
  const ceiling = Math.min((t.defaultSubscriptionPrice * t.expectedRetentionMonths) / t.targetLtvCacRatio, t.defaultSubscriptionPrice * t.targetPaybackMonths);
  const cacTone = o.totals.cac == null ? 'navy' : o.totals.cac <= ceiling ? 'ok' : 'danger';
  const maxMrr = Math.max(1, ...o.bySource.map((s) => s.newMrr));
  const maxFunnel = Math.max(1, ...o.funnel.map((f) => f.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-soft">amai platform</p>
          <h1 className="font-display text-3xl text-ink">Acquisition</h1>
          <p className="mt-1 max-w-prose text-sm text-ink-soft">
            What each channel costs and what it pays back. Calm by design: with little data most rows read “too early” — that is correct.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-pill border border-ink/15 text-sm">
            {Object.entries(RANGES).map(([k, v]) => (
              <Link key={k} href={`/app/acquisition?range=${k}`} className={`px-3 py-1.5 ${k === rangeKey ? 'bg-navy text-white' : 'bg-white text-ink-soft hover:bg-ink/5'}`}>
                {v.label.replace('Last ', '')}
              </Link>
            ))}
          </div>
          {canManage ? (
            <Link href="/app/acquisition/spend" className="rounded-pill bg-mint px-3.5 py-1.5 text-sm font-semibold text-ink">
              Enter ad spend
            </Link>
          ) : null}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Spend" value={chf(o.totals.spend)} sub={label} />
        <Kpi label="Leads" value={String(o.totals.leads)} />
        <Kpi label="Paying customers" value={String(o.totals.customers)} />
        <Kpi label="New MRR" value={chf(o.totals.newMrr)} />
        <Kpi label="Cost / lead" value={money(o.totals.cpl)} />
        <Kpi label="CAC" value={money(o.totals.cac)} sub={`limit ${chf(ceiling)}`} tone={cacTone} />
        <Kpi label="LTV" value={chf(o.totals.ltv)} sub={`${t.defaultSubscriptionPrice}×${t.expectedRetentionMonths}mo`} />
        <Kpi label="Payback" value={months(o.totals.payback)} sub={`target ${t.targetPaybackMonths}mo`} />
        <Kpi label="LTV:CAC" value={ratio(o.totals.ltvCac)} sub={`target ${t.targetLtvCacRatio}:1`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Where do leads drop off?</h2>
          <div className="mt-4 space-y-2.5">
            {o.funnel.map((f) => (
              <div key={f.stage}>
                <div className="flex justify-between text-sm text-ink-soft"><span>{f.stage}</span><span className="font-semibold text-ink">{f.count}</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-ink/5">
                  <div className="h-2.5 rounded-full bg-navy" style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MRR by channel */}
        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Which channels create MRR?</h2>
          {o.bySource.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No data in this range yet.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {o.bySource.slice(0, 8).map((s) => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm text-ink-soft">
                    <span className="capitalize">{s.source.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-ink">{chf(s.newMrr)} · {s.customers} cust · {s.leads} leads</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-ink/5">
                    <div className="h-2.5 rounded-full bg-mint" style={{ width: `${(s.newMrr / maxMrr) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Source table */}
      <section className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              <th className="p-3">Source</th><th className="p-3">Spend</th><th className="p-3">Leads</th><th className="p-3">Cust.</th>
              <th className="p-3">L→C</th><th className="p-3">New MRR</th><th className="p-3">CPL</th><th className="p-3">CAC</th>
              <th className="p-3">Payback</th><th className="p-3">LTV:CAC</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {o.bySource.map((s) => {
              const c = chip(s.recommendation.status);
              return (
                <tr key={s.source} className="border-b border-ink/5 align-top">
                  <td className="p-3 font-semibold capitalize text-ink">{s.source.replace(/_/g, ' ')}</td>
                  <td className="p-3">{chf(s.spend)}</td><td className="p-3">{s.leads}</td><td className="p-3">{s.customers}</td>
                  <td className="p-3">{pct(s.convRate)}</td><td className="p-3">{chf(s.newMrr)}</td><td className="p-3">{money(s.cpl)}</td>
                  <td className="p-3">{money(s.cac)}</td><td className="p-3">{months(s.payback)}</td><td className="p-3">{ratio(s.ltvCac)}</td>
                  <td className="p-3"><span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span></td>
                </tr>
              );
            })}
            {o.bySource.length === 0 ? (
              <tr><td colSpan={11} className="p-6 text-center text-ink-soft">No sources yet. Enter ad spend and let leads come in.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* Recommendations */}
      <section className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">What to do (and what to leave alone)</h2>
        <div className="mt-3 space-y-3">
          {o.bySource.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing to recommend yet — collect data first.</p>
          ) : (
            o.bySource.map((s) => {
              const c = chip(s.recommendation.status);
              return (
                <div key={s.source} className="flex gap-3 rounded-lg border border-ink/10 p-3">
                  <span className={`mt-0.5 h-fit rounded-pill px-2 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>
                  <div>
                    <div className="font-semibold text-ink"><span className="capitalize">{s.source.replace(/_/g, ' ')}</span> — {s.recommendation.title}</div>
                    <div className="text-sm text-ink-soft">{s.recommendation.meaning}</div>
                    <div className="mt-1 text-sm text-ink"><span className="font-semibold">Do:</span> {s.recommendation.action}{s.recommendation.reviewInDays != null ? ` · review in ${s.recommendation.reviewInDays}d` : ''}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data quality */}
        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Data quality</h2>
          {o.dataQuality.length === 0 ? (
            <p className="mt-3 text-sm text-ok">No tracking gaps detected.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {o.dataQuality.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-soft">{d.label}</span>
                  <span className="rounded-pill bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Change log */}
        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Recent marketing changes</h2>
          {o.changeLog.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No changes logged yet. Log changes here to protect against doom-loop optimizing.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {o.changeLog.map((c, i) => (
                <li key={i} className="border-b border-ink/5 pb-2">
                  <div className="font-semibold capitalize text-ink">{c.channel.replace(/_/g, ' ')} — {c.change_type}</div>
                  <div className="text-ink-soft">{c.reason ?? ''} · {new Date(c.changed_at).toLocaleDateString('de-CH')}{c.cooldown_until ? ` · cooldown until ${new Date(c.cooldown_until).toLocaleDateString('de-CH')}` : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
