import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  REPORT_DOCUMENT_TITLE,
  REPORT_INFORMATIONAL_NOTICE_TITLE,
} from "../constants";
import type { SymptomFrequencyItem } from "../lib/calculate-symptom-frequency-summary";
import { formatReportRecordedAt } from "../lib/format-report-period-dates";
import {
  formatReportPefAverage,
  formatReportPefInteger,
  formatReportPefMeasurementCount,
} from "../lib/format-report-pef-value";
import { formatReportRecordCount } from "../lib/format-report-record-count";
import { formatReportRecordedAttackCountParts } from "../lib/format-report-recorded-attack";
import {
  formatReportSymptomPercentage,
  formatReportSymptomRecordPhrase,
} from "../lib/format-report-symptom-frequency";
import { REPORT_SYMPTOM_FREQUENCY_LABELS } from "../lib/report-symptom-frequency-labels";
import type { PatientReportPdfData } from "../types/patient-report-pdf-data";
import {
  REPORT_PDF_ATTACKS_SUMMARY_UNAVAILABLE_MESSAGE,
  REPORT_PDF_ATTACKS_ZERO_MESSAGE,
  REPORT_PDF_EMPTY_PERIOD_MESSAGE,
  REPORT_PDF_METADATA,
  REPORT_PDF_PAGE_BOTTOM_PADDING,
  REPORT_PDF_PAGE_MARGIN,
  REPORT_PDF_PEF_SUMMARY_UNAVAILABLE_MESSAGE,
  REPORT_PDF_SYMPTOM_SUMMARY_UNAVAILABLE_MESSAGE,
} from "./constants";
import { PdfPefEvolutionChart } from "./pdf-pef-evolution-chart";

const BORDER_COLOR = "#94a3b8";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#374151";
const TEXT_MUTED = "#6b7280";
const NOTICE_BACKGROUND = "#e8eefb";

const styles = StyleSheet.create({
  page: {
    paddingTop: REPORT_PDF_PAGE_MARGIN,
    paddingHorizontal: REPORT_PDF_PAGE_MARGIN,
    paddingBottom: REPORT_PDF_PAGE_BOTTOM_PADDING,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: TEXT_PRIMARY,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  section: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
  },
  notice: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    backgroundColor: NOTICE_BACKGROUND,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  sectionDescription: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    color: TEXT_PRIMARY,
    lineHeight: 1.4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaItem: {
    width: "33.33%",
    paddingRight: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: TEXT_PRIMARY,
    lineHeight: 1.35,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricItem: {
    width: "25%",
    paddingRight: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  metricUnit: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: TEXT_SECONDARY,
  },
  metricNote: {
    fontSize: 8.5,
    color: TEXT_SECONDARY,
    marginTop: 6,
  },
  attacksCount: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  attacksPhrase: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginLeft: 4,
  },
  attacksListLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  attacksListItem: {
    fontSize: 9.5,
    color: TEXT_PRIMARY,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: REPORT_PDF_PAGE_MARGIN,
    right: REPORT_PDF_PAGE_MARGIN,
    fontSize: 8,
    color: TEXT_MUTED,
    textAlign: "center",
  },
});

function PdfMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function PdfHeader({ data }: { data: PatientReportPdfData }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.title}>{REPORT_DOCUMENT_TITLE}</Text>
      <View style={styles.metaRow}>
        <PdfMetaItem label="Paciente" value={data.patientName} />
        <PdfMetaItem
          label="Período"
          value={`${data.periodLabel}, de ${data.periodStart} a ${data.periodEnd}`}
        />
        <PdfMetaItem label="Gerado em" value={data.generatedAt} />
      </View>
    </View>
  );
}

function PdfEmptyPeriodSection() {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Resumo do período</Text>
      <Text style={styles.paragraph}>{REPORT_PDF_EMPTY_PERIOD_MESSAGE}</Text>
    </View>
  );
}

function PdfPeriodSummarySection({ data }: { data: PatientReportPdfData }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Resumo do período</Text>
      <Text style={styles.value}>{data.periodLabel}</Text>
      <Text style={[styles.value, { marginTop: 2 }]}>
        De {data.periodStart} a {data.periodEnd}
      </Text>
      <Text style={[styles.value, { marginTop: 2, fontFamily: "Helvetica-Bold" }]}>
        {formatReportRecordCount(data.recordCount)}
      </Text>
    </View>
  );
}

function PdfMetricItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function PdfPefSummarySection({
  summary,
}: {
  summary: PatientReportPdfData["pefSummary"];
}) {
  if (summary === null) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Resumo do PEF indisponível</Text>
        <Text style={styles.sectionDescription}>
          {REPORT_PDF_PEF_SUMMARY_UNAVAILABLE_MESSAGE}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Resumo do PEF</Text>
      <Text style={styles.sectionDescription}>
        Valores registrados no período selecionado.
      </Text>
      <View style={styles.metricRow}>
        <PdfMetricItem
          label="Último valor"
          value={formatReportPefInteger(summary.latest)}
          unit="L/min"
        />
        <PdfMetricItem
          label="Média"
          value={formatReportPefAverage(summary.average)}
          unit="L/min"
        />
        <PdfMetricItem
          label="Menor valor"
          value={formatReportPefInteger(summary.minimum)}
          unit="L/min"
        />
        <PdfMetricItem
          label="Maior valor"
          value={formatReportPefInteger(summary.maximum)}
          unit="L/min"
        />
      </View>
      <Text style={styles.metricNote}>
        {formatReportPefMeasurementCount(summary.measurementCount)}
      </Text>
    </View>
  );
}

