import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/security/rbac';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSpendEntry } from '@/modules/acquisition/actions';

export const dynamic = 'force-dynamic';

const CHANNELS = ['google_ads', 'organic_search', 'google_business', 'outbound_email', 'cold_call', 'referral', 'partner', 'direct_unknown'];
const field = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-navy';

export default async function SpendPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requirePermission('acquisition.manage');
  const sp = await searchParams;
  const db = createAdminClient() as unknown as SupabaseClient;
  const { data } = await db.from('marketing_spend_daily').select('*').order('date', { ascending: false }).limit(50);
  const rows = (data ?? []) as Array<Record<string, string | number | null>>;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/app/acquisition" className="text-sm text-ink-soft hover:text-ink">← Acquisition</Link>
        <h1 className="mt-1 font-display text-3xl text-ink">Ad spend</h1>
        <p className="mt-1 text-sm text-ink-soft">Enter spend per day and channel. This is what makes CAC and payback real, before any Google Ads API sync.</p>
      </div>

      {sp.ok ? <p className="rounded-lg bg-ok/10 px-4 py-2 text-sm text-ok">Spend saved.</p> : null}
      {sp.error === 'fx' ? <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">Add an exchange rate to the base currency for non-base spend.</p> : null}
      {sp.error === 'invalid' ? <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">Check the fields and try again.</p> : null}

      <form action={createSpendEntry} className="grid gap-4 rounded-xl border border-ink/10 bg-white p-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">Date<input type="date" name="date" required defaultValue={today} className={field} /></label>
        <label className="text-sm font-semibold text-ink">Channel
          <select name="channel" required defaultValue="google_ads" className={field}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-ink">Campaign (optional)<input name="campaign" className={field} /></label>
        <label className="text-sm font-semibold text-ink">Campaign id (for matching)<input name="campaign_id" placeholder="e.g. {campaignid}" className={field} /></label>
        <label className="text-sm font-semibold text-ink">Spend amount<input name="spend_amount" type="number" step="0.01" min="0" required className={field} /></label>
        <label className="text-sm font-semibold text-ink">Currency<input name="currency" defaultValue="CHF" maxLength={3} required className={field} /></label>
        <label className="text-sm font-semibold text-ink">Exchange rate → base (if not CHF)<input name="exchange_rate_to_base" type="number" step="0.0001" min="0" className={field} /></label>
        <label className="text-sm font-semibold text-ink">Clicks (optional)<input name="clicks" type="number" min="0" className={field} /></label>
        <label className="text-sm font-semibold text-ink">Impressions (optional)<input name="impressions" type="number" min="0" className={field} /></label>
        <label className="text-sm font-semibold text-ink sm:col-span-2">Notes (optional)<input name="notes" className={field} /></label>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-pill bg-navy px-5 py-2 text-sm font-semibold text-white">Save spend</button>
        </div>
      </form>

      <section className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              <th className="p-3">Date</th><th className="p-3">Channel</th><th className="p-3">Campaign</th><th className="p-3">Spend</th><th className="p-3">Base</th><th className="p-3">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-b border-ink/5">
                <td className="p-3">{String(r.date)}</td>
                <td className="p-3 capitalize">{String(r.channel).replace(/_/g, ' ')}</td>
                <td className="p-3 text-ink-soft">{(r.campaign as string) ?? '—'}</td>
                <td className="p-3">{r.spend_amount} {r.currency}</td>
                <td className="p-3">{r.spend_amount_base != null ? `CHF ${r.spend_amount_base}` : '—'}</td>
                <td className="p-3">{(r.clicks as number) ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-ink-soft">No spend entered yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
