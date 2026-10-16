/**
 * Shared classes for whole-row clickable list rows.
 *
 * Whole-row navigation is handled by the `RowLink` client component (a `<tr>` with an onClick), which is
 * reliable in every browser. The previous approach overlaid a stretched `::after` on the link and relied on
 * `position: relative` on the `<tr>` as its containing block — Safari does not honour that, so the overlay
 * escaped its row and clicks hit the wrong row. The `::after` overlay has therefore been removed.
 *
 * Usage: put `clickableRowClass` on the `RowLink` row; keep `stretchedLinkClass` on the single primary
 * `<Link>` (the name) — it is now just the focusable keyboard-link style, no overlay. Inner interactive
 * controls take `rowControlClass` and stay independently clickable (RowLink ignores clicks on a/button/input).
 */

// Row container: hover/focus affordance + pointer cursor. (`relative` is harmless and kept for inner controls.)
export const clickableRowClass =
  'group relative cursor-pointer transition-colors hover:bg-ink/5 focus-within:bg-ink/5';

// Primary row link (the name): focusable keyboard link. No overlay — RowLink handles whole-row navigation.
export const stretchedLinkClass = 'outline-none hover:underline focus-visible:underline';

// Inner controls (buttons, dropdowns): raise above the row so their own clicks win.
export const rowControlClass = 'relative z-10';
