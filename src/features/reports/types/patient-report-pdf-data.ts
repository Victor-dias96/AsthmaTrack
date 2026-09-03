import type { PefChartPoint } from "@/features/daily-records/types/pef-chart-point";

import type { PefSummary } from "../lib/calculate-pef-summary";
import type { RecordedAttacksSummary } from "../lib/calculate-recorded-attacks-summary";
import type { SymptomFrequencySummary } from "../lib/calculate-symptom-frequency-summary";

/**
 * Narrow, serializable and privacy-reviewed report model for PDF generation
 * (Issue 98). Reuses the exact same summary types as the browser report so
 * the PDF and the browser can never diverge in calculation semantics.
 *
 * Every string is already safely normalized and pt-BR/product-timezone
 * formatted where appropriate (`periodStart`, `periodEnd`, `generatedAt`).
 * `recordCount === 0` is the authoritative empty-period signal; summaries
 * and chart points are naturally `null`/empty in that case and the PDF
 * document renders the contextual empty message instead of fabricating
 * statistics.
 *
 * Deliberately excludes: patientId, raw record UUIDs, notes, auth state,
 * Supabase objects, and query errors.
 */
export type PatientReportPdfData = {
  patientName: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  recordCount: number;
  pefSummary: PefSummary | null;
  symptomSummary: SymptomFrequencySummary | null;
  attacksSummary: RecordedAttacksSummary | null;
  chartPoints: readonly PefChartPoint[];
  informationalNotice: string;
};

/**
 * Discriminated outcome of building the authenticated patient's PDF report
 * model. `unavailable` covers a failed profile/records query, an
 * unformattable generation timestamp, or unusable display dates — the PDF
 * route must not generate a document in that case.
 */
export type PatientReportPdfResult =
  | { status: "ready"; data: PatientReportPdfData }
  | { status: "unavailable" };
