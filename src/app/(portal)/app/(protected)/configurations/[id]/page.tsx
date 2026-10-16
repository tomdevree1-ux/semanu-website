import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getConfiguration } from '@/modules/configurations/queries';
import { createQuoteFromConfiguration } from '@/modules/configurations/actions';
import { lineLabel } from '@/modules/configurations/labels';

function chf(n: number): string {
  return Math.round(n).toLocaleString('de-CH').replace(/,/g, "'");
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const ERRORS: Record<string, string> = {
  permission: 'You do not have permission to create a quote.',
  notfound: 'Configuration not found.',
  archived: 'Restore this configuration before creating a quote.',
  nolines: 'This configuration has no lines to quote.',
  company: 'Could not create the company from the lead.',
  quote: 'Could not create the quote.',
};

export default async function ConfigurationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('configurations.read');
  const { id } = await params;
  const sp = await searchParams;
  const cfg = await getConfiguration(id);
  if (!cfg) notFound();

  const current = cfg.versions.find((v) => v.version === cfg.currentVersion) ?? cfg.versions[0] ?? null;
  const lines = current?.payload.lines ?? [];
  const monthlyLines = lines.filter((l) => l.per === 'month');
  const onceLines = lines.filter((l) => l.per !== 'month');

  return (
    <div className="max-w-3xl">
      <Link href="/app/configurations" className="text-sm text-ink-soft hover:underline">← Configurations</Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{cfg.configNumber}</h1>
          <p className="mt-1 text-ink-soft">{cfg.title} · {cfg.situation === 'new' ? 'New site' : 'Existing site'} · v{cfg.currentVersion}</p>
        </div>
        <span className="rounded-pill border border-ink/15 px-3 py-1 text-xs uppercase tracking-wide text-ink-soft">{cfg.status}</span>
      </div>

      {sp.error ? (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {ERRORS[sp.error] ?? 'Something went wrong.'}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 rounded-xl border border-ink/10 p-4 text-sm sm:grid-cols-2">
        <div><span className="text-ink-soft">Lead</span><br />{cfg.leadName ?? '—'}{cfg.leadEmail ? ` · ${cfg.leadEmail}` : ''}</div>
        <div><span className="text-ink-soft">Company</span><br />{cfg.companyName ?? (cfg.leadCompany || '—')}</div>
        <div><span className="text-ink-soft">Source</span><br />{cfg.source === 'inbound_web' ? 'Website configurator' : 'Portal'}</div>
        <div><span className="text-ink-soft">Created</span><br />{fmtDate(cfg.createdAt)}</div>
      </div>

      <div className="mt-6 rounded-xl border border-ink/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl text-ink">Current configuration (v{cfg.currentVersion})</h2>
          {cfg.quoteId ? (
            <Link href={`/app/quotes/${cfg.quoteId}`} className="pa-btn pa-btn-primary !py-2">View quote →</Link>
          ) : !cfg.isArchived ? (
            <form action={createQuoteFromConfiguration}>
              <input type="hidden" name="configurationId" value={cfg.id} />
              <button type="submit" className="pa-btn pa-btn-primary !py-2">Create quote →</button>
            </form>
          ) : null}
        </div>

        <ul className="mt-4 divide-y divide-ink/5 border-y border-ink/10">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-ink">{lineLabel(l.key)}</span>
              <span className="font-mono text-ink">
                {chf(l.amount)} CHF <span className="text-ink-soft">{l.per === 'month' ? '/m' : 'once'}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2 text-sm">
          <span><span className="text-ink-soft">Monthly</span> <span className="font-mono text-ink">{chf(monthlyLines.reduce((a, l) => a + l.amount, 0))} CHF /m</span></span>
          <span><span className="text-ink-soft">One time</span> <span className="font-mono text-ink">{chf(onceLines.reduce((a, l) => a + l.amount, 0))} CHF</span></span>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-xl text-ink">History</h2>
        <p className="text-sm text-ink-soft">Every edit is a new version. Nothing is overwritten.</p>
        <ol className="mt-3 overflow-hidden rounded-xl border border-ink/10">
          {cfg.versions.map((v) => (
            <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-4 py-3 text-sm ${v.version === cfg.currentVersion ? 'bg-ink/[0.03]' : ''}`}>
              <span className="flex items-center gap-2">
                <span className="rounded-pill bg-ink/5 px-2 py-0.5 font-mono text-xs text-ink">v{v.version}</span>
                {v.version === cfg.currentVersion ? <span className="text-xs uppercase tracking-wide text-ok">current</span> : null}
                <span className="text-ink-soft">{v.createdByName} · {fmtDate(v.createdAt)}</span>
              </span>
              <span className="font-mono text-ink-soft">{chf(v.monthly)} CHF/m · {chf(v.oneTime)} CHF once</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
