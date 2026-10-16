import 'server-only';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { WebsiteReportContent } from './schema';

/**
 * SERVER ONLY customer-facing PDF for an APPROVED P14 report (P15). Rendered deterministically from the
 * validated `report_json` only — no AI re-run, no website fetch, no arbitrary HTML. The `internal_sales_note`
 * is NEVER included. Locale-aware section headings (de/fr/en); the body text is already in the report locale.
 */
export type ReportPdfMeta = {
  domain: string;
  websiteUrl: string;
  generatedAt: string; // ISO
  locale: 'de' | 'fr' | 'en';
};

type Labels = {
  title: string; for: string; date: string; scorecard: string; summary: string;
  opportunities: string; recommendations: string; impact: string; effort: string;
  conclusion: string; disclaimer: string;
  axes: Record<'overall' | 'seo' | 'ux' | 'conversion' | 'performance' | 'trust' | 'content' | 'mobile', string>;
  sections: Record<
    'first_impression' | 'positioning_message' | 'conversion_lead_generation' | 'ux_structure' |
    'visual_design_impression' | 'seo_findability' | 'performance_technical_impression' | 'trust_proof' |
    'mobile_impression', string
  >;
};

const LABELS: Record<'de' | 'fr' | 'en', Labels> = {
  de: {
    title: 'Website Analyse Bericht', for: 'Analyse für', date: 'Datum', scorecard: 'Bewertung',
    summary: 'Zusammenfassung', opportunities: 'Konkrete Verbesserungschancen', recommendations: 'Wirkung und Aufwand',
    impact: 'Wirkung', effort: 'Aufwand', conclusion: 'Fazit',
    disclaimer: 'Dieser Bericht wurde von amai erstellt und vor dem Versand geprüft. Unverbindliche Einschätzung.',
    axes: { overall: 'Gesamt', seo: 'SEO', ux: 'UX', conversion: 'Conversion', performance: 'Performance', trust: 'Vertrauen', content: 'Inhalt', mobile: 'Mobil' },
    sections: { first_impression: 'Erster Eindruck', positioning_message: 'Positionierung und Botschaft', conversion_lead_generation: 'Conversion und Leadgenerierung', ux_structure: 'UX und Struktur', visual_design_impression: 'Visueller Eindruck', seo_findability: 'SEO und Auffindbarkeit', performance_technical_impression: 'Performance und Technik', trust_proof: 'Vertrauen und Nachweise', mobile_impression: 'Mobiler Eindruck' },
  },
  fr: {
    title: 'Rapport d analyse de site', for: 'Analyse pour', date: 'Date', scorecard: 'Évaluation',
    summary: 'Résumé', opportunities: 'Pistes d amélioration concrètes', recommendations: 'Impact et effort',
    impact: 'Impact', effort: 'Effort', conclusion: 'Conclusion',
    disclaimer: 'Ce rapport a été préparé par amai et vérifié avant envoi. Évaluation sans engagement.',
    axes: { overall: 'Global', seo: 'SEO', ux: 'UX', conversion: 'Conversion', performance: 'Performance', trust: 'Confiance', content: 'Contenu', mobile: 'Mobile' },
    sections: { first_impression: 'Première impression', positioning_message: 'Positionnement et message', conversion_lead_generation: 'Conversion et génération de leads', ux_structure: 'UX et structure', visual_design_impression: 'Impression visuelle', seo_findability: 'SEO et visibilité', performance_technical_impression: 'Performance et technique', trust_proof: 'Confiance et preuves', mobile_impression: 'Impression mobile' },
  },
  en: {
    title: 'Website analysis report', for: 'Analysis for', date: 'Date', scorecard: 'Scorecard',
    summary: 'Executive summary', opportunities: 'Concrete improvement opportunities', recommendations: 'Impact vs effort',
    impact: 'Impact', effort: 'Effort', conclusion: 'Commercial conclusion',
    disclaimer: 'This report was prepared by amai and reviewed before sending. Indicative assessment.',
    axes: { overall: 'Overall', seo: 'SEO', ux: 'UX', conversion: 'Conversion', performance: 'Performance', trust: 'Trust', content: 'Content', mobile: 'Mobile' },
    sections: { first_impression: 'First impression', positioning_message: 'Positioning and message', conversion_lead_generation: 'Conversion and lead generation', ux_structure: 'UX and structure', visual_design_impression: 'Visual and design impression', seo_findability: 'SEO and findability', performance_technical_impression: 'Performance and technical', trust_proof: 'Trust and proof', mobile_impression: 'Mobile impression' },
  },
};

