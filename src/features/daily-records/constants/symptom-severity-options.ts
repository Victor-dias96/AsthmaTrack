import type { SymptomSeverity } from "@/types/daily-record";

export const SYMPTOM_SEVERITY_OPTIONS: ReadonlyArray<{
  value: SymptomSeverity;
  label: string;
}> = [
  { value: 0, label: "Nenhuma" },
  { value: 1, label: "Leve" },
  { value: 2, label: "Moderada" },
  { value: 3, label: "Intensa" },
];
