import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

export type HistorySymptomGender = "masculine" | "feminine";

export type HistorySymptomField = {
  label: string;
  gender: HistorySymptomGender;
  getSeverity: (record: DailyRecord) => SymptomSeverity;
};

export const HISTORY_SYMPTOM_FIELDS: HistorySymptomField[] = [
  {
    label: "Tosse",
    gender: "feminine",
    getSeverity: (record) => record.coughSeverity,
  },
  {
    label: "Chiado",
    gender: "masculine",
    getSeverity: (record) => record.wheezingSeverity,
  },
  {
    label: "Falta de ar",
    gender: "feminine",
    getSeverity: (record) => record.shortnessOfBreathSeverity,
  },
  {
    label: "Aperto no peito",
    gender: "masculine",
    getSeverity: (record) => record.chestTightnessSeverity,
  },
];
