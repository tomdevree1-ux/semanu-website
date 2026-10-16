import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Server + edge error capture. Ships dark: with no DSN this initialises nothing
 * and sends no events, so it is safe to deploy before a Sentry project exists.
 * Errors-only by default (tracesSampleRate 0) and no PII.
 */
export async function register(): Promise<void> {
  if (!dsn) return;
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === 'nodejs' || runtime === 'edge') {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  }
}

// Forwards App Router server-component + route-handler errors to Sentry.
export const onRequestError = Sentry.captureRequestError;
