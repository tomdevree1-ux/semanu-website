// Signature visual modules, one per service. Each gives its flow a distinct
// look. All labels are passed in (translatable) and rendered as real text in
// the DOM, so search engines and AI systems can read them. Decorative SVG
// connectors are aria-hidden. No neon, no robot clichés, calm and on brand.

import { getTranslations } from 'next-intl/server';
import type { DetailCard, ServiceDetail } from '@/content/serviceDetail';

function Caption({ children }: { children: string }) {
  return <p className="mt-4 text-center font-mono text-xs uppercase tracking-wider text-ink-soft">{children}</p>;
}

/* ── Flow 1 · Websites ─────────────────────────────────────────────
   A layered stack: one connected website built from clear layers. */
export function WebsiteStackVisual({ layers, caption }: { layers: string[]; caption: string }) {
  return (
    <figure className="amai-reveal">
      <div className="rounded-2xl border border-[var(--line-light)] bg-navy p-4 shadow-[var(--shadow-pop)]">
        <ul className="space-y-1.5">
          {layers.map((layer, i) => {
            const top = i === 0;
            return (
              <li
                key={layer}
                className={[
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold',
                  top ? 'bg-mint text-ink' : 'bg-white/8 text-paper',
                ].join(' ')}
              >
                <span className={['font-mono text-xs', top ? 'text-ink/70' : 'text-mint'].join(' ')}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {layer}
              </li>
            );
          })}
        </ul>
      </div>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}

/* ── Flow 1 · Email Marketing ──────────────────────────────────────
   A horizontal journey from signup to repeat business. */
export function EmailJourneyVisual({ steps, caption }: { steps: string[]; caption: string }) {
  return (
    <figure className="amai-reveal">
      <ol className="space-y-1">
        {steps.map((step, i) => (
          <li key={step}>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-3.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint font-mono text-xs font-bold text-ink">
                {i + 1}
              </span>
              <span className="text-sm font-semibold leading-snug text-ink">{step}</span>
            </div>
            {i < steps.length - 1 ? (
              <div aria-hidden className="flex justify-center py-0.5 text-base leading-none text-navy">
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}

/* ── Flow 2 · Marketing Automation ─────────────────────────────────
   A vertical flow: one trigger, then automatic steps on a mint rail. */
export async function AutomationFlowVisual({ nodes, caption }: { nodes: string[]; caption: string }) {
  const t = await getTranslations('serviceUi');
  return (
    <figure className="amai-reveal">
      <ol className="relative ml-3">
        <span aria-hidden className="absolute left-0 top-2 bottom-2 w-px bg-[var(--line-strong)]" />
        {nodes.map((node, i) => {
          const isTrigger = i === 0;
          const isResult = i === nodes.length - 1;
          const tag = isTrigger ? t('trigger') : isResult ? t('result') : t('action');
          return (
            <li key={node} className="relative flex items-center gap-4 pb-3 last:pb-0">
              <span
                aria-hidden
                className={[
                  'relative z-10 -ml-[5px] h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-paper',
                  isTrigger || isResult ? 'bg-mint' : 'bg-navy',
                ].join(' ')}
              />
              <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">{node}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy">{tag}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}

/* ── Flow 2 · Workflow hero ────────────────────────────────────────
   A browser mockup with a vertical step flow, shown beside the H1 on the
   Workflow Automation page. Labels are passed in and rendered as real text. */
function FlowIcon({ name }: { name: 'lead' | 'mail' | 'wait' | 'bell' | 'check' }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'lead':
      return (<svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
    case 'mail':
      return (<svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
    case 'wait':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
    case 'bell':
      return (<svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>);
    case 'check':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>);
  }
}

export function WorkflowHeroFlow({ steps }: { steps: NonNullable<ServiceDetail['heroFlow']> }) {
  return (
    <figure className="amai-reveal mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
      <div className="rounded-2xl border border-white/10 bg-navy p-4 shadow-[0_24px_60px_-24px_rgba(7,34,31,0.55)] sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          </span>
          <span className="flex-1 rounded-md bg-white/10 px-3 py-1 text-center font-mono text-[11px] text-paper/70">amai.ch</span>
        </div>
        <ol>
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint text-navy">
                  <FlowIcon name={s.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-ink">{s.title}</span>
                  <span className="block truncate text-xs text-ink-soft">{s.sub}</span>
                </span>
              </div>
              {i < steps.length - 1 ? (
                <span aria-hidden className="flex justify-center py-1 text-paper/40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

/* ── Flow 2 · Booking ──────────────────────────────────────────────
   A booking interface mock beside the booking steps. */
export async function BookingJourneyVisual({ steps, caption }: { steps: string[]; caption: string }) {
  const t = await getTranslations('serviceUi');
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const pick = 17;
  return (
    <figure className="amai-reveal">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* mock calendar */}
        <div aria-hidden className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">{t('calendar')}</span>
            <span className="h-2 w-2 rounded-full bg-mint" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => (
              <span
                key={d}
                className={[
                  'flex h-6 items-center justify-center rounded text-[11px]',
                  d === pick ? 'bg-navy font-bold text-white' : 'bg-paper text-ink-soft',
                ].join(' ')}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-lg bg-paper-2 py-1.5 text-center text-[11px] text-ink-soft">09:00</span>
            <span className="flex-1 rounded-lg bg-mint py-1.5 text-center text-[11px] font-semibold text-ink">10:30</span>
            <span className="flex-1 rounded-lg bg-paper-2 py-1.5 text-center text-[11px] text-ink-soft">14:00</span>
          </div>
        </div>
        {/* steps */}
        <ol className="flex flex-col justify-center gap-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint font-mono text-[11px] font-bold text-ink">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}

/** Picks the right signature visual for a service id. */
export function ServiceSignature({ id, detail }: { id: string; detail: ServiceDetail }) {
  switch (id) {
    case 'websites':
      return <WebsiteStackVisual layers={detail.visual} caption={detail.visualCaption} />;
    case 'email-marketing':
      return <EmailJourneyVisual steps={detail.visual} caption={detail.visualCaption} />;
    case '3d-configurators':
    case 'marketing-automation':
    case 'consultancy':
      return <AutomationFlowVisual nodes={detail.visual} caption={detail.visualCaption} />;
    case 'booking':
      return <BookingJourneyVisual steps={detail.visual} caption={detail.visualCaption} />;
    case 'business-systems':
    case 'customer-portals':
    case 'crm':
      return (
        <BusinessHubVisual center={detail.hubCenter ?? ''} modules={detail.visual} caption={detail.visualCaption} />
      );
    case 'ai-assistants':
      return <AssistantTypesVisual cards={detail.visualCards ?? []} caption={detail.visualCaption} />;
    default:
      return null;
  }
}

/* ── Flow 3 · Business Systems / Portals / CRM ─────────────────────────
   A central navy hub (the customer's system) with its modules orbiting on
   rounded tiles, joined by dotted spokes. Mirrors the homepage ecosystem
   styling: navy gradient circle, mint ring, mint spoke dots, white tiles with
   a mint accent bar. The hub label wraps to two balanced lines and is auto
   sized so every language fits inside the circle with room left and right. */
export function BusinessHubVisual({
  center,
  modules,
  caption,
}: {
  center: string;
  modules: string[];
  caption: string;
}) {
  const mods = modules.slice(0, 5);
  const n = Math.max(mods.length, 1);

  const CX = 340;
  const CY = 300;
  const HUB_R = 130; // navy hub radius
  const RING_R = 140; // mint ring radius
  const ORBIT = 248; // tile centre distance from the hub
  const TILE_W = 192;
  const TILE_H = 52;
  const HW = TILE_W / 2;
  const HH = TILE_H / 2;

  // Hub label: at most two balanced lines, auto sized to clear the circle with
  // padding on both sides (works for the longer German / French labels too).
  const words = center.trim().split(/\s+/);
  const lines =
    words.length <= 1
      ? words
      : [
          words.slice(0, Math.ceil(words.length / 2)).join(' '),
          words.slice(Math.ceil(words.length / 2)).join(' '),
        ];
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const hubFont = Math.max(16, Math.min(28, Math.floor((2 * HUB_R - 28) / (longest * 0.72))));

  const tiles = mods.map((m, i) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return { m, x: CX + ORBIT * Math.cos(a), y: CY + ORBIT * Math.sin(a) };
  });

  return (
    <figure className="amai-reveal">
      <svg
        viewBox="0 0 680 560"
        className="mx-auto h-auto w-full max-w-[560px]"
        role="img"
        aria-label={`${center}: ${mods.join(', ')}`}
      >
        <defs>
          <radialGradient id="hubVisG" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#243A63" />
            <stop offset="52%" stopColor="#1B2A4A" />
            <stop offset="100%" stopColor="#142039" />
          </radialGradient>
          <filter id="hubVisHubShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#142039" floodOpacity="0.42" />
          </filter>
          <filter id="hubVisTileShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#07221F" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Dotted spokes, mint dot at the hub end. */}
        <g aria-hidden>
          {tiles.map(({ m, x, y }) => {
            const dx = x - CX;
            const dy = y - CY;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const sx = CX + RING_R * ux;
            const sy = CY + RING_R * uy;
            const t = Math.min(HW / (Math.abs(ux) || 1e-6), HH / (Math.abs(uy) || 1e-6));
            const ex = x - (t + 7) * ux;
            const ey = y - (t + 7) * uy;
            return (
              <g key={`spoke-${m}`}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="#1B2A4A"
                  strokeWidth={2}
                  strokeOpacity={0.22}
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                />
                <circle cx={sx} cy={sy} r={5} fill="#6FD3A4" />
              </g>
            );
          })}
        </g>

        {/* Centre hub: navy gradient circle + mint ring + auto sized label. */}
        <circle cx={CX} cy={CY} r={HUB_R} fill="url(#hubVisG)" filter="url(#hubVisHubShadow)" />
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="#93E6BE" strokeWidth={3} opacity={0.9} />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          className="font-display"
          style={{ fontSize: hubFont, letterSpacing: '-0.02em' }}
        >
          {lines.map((ln, i) => (
            <tspan key={i} x={CX} dy={i === 0 ? (lines.length > 1 ? '-0.52em' : '0') : '1.04em'}>
              {ln}
            </tspan>
          ))}
        </text>

        {/* Module tiles: white rounded card + mint accent bar + label. */}
        {tiles.map(({ m, x, y }) => {
          const tx = x - HW;
          const ty = y - HH;
          return (
            <g key={`tile-${m}`}>
              <rect
                x={tx}
                y={ty}
                width={TILE_W}
                height={TILE_H}
                rx={16}
                fill="#FFFFFF"
                stroke="rgba(7,34,31,0.12)"
                strokeWidth={1.5}
                filter="url(#hubVisTileShadow)"
              />
              <rect x={x - 22} y={ty + TILE_H - 6} width={44} height={5} rx={2.5} fill="#93E6BE" />
              <text
                x={x}
                y={y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1B2A4A"
                className="font-sans"
                style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                {m}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}

/* ── Flow 3 · AI Assistants ────────────────────────────────────────
   Calm assistant cards, each with one clear job and a soft status dot. */
export function AssistantTypesVisual({ cards, caption }: { cards: DetailCard[]; caption: string }) {
  return (
    <figure className="amai-reveal">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="amai-pulse h-2.5 w-2.5 rounded-full bg-mint" />
              <span className="font-display text-base text-ink">{c.title}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
          </div>
        ))}
      </div>
      <figcaption>
        <Caption>{caption}</Caption>
      </figcaption>
    </figure>
  );
}