function PdfSymptomItem({ symptom }: { symptom: SymptomFrequencyItem }) {
  const label = REPORT_SYMPTOM_FREQUENCY_LABELS[symptom.symptom];
  const countPhrase = formatReportSymptomRecordPhrase(
    symptom.count,
    symptom.totalRecords
  );
  const percentageLabel = formatReportSymptomPercentage(symptom.percentage);

  return (
    <View style={styles.metricItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { fontSize: 8.5 }]}>{countPhrase}</Text>
      <Text style={styles.metricValue}>
        {percentageLabel}
        <Text style={styles.metricUnit}> %</Text>
      </Text>
    </View>
  );
}

function PdfSymptomSummarySection({
  summary,
}: {
  summary: PatientReportPdfData["symptomSummary"];
}) {
  if (summary === null) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Resumo dos sintomas indisponível</Text>
        <Text style={styles.sectionDescription}>
          {REPORT_PDF_SYMPTOM_SUMMARY_UNAVAILABLE_MESSAGE}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Resumo dos sintomas</Text>
      <Text style={styles.sectionDescription}>
        Frequência dos sintomas nos registros do período selecionado.
      </Text>
      <View style={styles.metricRow}>
        {summary.items.map((item) => (
          <PdfSymptomItem key={item.symptom} symptom={item} />
        ))}
      </View>
    </View>
  );
}

function PdfAttacksSummarySection({
  summary,
}: {
  summary: PatientReportPdfData["attacksSummary"];
}) {
  if (summary === null) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Resumo das crises indisponível</Text>
        <Text style={styles.sectionDescription}>
          {REPORT_PDF_ATTACKS_SUMMARY_UNAVAILABLE_MESSAGE}
        </Text>
      </View>
    );
  }

  const countParts = formatReportRecordedAttackCountParts(summary.count);

  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Resumo das crises</Text>
        <Text style={styles.sectionDescription}>
          Crises informadas nos registros do período selecionado.
        </Text>
        {summary.count === 0 ? (
          <Text style={styles.value}>{REPORT_PDF_ATTACKS_ZERO_MESSAGE}</Text>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.attacksCount}>{countParts.formattedCount}</Text>
            <Text style={styles.attacksPhrase}>{countParts.phrase}</Text>
          </View>
        )}
      </View>
      {summary.count > 0 ? (
        <View>
          <Text style={styles.attacksListLabel}>
            Datas das crises registradas
          </Text>
          {summary.attacks.map((attack, index) => {
            const formatted = formatReportRecordedAt(attack.recordedAt);

            if (formatted === null) {
              return null;
            }

            return (
              <Text key={`pdf-attack-${index}`} style={styles.attacksListItem}>
                {`\u2022 ${formatted.label}`}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function PdfChartSection({
  chartPoints,
}: {
  chartPoints: PatientReportPdfData["chartPoints"];
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Evolução do PEF</Text>
      <Text style={styles.sectionDescription}>
        Medições registradas no período selecionado. PEF em litros por minuto
        (L/min).
      </Text>
      <PdfPefEvolutionChart data={chartPoints} />
    </View>
  );
}

function PdfInformationalNotice({ notice }: { notice: string }) {
  return (
    <View style={styles.notice} wrap={false}>
      <Text style={styles.sectionTitle}>{REPORT_INFORMATIONAL_NOTICE_TITLE}</Text>
      <Text style={styles.sectionDescription}>{notice}</Text>
    </View>
  );
}

export type PatientReportPdfDocumentProps = {
  data: PatientReportPdfData;
};

/**
 * Dedicated PDF document component (Issue 98). Renders only trusted,
 * already-calculated, already-normalized report values through
 * `@react-pdf/renderer` primitives — never browser DOM elements, never
 * Tailwind classes, never `dangerouslySetInnerHTML`, never arbitrary HTML,
 * never Markdown interpretation.
 *
 * Performs no Supabase query, no authentication, no browser navigation and
 * no data fetching. Accepts no patient ID and no raw Supabase row — only the
 * narrow `PatientReportPdfData` model built server-side by
 * `getPatientReportPdfData`.
 */
export function PatientReportPdfDocument({ data }: PatientReportPdfDocumentProps) {
  return (
    <Document
      title={REPORT_PDF_METADATA.title}
      subject={REPORT_PDF_METADATA.subject}
      creator={REPORT_PDF_METADATA.creator}
      producer={REPORT_PDF_METADATA.producer}
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader data={data} />

        {data.recordCount === 0 ? (
          <>
            <PdfEmptyPeriodSection />
            <PdfInformationalNotice notice={data.informationalNotice} />
          </>
        ) : (
          <>
            <PdfPeriodSummarySection data={data} />
            <PdfPefSummarySection summary={data.pefSummary} />
            <PdfSymptomSummarySection summary={data.symptomSummary} />
            <PdfAttacksSummarySection summary={data.attacksSummary} />
            <PdfChartSection chartPoints={data.chartPoints} />
            <PdfInformationalNotice notice={data.informationalNotice} />
          </>
        )}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
