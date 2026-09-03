import type { SymptomFrequencyId } from "./calculate-symptom-frequency-summary";

/**
 * Fixed pt-BR display labels for each symptom-frequency id, in the same
 * order as `REPORT_SYMPTOM_FREQUENCY_IDS`. Shared between the browser
 * report and the PDF document so the two surfaces never diverge in copy.
 */
export const REPORT_SYMPTOM_FREQUENCY_LABELS = {
  cough: "Tosse",
  wheezing: "Chiado",
  shortnessOfBreath: "Falta de ar",
  chestTightness: "Aperto no peito",
} as const satisfies Record<SymptomFrequencyId, string>;
