/**
 * PDF-only presentation constants (Issue 98). Distinct from `../constants`,
 * which holds copy shared with the browser report.
 */

/** Safe PDF document metadata. Never includes patient data. */
export const REPORT_PDF_METADATA = {
  title: "Relatório de acompanhamento AsthmaTrack",
  subject: "Resumo dos registros do período selecionado",
  creator: "AsthmaTrack",
  producer: "AsthmaTrack",
} as const;

/** ASCII, non-sensitive filename base. Never includes patient data. */
export const REPORT_PDF_FILENAME_PREFIX = "relatorio-asthmatrack";

/** A4 page margin in points, within the 28-40pt suggested range. */
export const REPORT_PDF_PAGE_MARGIN = 36;

/** Reserved bottom padding so the fixed page-number footer never overlaps content. */
export const REPORT_PDF_PAGE_BOTTOM_PADDING = 46;

/**
 * Fixed printable chart box. A4 portrait content width at a 36pt margin is
 * about 523pt; 480pt keeps a safe margin from the section border.
 */
export const REPORT_PDF_CHART_WIDTH = 480;
export const REPORT_PDF_CHART_HEIGHT = 190;

/** Inner plotting padding reserved for axis labels, in points. */
export const REPORT_PDF_CHART_PADDING = {
  top: 6,
  right: 6,
  bottom: 18,
  left: 30,
} as const;

export const REPORT_PDF_EMPTY_PERIOD_MESSAGE =
  "Nenhum registro no período selecionado.";

export const REPORT_PDF_CHART_UNAVAILABLE_MESSAGE =
  "Gráfico de PEF indisponível.";

export const REPORT_PDF_PEF_SUMMARY_UNAVAILABLE_MESSAGE =
  "Não foi possível calcular os valores de PEF deste período.";

export const REPORT_PDF_SYMPTOM_SUMMARY_UNAVAILABLE_MESSAGE =
  "Não foi possível calcular a frequência dos sintomas deste período.";

export const REPORT_PDF_ATTACKS_SUMMARY_UNAVAILABLE_MESSAGE =
  "Não foi possível calcular as crises registradas neste período.";

export const REPORT_PDF_ATTACKS_ZERO_MESSAGE =
  "Nenhuma crise registrada no período selecionado.";
