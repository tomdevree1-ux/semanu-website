import { Brand } from './Brand';
import { BrandText } from './BrandText';

type Point = { title: string; text: string };

/* A segmented "pie": a navy to mint donut whose numbered slices each map to a
   point block. All text stays horizontal. Desktop shows the wheel with the
   points around it; phones stack the pie above the list.

   The geometry is derived from the number of points, so the same component
   renders a clean wheel for five reasons (so-funktioniert) or six features
   (the SEO landing pages). Segment 1 is always centred at the top. */

// ── Colour ramp: navy -> mint, sampled across the segments (brand family).
// Anchor stops of the ramp; intermediate segments interpolate between them.
const RAMP: Array<[number, number, number]> = [
  [0x1b, 0x2a, 0x4a], // navy
  [0x2f, 0x5a, 0x60],
  [0x3e, 0x8e, 0x76],
  [0x62, 0xc4, 0x9a],
  [0x93, 0xe6, 0xbe], // mint
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

/** Sample the navy -> mint ramp at t in [0, 1], returns "#rrggbb". */
function rampColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const span = RAMP.length - 1;
  const pos = clamped * span;
  const i = Math.min(span - 1, Math.floor(pos));
  const f = pos - i;
  const [r1, g1, b1] = RAMP[i];
  const [r2, g2, b2] = RAMP[i + 1];
  const r = lerp(r1, r2, f);
  const g = lerp(g1, g2, f);
  const b = lerp(b1, b2, f);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Pick a legible text colour (white on dark segments, ink on light ones). */
function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance; mint/light-green reads better with ink text.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#07221F' : '#FFFFFF';
}

/** Per-segment colours for n equal segments. */
function segColors(n: number) {
  const bg: string[] = [];
  const fg: string[] = [];
  for (let i = 0; i < n; i++) {
    // Spread the ramp evenly; with n === 1 keep the navy anchor.
    const t = n > 1 ? i / (n - 1) : 0;
    const c = rampColor(t);
    bg.push(c);
    fg.push(textOn(c));
  }
  return { bg, fg };
}

/** conic-gradient string: n equal slices with thin white separators, slice 1
    centred at the top. */
function conic(bg: string[]): string {
  const n = bg.length;
  const seg = 360 / n;
  const gap = 1; // degrees of white separator
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const start = i * seg;
    const end = (i + 1) * seg - gap;
    parts.push(`${bg[i]} ${start}deg ${end}deg`);
    parts.push(`#fff ${end}deg ${start + seg}deg`);
  }
  // Rotate so the first slice is centred at the top (12 o'clock).
  return `conic-gradient(from ${-seg / 2}deg,${parts.join(',')})`;
}

/** Badge centre as a percentage of the pie box, on the segment-centre angle at
    ~37% radius from the middle (the middle of the ring). Shared by the badges
    inside the pie and by the flanking text blocks, so a point always sits at
    the same height as its own slice. */
const BADGE_RADIUS = 37; // percent of half-box
function badgePct(i: number, n: number): { top: number; left: number } {
  const seg = 360 / n;
  const angle = (i * seg * Math.PI) / 180; // 0 = top, clockwise
  const top = 50 - BADGE_RADIUS * Math.cos(angle);
  const left = 50 + BADGE_RADIUS * Math.sin(angle);
  return { top, left };
}
function badgePos(i: number, n: number): { top: string; left: string } {
  const p = badgePct(i, n);
  return { top: `${p.top}%`, left: `${p.left}%` };
}

