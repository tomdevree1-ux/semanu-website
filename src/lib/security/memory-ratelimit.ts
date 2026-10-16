import 'server-only';

/**
 * Tiny fixed-window rate limiter kept in process memory. The site runs as one
 * long-lived Node process per environment on the Hetzner server, so this is
 * enough as a first line of defence; it resets on restart, which is fine.
 */
const windows = new Map<string, { start: number; count: number }>();

export function hitRateLimit(key: string, max: number, windowSeconds: number, now = Date.now()): boolean {
  const win = windows.get(key);
  if (!win || now - win.start >= windowSeconds * 1000) {
    windows.set(key, { start: now, count: 1 });
    if (windows.size > 10_000) prune(now, windowSeconds);
    return true;
  }
  win.count += 1;
  return win.count <= max;
}

function prune(now: number, windowSeconds: number): void {
  for (const [k, w] of windows) if (now - w.start >= windowSeconds * 1000) windows.delete(k);
}

/** Test helper. */
export function resetRateLimits(): void {
  windows.clear();
}
