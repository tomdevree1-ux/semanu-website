/**
 * Pure, client-safe helpers for the funnels module (P13). Normalization is shared by the public ingest
 * (API route) and the CRM link lookups so matching is consistent.
 */

/** Lowercase + trim an email for matching/storage. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Derive a bare registrable host from a URL or domain input: lowercased, scheme/path/port/`www.` stripped.
 * Returns null when the input is empty or clearly not a domain (no dot).
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // strip scheme
  s = s.split(/[/?#]/)[0]; // host part only
  s = s.replace(/^www\./, ''); // strip www.
  s = s.split(':')[0]; // strip port
  if (!s.includes('.') || s.length < 4) return null;
  return s;
}

/** A submission is archivable when it is not already archived. */
export function funnelIsArchivable(archivedAt: string | null): boolean {
  return !archivedAt;
}
