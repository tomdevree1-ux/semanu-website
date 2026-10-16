/**
 * Visitor IP as set by Caddy, the only proxy in front of the Node server.
 *
 * deploy/Caddyfile sets `header_up X-Real-IP {remote_host}` on every
 * reverse_proxy, which overwrites whatever X-Real-IP the visitor sent. Caddy has
 * no trusted_proxies, so {remote_host} is the TCP peer address and cannot be
 * spoofed with headers. X-Forwarded-For and cf-connecting-ip are deliberately
 * not read here. Pure module (no server-only) so it is unit-testable.
 */

function isIpv4(s: string): boolean {
  const parts = s.split('.');
  return parts.length === 4 && parts.every((p) => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255);
}

function isIpv6(s: string): boolean {
  if (s.length < 2 || s.length > 45) return false;
  let groups = s;
  let extra = 0;
  const lastColon = s.lastIndexOf(':');
  if (lastColon === -1) return false;
  const tail = s.slice(lastColon + 1);
  if (tail.includes('.')) {
    if (!isIpv4(tail)) return false;
    groups = s.slice(0, lastColon + 1) + '0';
    extra = 1;
  }
  const halves = groups.split('::');
  if (halves.length > 2) return false;
  const hex = /^[0-9a-fA-F]{1,4}$/;
  const split = (h: string) => (h === '' ? [] : h.split(':'));
  if (halves.length === 1) {
    const g = split(halves[0]);
    return g.length + extra === 8 && g.every((x) => hex.test(x));
  }
  const all = [...split(halves[0]), ...split(halves[1])];
  return all.every((x) => hex.test(x)) && all.length + extra <= 7;
}

/** Syntactically valid IPv4 or IPv6 literal (no port, brackets or zone id).
 *  Same rules as supabase/functions/_shared/forwarded-ip.ts in the Website repo. */
export function isValidIp(value: string | null | undefined): boolean {
  const s = String(value ?? '').trim();
  if (!s || s.length > 45) return false;
  return s.includes(':') ? isIpv6(s) : isIpv4(s);
}

/** Visitor IP from X-Real-IP, or 'unknown' when absent or malformed. */
export function clientIp(req: Pick<Request, 'headers'>): string {
  const ip = (req.headers.get('x-real-ip') ?? '').trim();
  return isValidIp(ip) ? ip.toLowerCase() : 'unknown';
}