function Badge({
  i,
  bg,
  fg,
  className = '',
}: {
  i: number;
  bg: string;
  fg: string;
  className?: string;
}) {
  return (
    <span
      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full font-display text-sm ${className}`}
      style={{ background: bg, color: fg }}
    >
      {i + 1}
    </span>
  );
}

function Pie({ bg, fg, size = 300 }: { bg: string[]; fg: string[]; size?: number }) {
  const n = bg.length;
  const hole = size / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full shadow-[0_18px_40px_rgba(20,32,57,0.18)]"
        style={{ width: size, height: size, background: conic(bg) }}
      />
      {Array.from({ length: n }, (_, i) => {
        const pos = badgePos(i, n);
        return (
          <span
            key={i}
            className="absolute flex h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-sm shadow-[0_2px_6px_rgba(7,34,31,0.25)]"
            style={{ top: pos.top, left: pos.left, background: bg[i], color: fg[i] }}
          >
            {i + 1}
          </span>
        );
      })}
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
        style={{ width: hole, height: hole }}
      >
        <Brand className="text-[26px] text-navy" />
      </div>
    </div>
  );
}

function Block({
  p,
  i,
  bg,
  fg,
  align,
}: {
  p: Point;
  i: number;
  bg: string;
  fg: string;
  align: 'center' | 'bottom' | 'left' | 'right';
}) {
  // Top + bottom points: the number sits between the text and the wheel — below
  // the text for the top point (pointing down to segment 1) and above it for the
  // bottom point (pointing up to its segment).
  if (align === 'center' || align === 'bottom') {
    const badge = <Badge i={i} bg={bg} fg={fg} className={align === 'center' ? 'mt-3' : 'mb-3'} />;
    return (
      <div className="flex flex-col items-center text-center">
        {align === 'bottom' ? badge : null}
        <div className="max-w-[300px]">
          <h3 className="font-display text-base leading-tight text-ink">
            <BrandText>{p.title}</BrandText>
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-ink-soft">
            <BrandText>{p.text}</BrandText>
          </p>
        </div>
        {align === 'center' ? badge : null}
      </div>
    );
  }
  // Flanking points: the number sits on its own title's row (toward the wheel),
  // with the description underneath, so every number reads with its title.
  const blockAlign = align === 'right' ? 'items-end text-right' : 'items-start text-left';
  const titleRow = align === 'right' ? 'flex-row-reverse' : 'flex-row';
  return (
    <div className={`flex w-[300px] max-w-full flex-col ${blockAlign}`}>
      <div className={`flex items-center gap-2.5 ${titleRow}`}>
        <Badge i={i} bg={bg} fg={fg} />
        <h3 className="font-display text-base leading-tight text-ink">
          <BrandText>{p.title}</BrandText>
        </h3>
      </div>
      <p className="mt-1.5 text-sm leading-snug text-ink-soft">
        <BrandText>{p.text}</BrandText>
      </p>
    </div>
  );
}

export function WhyWheel({ points }: { points: Point[] }) {
  const p = points;
  const n = p.length;

  // Robust fallback if the content ever holds too few points for a wheel.
  if (n < 3) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {p.map((pt, i) => (
          <div key={i} className="rounded-lg border border-[var(--line)] bg-paper/50 p-5">
            <h3 className="font-display text-base text-ink">
              <BrandText>{pt.title}</BrandText>
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              <BrandText>{pt.text}</BrandText>
            </p>
          </div>
        ))}
      </div>
    );
  }

  const { bg, fg } = segColors(n);

  // Desktop arrangement around the wheel: point 1 sits centred on top; with an
  // even count the bottom slice gets a point centred underneath; the rest flank
  // the wheel, clockwise down the right and counter-clockwise down the left.
  // Every flanking block is positioned so its number sits at exactly the same
  // height as the numbered badge inside its own slice.
  const even = n % 2 === 0;
  const bottomIdx = even ? n / 2 : -1;
  const rightEnd = even ? n / 2 - 1 : Math.floor(n / 2);
  const rightIdx: number[] = [];
  for (let i = 1; i <= rightEnd; i++) rightIdx.push(i);
  const leftIdx: number[] = [];
  for (let i = n - 1; i > rightEnd; i--) if (i !== bottomIdx) leftIdx.push(i);

  const SIZE = 340; // desktop pie diameter (px)
  const GAP = 36; // space between the pie and the flanking blocks (px)
  const BADGE = 30; // badge diameter (px), see Badge
  const blockTop = (idx: number) => (badgePct(idx, n).top / 100) * SIZE - BADGE / 2;

  return (
    <>
      {/* Desktop: the segmented wheel with the points around it. */}
      <div className="mt-12 hidden flex-col items-center md:flex">
        {/* Top point, centred above the wheel. */}
        <Block p={p[0]} i={0} bg={bg[0]} fg={fg[0]} align="center" />

        {/* The wheel with the flanking blocks anchored to their slices. The
            extra bottom padding leaves room for the lowest descriptions. */}
        <div className="relative mt-5 w-full" style={{ height: SIZE + 56 }}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <Pie bg={bg} fg={fg} size={SIZE} />
          </div>

          {leftIdx.map((idx) => (
            <div
              key={`l-${idx}`}
              className="absolute flex justify-end"
              style={{ top: blockTop(idx), right: `calc(50% + ${SIZE / 2 + GAP}px)` }}
            >
              <Block p={p[idx]} i={idx} bg={bg[idx]} fg={fg[idx]} align="right" />
            </div>
          ))}

          {rightIdx.map((idx) => (
            <div
              key={`r-${idx}`}
              className="absolute"
              style={{ top: blockTop(idx), left: `calc(50% + ${SIZE / 2 + GAP}px)` }}
            >
              <Block p={p[idx]} i={idx} bg={bg[idx]} fg={fg[idx]} align="left" />
            </div>
          ))}
        </div>

        {/* Bottom point, centred under the wheel (even counts only). */}
        {even ? (
          <div className="mt-2">
            <Block p={p[bottomIdx]} i={bottomIdx} bg={bg[bottomIdx]} fg={fg[bottomIdx]} align="bottom" />
          </div>
        ) : null}
      </div>

      {/* Mobile: pie on top, the points stacked below. */}
      <div className="mt-8 md:hidden">
        <div className="flex justify-center">
          <Pie bg={bg} fg={fg} />
        </div>
        <div className="mt-8 space-y-5">
          {p.map((pt, i) => (
            <Block key={i} p={pt} i={i} bg={bg[i]} fg={fg[i]} align="left" />
          ))}
        </div>
      </div>
    </>
  );
}
