import type { CSSProperties } from 'react';

/**
 * Inline stroke-SVG icon set ported from the admin design prototype (1.9px stroke,
 * round caps). Each value is an SVG path `d`; multi-subpath icons are split on "M"
 * so every subpath is its own <path>. Stroke styling comes from portal.css (the
 * parent class sets stroke/width), so these inherit currentColor.
 */
export const ICONS: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  flame: 'M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 11 10 12 3z M12 21a5 5 0 0 0 5-5c0-4-3-6-5-9',
  doc: 'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M14 3v5h5 M9 13h6 M9 17h6',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M20 20l-3.5-3.5',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
  plus: 'M12 5v14 M5 12h14',
  chevright: 'M9 6l6 6-6 6',
  chevleft: 'M15 6l-6 6 6 6',
  chevdown: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12 M18 6 6 18',
  check: 'M5 12l5 5 9-11',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  edit: 'M4 20h4l10-10a2 2 0 0 0-3-3L5 17z M13 6l3 3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 21a7 7 0 0 1 14 0 M17 4a3.5 3.5 0 0 1 0 7 M22 21a7 7 0 0 0-5-6.7',
  warn: 'M12 4l9 16H3z M12 10v4 M12 17h.01',
  trend: 'M3 17l5-5 4 4 8-8 M16 8h5v5',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5 M3 17l9 5 9-5',
  filter: 'M3 5h18 M6 12h12 M10 19h4',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01M3 12h.01M3 18h.01',
  board: 'M4 4h6v16H4z M14 4h6v9h-6z',
  download: 'M12 3v12 M7 11l5 5 5-5 M5 21h14',
  send: 'M22 3L11 14 M22 3l-7 18-4-8-8-4z',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M4 9h16 M9 3v4 M15 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v10 M9.5 9.5a2.5 2 0 0 1 5 0c0 1.5-1.2 2-2.5 2.5s-2.5 1-2.5 2.5a2.5 2 0 0 0 5 0',
  signature: 'M3 17c3 0 4-9 6-9s2 7 4 7 2-4 4-4 M3 20h18',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V22a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 20.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.7 15H3.6a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 5.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 3.7V3.6a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .9 2.7h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.6 1z',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4 M10 12h10 M14 8l-4 4 4 4',
  inbox: 'M3 13h5l2 3h4l2-3h5 M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
};

export type IconName = keyof typeof ICONS;

export function Icon({ n, style }: { n: string; style?: CSSProperties }) {
  const d = ICONS[n] ?? '';
  return (
    <svg viewBox="0 0 24 24" style={style} aria-hidden="true">
      {d
        .split('M')
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={'M' + seg} />
        ))}
    </svg>
  );
}
