import 'server-only';
import dns from 'node:dns/promises';

/**
 * SERVER ONLY SSRF guard for the P14 website analysis fetch. The public funnel never fetches; P14 is the
 * first phase that does, so every outbound request must pass through here first. The guard is split into a
 * pure, synchronous URL-shape check (`assertUrlShape`) + a DNS resolve-and-block step (`resolveAndCheck`,
 * with an injectable resolver so it is unit-testable without real DNS). `assertPublicUrl` combines them and
 * is re-run for the initial URL AND every redirect hop (defeats redirect-to-internal; re-resolves each hop,
 * the standard mitigation against DNS rebinding short of a socket-pinned agent).
 */

export type GuardResult =
  | { ok: true; url: URL; host: string; addresses: string[] }
  | { ok: false; reason: GuardReason };

export type GuardReason =
  | 'empty'
  | 'bad_url'
  | 'bad_scheme'
  | 'userinfo'
  | 'bad_port'
  | 'ip_literal'
  | 'internal_hostname'
  | 'dns_failed'
  | 'url_blocked_ssrf';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const ALLOWED_PORTS = new Set(['', '80', '443']);

/** Default bare domains to https. Returns null when clearly not a usable web URL. */
export function normalizeWebsiteUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return u.toString();
  } catch {
    return null;
  }
}

/** Parse an IPv4 dotted string to a 32-bit unsigned int, or null. */
function ipv4ToInt(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inRange(ip: number, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (baseInt & mask);
}

// Private / internal / loopback / link-local / shared / metadata IPv4 ranges.
const BLOCKED_IPV4 = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16', // includes 169.254.169.254 metadata
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
  '255.255.255.255/32',
];

/** True when an IP literal (v4 or v6) is private/internal/loopback/link-local/metadata. */
export function isBlockedIp(ip: string): boolean {
  const v4 = ipv4ToInt(ip);
  if (v4 !== null) return BLOCKED_IPV4.some((c) => inRange(v4, c));

  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
  // IPv4-mapped / -compatible IPv6 → check the embedded v4.
  const mapped = lower.match(/(?:::ffff:|::)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isBlockedIp(mapped[1]);
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fe80') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true; // link-local fe80::/10
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
  if (lower.startsWith('ff')) return true; // multicast
  return false;
}

/** Hostnames that must never be fetched even before DNS (defence in depth). */
function isInternalHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost') return true;
  if (h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan')) return true;
  if (h === 'metadata' || h === 'metadata.google.internal') return true;
  if (!h.includes('.')) return true; // single-label / intranet host
  return false;
}

/** Pure, synchronous URL-shape validation (no network). */
export function assertUrlShape(raw: string): GuardResult {
  const normalized = normalizeWebsiteUrl(raw);
  if (!normalized) return { ok: false, reason: raw && raw.trim() ? 'bad_url' : 'empty' };
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return { ok: false, reason: 'bad_url' };
  }
  if (!ALLOWED_SCHEMES.has(url.protocol)) return { ok: false, reason: 'bad_scheme' };
  if (url.username || url.password) return { ok: false, reason: 'userinfo' };
  if (!ALLOWED_PORTS.has(url.port)) return { ok: false, reason: 'bad_port' };
  const host = url.hostname.replace(/^\[|\]$/g, '');
  // Raw IP-literal hosts are rejected outright (no public reason to analyse an IP literal, and it dodges DNS).
  if (ipv4ToInt(host) !== null || host.includes(':')) return { ok: false, reason: 'ip_literal' };
  if (isInternalHostname(host)) return { ok: false, reason: 'internal_hostname' };
  return { ok: true, url, host, addresses: [] };
}

type LookupFn = (host: string) => Promise<string[]>;
const defaultLookup: LookupFn = async (host) => {
  const res = await dns.lookup(host, { all: true });
  return res.map((r) => r.address);
};

/** Resolve a host and reject if ANY resolved address is blocked. Injectable resolver for tests. */
export async function resolveAndCheck(host: string, lookup: LookupFn = defaultLookup): Promise<GuardResult> {
  let addresses: string[];
  try {
    addresses = await lookup(host);
  } catch {
    return { ok: false, reason: 'dns_failed' };
  }
  if (!addresses.length) return { ok: false, reason: 'dns_failed' };
  if (addresses.some((a) => isBlockedIp(a))) return { ok: false, reason: 'url_blocked_ssrf' };
  return { ok: true, url: new URL(`https://${host}`), host, addresses };
}

/** Full check: shape + DNS resolution + IP blocklist. Re-run for every redirect hop. */
export async function assertPublicUrl(raw: string, lookup: LookupFn = defaultLookup): Promise<GuardResult> {
  const shape = assertUrlShape(raw);
  if (!shape.ok) return shape;
  const dnsRes = await resolveAndCheck(shape.host, lookup);
  if (!dnsRes.ok) return dnsRes;
  return { ok: true, url: shape.url, host: shape.host, addresses: dnsRes.addresses };
}