const NAVY = '#1b2a4a';
const INK = '#26303f';
const MUTED = '#6b7686';
const LINE = '#e3e7ee';

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 46, fontSize: 10.5, color: INK, lineHeight: 1.5 },
  brand: { fontSize: 20, color: NAVY, fontWeight: 700 },
  title: { fontSize: 14, marginTop: 2, color: INK },
  meta: { fontSize: 9.5, color: MUTED, marginTop: 6 },
  rule: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 12 },
  h2: { fontSize: 12, color: NAVY, marginTop: 14, marginBottom: 4, fontWeight: 700 },
  p: { fontSize: 10.5, color: INK },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  scoreLabel: { width: 90, color: MUTED, fontSize: 9.5 },
  barTrack: { flexGrow: 1, height: 6, backgroundColor: '#eef1f6', borderRadius: 3 },
  barFill: { height: 6, backgroundColor: NAVY, borderRadius: 3 },
  scoreVal: { width: 34, textAlign: 'right', fontSize: 9.5 },
  bullet: { flexDirection: 'row', marginTop: 2 },
  bulletDot: { width: 10, color: NAVY },
  recRow: { marginTop: 3 },
  recTitle: { fontWeight: 700, color: INK },
  recMeta: { color: MUTED, fontSize: 9 },
  footer: { position: 'absolute', bottom: 28, left: 46, right: 46, fontSize: 8.5, color: MUTED, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
});

function clampScore(n: number): number {
  return Math.max(0, Math.min(10, n));
}

function buildDocument(content: WebsiteReportContent, meta: ReportPdfMeta) {
  const t = LABELS[meta.locale] ?? LABELS.de;
  const sc = content.scorecard;
  const axisOrder: Array<keyof typeof t.axes> = ['overall', 'seo', 'ux', 'conversion', 'performance', 'trust', 'content', 'mobile'];
  const sectionOrder: Array<keyof typeof t.sections> = [
    'first_impression', 'positioning_message', 'conversion_lead_generation', 'ux_structure',
    'visual_design_impression', 'seo_findability', 'performance_technical_impression', 'trust_proof', 'mobile_impression',
  ];
  const dateStr = new Date(meta.generatedAt).toLocaleDateString(meta.locale);

  return (
    <Document title={`${t.title} — ${meta.domain}`} author="amai.ch">
      <Page size="A4" style={s.page} wrap>
        <Text style={s.brand}>amai</Text>
        <Text style={s.title}>{t.title}</Text>
        <Text style={s.meta}>{t.for} {meta.domain} · {meta.websiteUrl}</Text>
        <Text style={s.meta}>{t.date}: {dateStr}</Text>
        <View style={s.rule} />

        <Text style={s.h2}>{t.summary}</Text>
        <Text style={s.p}>{content.executive_summary}</Text>

        <Text style={s.h2}>{t.scorecard}</Text>
        {axisOrder.map((axis) => {
          const v = clampScore(Number(sc[axis] ?? 0));
          return (
            <View key={axis} style={s.scoreRow}>
              <Text style={s.scoreLabel}>{t.axes[axis]}</Text>
              <View style={s.barTrack}><View style={[s.barFill, { width: `${v * 10}%` }]} /></View>
              <Text style={s.scoreVal}>{v.toFixed(1)}</Text>
            </View>
          );
        })}

        {sectionOrder.map((key) => {
          const body = content[key];
          if (typeof body !== 'string' || !body.trim()) return null;
          return (
            <View key={key} wrap={false}>
              <Text style={s.h2}>{t.sections[key]}</Text>
              <Text style={s.p}>{body}</Text>
            </View>
          );
        })}

        {content.concrete_improvement_opportunities.length ? (
          <View>
            <Text style={s.h2}>{t.opportunities}</Text>
            {content.concrete_improvement_opportunities.map((item, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.p}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {content.impact_effort_recommendations.length ? (
          <View>
            <Text style={s.h2}>{t.recommendations}</Text>
            {content.impact_effort_recommendations.map((r, i) => (
              <View key={i} style={s.recRow} wrap={false}>
                <Text style={s.recTitle}>{r.title}</Text>
                <Text style={s.recMeta}>{t.impact}: {r.impact} · {t.effort}: {r.effort}</Text>
                {r.rationale ? <Text style={s.p}>{r.rationale}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <Text style={s.h2}>{t.conclusion}</Text>
        <Text style={s.p}>{content.commercial_conclusion}</Text>

        <Text style={s.footer} fixed>amai.ch · {t.disclaimer}</Text>
      </Page>
    </Document>
  );
}

/** Render the customer-facing report PDF to a Buffer. Never includes internal_sales_note. */
export async function renderReportPdf(content: WebsiteReportContent, meta: ReportPdfMeta): Promise<Buffer> {
  return renderToBuffer(buildDocument(content, meta));
}

/** `website-analysis-<domain>-<YYYY-MM-DD>.pdf`, sanitized. */
export function reportPdfFilename(domain: string | null, generatedAt: string): string {
  const safeDomain = (domain || 'website').replace(/[^a-z0-9.-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'website';
  const date = new Date(generatedAt).toISOString().slice(0, 10);
  return `website-analysis-${safeDomain}-${date}.pdf`;
}
