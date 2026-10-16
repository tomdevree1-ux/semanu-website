import 'server-only';
import { env } from '@/lib/env';
import type { QuickscanSite } from './quickscan-schema';

/**
 * WAF-4: call the external quickscan PDF service (the hosted weasyprint renderer) with the `site` dict and a
 * shared secret, returning the PDF bytes. Never throws — failures come back as a safe reason. The amai worker
 * is the only caller; the service authenticates every request via X-Service-Secret.
 */
export type PdfServiceResult = { ok: true; pdf: Buffer } | { ok: false; reason: string };

export async function renderQuickscanPdf(site: QuickscanSite, timeoutMs = 60_000): Promise<PdfServiceResult> {
  const base = env.pdfServiceUrl;
  const secret = env.pdfServiceSecret;
  if (!base || !secret) return { ok: false, reason: 'pdf_service_unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-service-secret': secret },
      body: JSON.stringify({ site }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: `pdf_service_${res.status}` };
    const pdf = Buffer.from(await res.arrayBuffer());
    if (pdf.length < 1000) return { ok: false, reason: 'pdf_too_small' };
    return { ok: true, pdf };
  } catch (e) {
    const aborted = e instanceof Error && /abort/i.test(e.message);
    return { ok: false, reason: aborted ? 'pdf_service_timeout' : 'pdf_service_unreachable' };
  } finally {
    clearTimeout(timer);
  }
}
