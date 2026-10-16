/**
 * Read-only email engagement summary (P16 / WAF-3.1). Presentational only — no hooks, no actions, no secrets —
 * so it renders in both the server-rendered deliveries list (`compact`) and the client DeliverPanel (`detail`).
 *
 * Reliable signals (delivered / bounced / complained) always show when present. Opened / clicked are indicative
 * (tracking pixels can be blocked) and are shown only when open/click tracking is enabled OR a value already
 * exists; a caption makes the caveat explicit. The webhook stores only timestamps + counts (no IP / user-agent).
 */
export type EngagementView = {
  deliveredAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  firstOpenedAt: string | null;
  openedAt: string | null;
  openCount: number;
  clickedAt: string | null;
  clickCount: number;
  lastEventAt: string | null;
  bounceType: string | null;
};

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}
function d(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export function EngagementSummary({
  e,
  openClickEnabled,
  variant = 'detail',
}: {
  e: EngagementView;
  openClickEnabled: boolean;
  variant?: 'detail' | 'compact';
}) {
  const showOpens = openClickEnabled || !!e.openedAt || !!e.firstOpenedAt;
  const showClicks = openClickEnabled || !!e.clickedAt;
  const hasAny = e.deliveredAt || e.bouncedAt || e.complainedAt || e.openedAt || e.clickedAt;

  if (variant === 'compact') {
    const chip = 'rounded-pill bg-ink/5 px-2 py-0.5 text-xs';
    return (
      <span className="flex flex-wrap items-center gap-1">
        {e.deliveredAt ? <span className={`${chip} text-ok`}>Delivered</span> : null}
        {e.bouncedAt ? <span className={`${chip} text-danger`}>Bounced</span> : null}
        {e.complainedAt ? <span className={`${chip} text-danger`}>Spam</span> : null}
        {showOpens && e.openedAt ? <span className={`${chip} text-ink-soft`}>Opened{e.openCount > 1 ? ` ×${e.openCount}` : ''}</span> : null}
        {showClicks && e.clickedAt ? <span className={`${chip} text-ink-soft`}>Clicked{e.clickCount > 1 ? ` ×${e.clickCount}` : ''}</span> : null}
        {!hasAny ? <span className="text-ink-soft">—</span> : null}
      </span>
    );
  }

  return (
    <div className="border-t border-ink/10 pt-3">
      <p className="text-sm font-medium text-ink">Engagement</p>
      {!hasAny ? (
        <p className="mt-1 text-sm text-ink-soft">No delivery events received yet.</p>
      ) : (
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Delivered" value={dt(e.deliveredAt)} tone={e.deliveredAt ? 'ok' : 'muted'} />
          {e.bouncedAt ? <Row label={`Bounced${e.bounceType ? ` (${e.bounceType})` : ''}`} value={dt(e.bouncedAt)} tone="danger" /> : null}
          {e.complainedAt ? <Row label="Spam complaint" value={dt(e.complainedAt)} tone="danger" /> : null}
          {showOpens ? <Row label="Opened" value={e.openedAt ? `${dt(e.openedAt)}${e.openCount > 1 ? ` · ${e.openCount}×` : ''}` : '—'} tone="muted" /> : null}
          {showClicks ? <Row label="Clicked" value={e.clickedAt ? `${dt(e.clickedAt)}${e.clickCount > 1 ? ` · ${e.clickCount}×` : ''}` : '—'} tone="muted" /> : null}
          <Row label="Last event" value={dt(e.lastEventAt)} tone="muted" />
        </dl>
      )}
      {(showOpens || showClicks) ? (
        <p className="mt-2 text-xs text-ink-soft">Open and click tracking are indicative and may be blocked by email clients.</p>
      ) : null}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'danger' | 'muted' }) {
  const cls = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className={`break-words ${cls}`}>{value}</dd>
    </div>
  );
}
