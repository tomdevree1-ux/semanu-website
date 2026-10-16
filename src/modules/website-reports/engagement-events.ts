import crypto from 'node:crypto';

/**
 * PURE, dependency-free engagement helpers (P16 / WAF-3.1). No 'server-only', no DB/audit/env import — so the
 * webhook route can use these and the unit tests can exercise them directly. The DB-touching reconciler lives
 * in `engagement.ts`.
 *
 * Covers: Resend (Svix) signature verification, a safe event parser, and the per-event "effect" computation
 * that maps a Resend event onto a `website_report_deliveries` engagement patch. Reliable signals
 * (delivered/bounced/complained) are always applied; opened/clicked are gated behind `openClickEnabled`
 * (the ENABLE_EMAIL_OPEN_CLICK_TRACKING flag) and are treated as indicative only. We never read or store the
 * opener/click IP, user-agent, link or raw payload — privacy by omission.
 */

// ── event taxonomy ──────────────────────────────────────────────────────────
export const RELIABLE_EVENTS = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
]);
export const OPEN_CLICK_EVENTS = new Set(['email.opened', 'email.clicked']);
export const SUPPORTED_EVENTS = new Set([...RELIABLE_EVENTS, ...OPEN_CLICK_EVENTS]);

export type ParsedResendEvent = {
  type: string;
  providerMessageId: string | null;
  createdAt: string | null;
  bounceType: string | null;
};

/**
 * Parse a Resend webhook body into a minimal, SAFE shape. Extracts only `type`, `data.email_id`
 * (the provider message id we match on), `created_at`, and an optional bounce classification. It deliberately
 * does NOT read `data.open` / `data.click` (which carry IP + user-agent) — those are never persisted.
 */
export function parseResendEvent(input: unknown): ParsedResendEvent | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const type = typeof o.type === 'string' ? o.type : null;
  if (!type) return null;
  const data = o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : {};
  const providerMessageId = typeof data.email_id === 'string' ? data.email_id : null;
  const createdAt = typeof o.created_at === 'string' ? o.created_at : null;
  let bounceType: string | null = null;
  const bounce = data.bounce && typeof data.bounce === 'object' ? (data.bounce as Record<string, unknown>) : null;
  if (bounce && typeof bounce.type === 'string') bounceType = bounce.type.slice(0, 50);
  return { type, providerMessageId, createdAt, bounceType };
}

// ── signature verification (Svix scheme, used by Resend) ────────────────────
export type ResendSignatureHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};
export type VerifyResult = { ok: boolean; reason?: string };

/** Decode a Svix/Resend signing secret (`whsec_<base64>`) to its raw key bytes. */
function secretToKey(secret: string): Buffer | null {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  try {
    const buf = Buffer.from(raw, 'base64');
    return buf.length ? buf : null;
  } catch {
    return null;
  }
}

