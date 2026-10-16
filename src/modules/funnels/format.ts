/** Client-safe display helpers for funnel submissions (P13). */

const SOURCE_LABELS: Record<string, string> = {
  website_analysis: 'Free website analysis',
  website_cost_calculator: 'Cost calculator',
  strategy_call: 'Strategy call',
  maintenance_security_scan: 'Maintenance / security scan',
};

export function funnelSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ').trim();
}
