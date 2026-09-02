import type { DailyRecord } from "@/types/daily-record";

export function formatRecentRecordSymptomIndication(record: DailyRecord): string {
  const severities = [
    record.coughSeverity,
    record.wheezingSeverity,
    record.shortnessOfBreathSeverity,
    record.chestTightnessSeverity,
  ];

  if (severities.some((severity) => severity > 0)) {
    return "Com sintomas registrados";
  }

  return "Sem sintomas registrados";
}
