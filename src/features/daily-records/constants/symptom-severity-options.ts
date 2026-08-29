import type { SymptomSeverity } from "@/types/daily-record";

export type SymptomSeverityOption = {
  value: SymptomSeverity;
  label: string;
};

/**
 * Single source of truth for every symptom severity selector rendered by
 * `DailyRecordSymptomFields`.
 *
 * This array is module-level, immutable and never mutated, sorted or
 * filtered at runtime — it is identical on the server and on the client,
 * does not depend on state, validation errors or any browser API, and its
 * declaration order is the exact order fields are rendered in. Adding a new
 * symptom means adding one entry here; no other file needs a new
 * state/handler/JSX triplet, which is what caused the previous per-field
 * drift (issues 49–51).
 */
export const SYMPTOM_FIELDS = [
  {
    name: "coughSeverity",
    label: "Tosse",
    hint: "Selecione a intensidade da tosse que você observou.",
    options: [
      { value: 0, label: "Nenhuma" },
      { value: 1, label: "Leve" },
      { value: 2, label: "Moderada" },
      { value: 3, label: "Intensa" },
    ],
  },
  {
    name: "wheezingSeverity",
    label: "Chiado",
    hint: "Selecione a intensidade do chiado que você observou.",
    options: [
      { value: 0, label: "Nenhum" },
      { value: 1, label: "Leve" },
      { value: 2, label: "Moderado" },
      { value: 3, label: "Intenso" },
    ],
  },
  {
    name: "shortnessOfBreathSeverity",
    label: "Falta de ar",
    hint: "Selecione a intensidade da falta de ar que você observou.",
    options: [
      { value: 0, label: "Nenhuma" },
      { value: 1, label: "Leve" },
      { value: 2, label: "Moderada" },
      { value: 3, label: "Intensa" },
    ],
  },
  {
    name: "chestTightnessSeverity",
    label: "Aperto no peito",
    hint: "Selecione a intensidade do aperto no peito que você observou.",
    options: [
      { value: 0, label: "Nenhum" },
      { value: 1, label: "Leve" },
      { value: 2, label: "Moderado" },
      { value: 3, label: "Intenso" },
    ],
  },
] as const satisfies ReadonlyArray<{
  name: string;
  label: string;
  hint: string;
  options: ReadonlyArray<SymptomSeverityOption>;
}>;

export type SymptomFieldName = (typeof SYMPTOM_FIELDS)[number]["name"];
