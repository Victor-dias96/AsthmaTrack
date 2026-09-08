import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";

/**
 * Neutral, factual symptom-presence summary for one medical dashboard
 * record. Mirrors
 * src/features/dashboard/lib/format-recent-record-symptom-indication.ts
 * exactly, adapted to the narrower Issue 110 record shape (no `id`,
 * `patientId` or `notes`). Never classifies severity, never names a
 * specific symptom, and never adds a clinical interpretation.
 */
export function formatMedicalRecordSymptomIndication(
  record: MedicalPatientDashboardRecord
): string {
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
