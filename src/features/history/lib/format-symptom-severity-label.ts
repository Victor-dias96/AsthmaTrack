import type { SymptomSeverity } from "@/types/daily-record";

type SymptomGender = "masculine" | "feminine";

const SEVERITY_LABELS: Record<
  SymptomGender,
  Record<SymptomSeverity, string>
> = {
  masculine: {
    0: "Nenhum",
    1: "Leve",
    2: "Moderado",
    3: "Intenso",
  },
  feminine: {
    0: "Nenhuma",
    1: "Leve",
    2: "Moderada",
    3: "Intensa",
  },
};

export function formatSymptomSeverityLabel(
  severity: SymptomSeverity,
  gender: SymptomGender
): string {
  return SEVERITY_LABELS[gender][severity];
}
