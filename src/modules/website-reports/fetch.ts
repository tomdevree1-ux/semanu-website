import 'server-only';
import { assertPublicUrl } from '@/lib/security/url-guard';
import type { CrawlSnapshot } from './types';
import type { WebsiteReportErrorCode } from './status';

/**
 * SERVER ONLY homepage fetch for P14. SSRF-safe: every hop (initial + each redirect, max 3) is re-validated
 * through `assertPublicUrl` (scheme/host/port + DNS + IP blocklist) before the request. Hard timeout, 2 MB
 * size cap, content-type allowlist. Extracts only safe, bounded data. Never fetches assets, sitemaps or
 * extra pages; no screenshots; no browser. `fetchImpl`/`lookup` are injectable so tests run without network.
 */

const UA = 'amai.ch website-analysis bot (+https://amai.ch)';
const MAX_BYTES = 2_000_000;
const MAX_TEXT = 30_000;
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
const MAX_HEADINGS = 25;
const MAX_LINKS = 25;
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];

export type FetchResult = { ok: true; snapshot: CrawlSnapshot } | { ok: false; reason: WebsiteReportErrorCode };

type LookupFn = (host: string) => Promise<string[]>;
type FetchImpl = (url: string, init: RequestInit) => Promise<Response>;
type Deps = { lookup?: LookupFn; fetchImpl?: FetchImpl };

function isAbort(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || /abort/i.test(err.message));
}

async function readCapped(res: Response, cap: number): Promise<string | null> {
  const body = res.body as ReadableStream<Uint8Array> | null;
  if (!body) {
    const txt = await res.text();
    return txt.length > cap ? null : txt;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

export async function fetchHomepage(rawUrl: string, deps: Deps = {}): Promise<FetchResult> {
  const { lookup, fetchImpl } = deps;
  const doFetch: FetchImpl = fetchImpl ?? ((u, init) => fetch(u, init));

  let current = rawUrl;
  let redirects = 0;
  let res: Response | null = null;

  for (;;) {
    const guard = lookup ? await assertPublicUrl(current, lookup) : await assertPublicUrl(current);
    if (!guard.ok) return { ok: false, reason: guard.reason === 'dns_failed' ? 'dns_failed' : 'url_blocked_ssrf' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let r: Response;
    try {
      r = await doFetch(guard.url.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
      });
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, reason: isAbort(err) ? 'timeout' : 'unreachable' };
    }
    clearTimeout(timer);

    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location');
      if (!loc) return { ok: false, reason: 'http_error' };
      if (++redirects > MAX_REDIRECTS) return { ok: false, reason: 'http_error' };
      try {
        current = new URL(loc, guard.url).toString();
      } catch {
        return { ok: false, reason: 'http_error' };
      }
      continue;
    }
    res = r;
    break;
  }

  if (!res) return { ok: false, reason: 'unreachable' };
  if (res.status >= 400) return { ok: false, reason: 'http_error' };

  const ct = (res.headers.get('content-type') ?? '').toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.some((t) => ct.includes(t))) return { ok: false, reason: 'bad_content_type' };

  const html = await readCapped(res, MAX_BYTES);
  if (html === null) return { ok: false, reason: 'too_large' };

  const finalUrl = res.url || current;
  return { ok: true, snapshot: extractSnapshot(finalUrl, res.status, html) };
}

// ── safe, bounded HTML extraction (regex-based; no heavy parser) ──────────────────
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, ' ');
}
function decodeBasic(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}
function clean(s: string): string {
  return decodeBasic(stripTags(s)).replace(/\s+/g, ' ').trim();
}
function matchAll(re: RegExp, s: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

export function extractSnapshot(finalUrl: string, status: number, html: string): CrawlSnapshot {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? clean(titleM[1]).slice(0, 300) || null : null;

  const descM = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    ?? html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const meta_description = descM ? clean(descM[1]).slice(0, 500) || null : null;

  const h1 = matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, html).map((x) => clean(x)).filter(Boolean).slice(0, MAX_HEADINGS);
  const h2 = matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, html).map((x) => clean(x)).filter(Boolean).slice(0, MAX_HEADINGS);
  const h3 = matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, html).map((x) => clean(x)).filter(Boolean).slice(0, MAX_HEADINGS);

  const visible_text = clean(noScript).slice(0, MAX_TEXT);

  const counts = {
    images: (html.match(/<img[\s>]/gi) ?? []).length,
    links: (html.match(/<a[\s>]/gi) ?? []).length,
    forms: (html.match(/<form[\s>]/gi) ?? []).length,
  };

  const has_viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const has_og = /<meta[^>]+property=["']og:/i.test(html);
  const langM = html.match(/<html[^>]+lang=["']([a-z-]{2,10})["']/i);
  const detected_language = langM ? langM[1].toLowerCase() : null;

  let sameHost = '';
  try {
    sameHost = new URL(finalUrl).host;
  } catch {
    sameHost = '';
  }
  const hrefs = matchAll(/<a[^>]+href=["']([^"']+)["']/gi, html);
  const sameSet = new Set<string>();
  for (const href of hrefs) {
    try {
      const u = new URL(href, finalUrl);
      if ((u.protocol === 'http:' || u.protocol === 'https:') && u.host === sameHost) {
        sameSet.add(u.toString());
        if (sameSet.size >= MAX_LINKS) break;
      }
    } catch {
      /* ignore unparseable hrefs */
    }
  }

  return {
    final_url: finalUrl,
    http_status: status,
    title,
    meta_description,
    headings: { h1, h2, h3 },
    visible_text,
    counts,
    has_viewport,
    has_og,
    detected_language,
    same_domain_links: [...sameSet],
  };
}
