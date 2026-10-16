import 'server-only';
import { analyticsdata } from '@googleapis/analyticsdata';
import { searchconsole } from '@googleapis/searchconsole';
import { env } from '@/lib/env';
import { googleAuth } from './auth';

/** YYYY-MM-DD for `n` days before today (UTC). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * GA4 traffic snapshot: totals (last 90 days vs the prior 90), the channel
 * breakdown and the top pages. Free, via the official GA4 Data API.
 */
export async function fetchGa4Summary() {
  const auth = googleAuth();
  // @googleapis/analyticsdata bundles its own google-auth-library, so its GoogleAuth
  // type differs from google-auth-library 10.x used by googleAuth() (runtime is identical).
  const client = analyticsdata({ version: 'v1beta', auth: auth as never });
  const property = `properties/${env.ga4PropertyId}`;

  const current = { startDate: '90daysAgo', endDate: 'today' };
  const previous = { startDate: '180daysAgo', endDate: '91daysAgo' };

  const totals = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [
        { ...current, name: 'current' },
        { ...previous, name: 'previous' },
      ],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
    },
  });

  const channels = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [current],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '15',
    },
  });

  const topPages = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [current],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'keyEvents' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: '20',
    },
  });

  return {
    property,
    range: { current, previous },
    totals: totals.data,
    channels: channels.data,
    topPages: topPages.data,
  };
}

/**
 * Search Console snapshot: totals (last 90 days vs the prior 90), top queries
 * and top pages. Free, via the official Search Console API. GSC data lags ~2-3
 * days, so the window ends three days back.
 */
export async function fetchGscSummary() {
  const auth = googleAuth();
  // Same cross-package google-auth-library type mismatch as in fetchGa4Summary.
  const client = searchconsole({ version: 'v1', auth: auth as never });
  const siteUrl = env.gscSiteUrl;

  const endDate = daysAgo(3);
  const startDate = daysAgo(93);
  const prevEnd = daysAgo(94);
  const prevStart = daysAgo(184);

  const query = (body: Record<string, unknown>) =>
    client.searchanalytics.query({ siteUrl, requestBody: body }).then((r) => r.data);

  const [totalsCurrent, totalsPrevious, topQueries, topPages] = await Promise.all([
    query({ startDate, endDate }),
    query({ startDate: prevStart, endDate: prevEnd }),
    query({ startDate, endDate, dimensions: ['query'], rowLimit: 30 }),
    query({ startDate, endDate, dimensions: ['page'], rowLimit: 20 }),
  ]);

  return {
    siteUrl,
    range: {
      current: { startDate, endDate },
      previous: { startDate: prevStart, endDate: prevEnd },
    },
    totalsCurrent,
    totalsPrevious,
    topQueries,
    topPages,
  };
}
