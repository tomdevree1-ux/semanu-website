import 'server-only';
import * as Sentry from '@sentry/nextjs';

/**
 * Central server-side error capture. Always logs structured context; forwards to
 * Sentry when a DSN is configured (no-op otherwise). Use this in catch blocks on
 * the critical paths (checkout, webhook, cron) instead of a bare console.error,
 * so prod failures surface in one place + can alert.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // Never throw from the error path.
  }
  // eslint-disable-next-line no-console
  console.error('[error]', context ?? {}, error);
}