function timingSafeEqualB64(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify a Resend (Svix) webhook signature. Signed content is `${id}.${timestamp}.${rawBody}`, HMAC-SHA256 with
 * the decoded secret, base64. The `svix-signature` header is a space-separated list of `v1,<sig>` entries; we
 * accept if ANY matches (constant-time). Rejects missing headers, a non-numeric or stale timestamp (default ±5
 * min), a missing/undecodable secret, and any non-matching signature.
 */
export function verifyResendSignature(opts: {
  payload: string;
  headers: ResendSignatureHeaders;
  secret: string;
  toleranceSeconds?: number;
  nowMs?: number;
}): VerifyResult {
  const { payload, headers, secret } = opts;
  const tolerance = opts.toleranceSeconds ?? 300;
  const nowMs = opts.nowMs ?? Date.now();

  if (!secret) return { ok: false, reason: 'no_secret' };
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing_headers' };

  const tsSec = Number(timestamp);
  if (!Number.isFinite(tsSec)) return { ok: false, reason: 'bad_timestamp' };
  if (Math.abs(nowMs / 1000 - tsSec) > tolerance) return { ok: false, reason: 'stale_timestamp' };

  const key = secretToKey(secret);
  if (!key) return { ok: false, reason: 'bad_secret' };

  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${payload}`).digest('base64');
  const provided = signature
    .split(' ')
    .map((p) => {
      const comma = p.indexOf(',');
      return comma === -1 ? p : p.slice(comma + 1);
    })
    .filter(Boolean);

  for (const sig of provided) {
    if (timingSafeEqualB64(sig, expected)) return { ok: true };
  }
  return { ok: false, reason: 'no_match' };
}

// ── per-event effect computation (pure) ─────────────────────────────────────
/** The engagement-relevant slice of a current delivery row. */
export type CurrentDelivery = {
  status: string;
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  first_opened_at: string | null;
  open_count: number;
  click_count: number;
};

export type EngagementUpdate = Record<string, string | number | null>;

export type EngagementEffect = {
  applied: boolean;
  reason?: string;
  update: EngagementUpdate;
  auditAction: string | null;
  auditNewStatus: string | null;
  emailLogStatus: string | null;
  metadata: Record<string, unknown>;
};

const NONE: EngagementEffect = {
  applied: false,
  update: {},
  auditAction: null,
  auditNewStatus: null,
  emailLogStatus: null,
  metadata: {},
};

/**
 * Map one parsed Resend event onto an engagement patch for `website_report_deliveries`. Pure: takes the current
 * row slice + the open/click flag + a fixed `nowIso`, returns the intended update, the audit action (first
 * occurrence only, to keep the timeline clean), the email_log status reflection, and safe metadata.
 * Timestamps are set-once; counts increment by one (the route deduplicates by event id, so each event applies
 * at most once). Opened/clicked are ignored entirely when `openClickEnabled` is false.
 */
export function computeEngagementEffect(
  event: ParsedResendEvent,
  opts: { openClickEnabled: boolean; current: CurrentDelivery; nowIso: string },
): EngagementEffect {
  const now = opts.nowIso;
  const cur = opts.current;

  switch (event.type) {
    case 'email.sent':
      return { ...NONE, applied: true, update: { last_event_at: now } };

    case 'email.delivery_delayed':
      return { ...NONE, applied: true, update: { last_event_at: now } };

    case 'email.delivered':
      return {
        applied: true,
        update: { delivered_at: cur.delivered_at ?? now, last_event_at: now },
        auditAction: cur.delivered_at ? null : 'report_delivery.delivered',
        auditNewStatus: null,
        emailLogStatus: 'delivered',
        metadata: {},
      };

    case 'email.bounced': {
      const first = !cur.bounced_at;
      const setStatus = first && cur.status !== 'cancelled';
      return {
        applied: true,
        update: {
          bounced_at: cur.bounced_at ?? now,
          last_event_at: now,
          ...(setStatus ? { status: 'bounced' } : {}),
          ...(event.bounceType ? { bounce_type: event.bounceType } : {}),
        },
        auditAction: first ? 'report_delivery.bounced' : null,
        auditNewStatus: setStatus ? 'bounced' : null,
        emailLogStatus: 'bounced',
        metadata: event.bounceType ? { bounce_type: event.bounceType } : {},
      };
    }

    case 'email.complained': {
      const first = !cur.complained_at;
      return {
        applied: true,
        update: { complained_at: cur.complained_at ?? now, last_event_at: now },
        auditAction: first ? 'report_delivery.complained' : null,
        auditNewStatus: null,
        emailLogStatus: 'complained',
        metadata: {},
      };
    }

    case 'email.opened': {
      if (!opts.openClickEnabled) return { ...NONE, reason: 'tracking_disabled' };
      const first = !cur.first_opened_at;
      const openCount = (cur.open_count ?? 0) + 1;
      return {
        applied: true,
        update: {
          first_opened_at: cur.first_opened_at ?? now,
          opened_at: now,
          open_count: openCount,
          last_event_at: now,
        },
        auditAction: first ? 'report_delivery.opened' : null,
        auditNewStatus: null,
        emailLogStatus: null,
        metadata: { open_count: openCount },
      };
    }

    case 'email.clicked': {
      if (!opts.openClickEnabled) return { ...NONE, reason: 'tracking_disabled' };
      const clickCount = (cur.click_count ?? 0) + 1;
      const first = (cur.click_count ?? 0) === 0;
      return {
        applied: true,
        update: { clicked_at: now, click_count: clickCount, last_event_at: now },
        auditAction: first ? 'report_delivery.clicked' : null,
        auditNewStatus: null,
        emailLogStatus: null,
        metadata: { click_count: clickCount },
      };
    }

    default:
      return { ...NONE, reason: 'unsupported' };
  }
}
