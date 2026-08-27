import type { SymptomSeverity } from "@/types/daily-record";

export type SymptomSeverityOption = {
  value: SymptomSeverity;
  label: string;
};

export const SYMPTOM_SEVERITY_OPTIONS: ReadonlyArray<SymptomSeverityOption> = [
  { value: 0, label: "Nenhuma" },
  { value: 1, label: "Leve" },
  { value: 2, label: "Moderada" },
  { value: 3, label: "Intensa" },
];

export const WHEEZING_SEVERITY_OPTIONS: ReadonlyArray<SymptomSeverityOption> = [
  { value: 0, label: "Nenhum" },
  { value: 1, label: "Leve" },
  { value: 2, label: "Moderado" },
  { value: 3, label: "Intenso" },
];
