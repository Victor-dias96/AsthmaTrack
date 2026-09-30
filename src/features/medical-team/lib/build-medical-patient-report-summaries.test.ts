import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { calculatePefSummary } from "@/features/reports/lib/calculate-pef-summary";
import { calculateRecordedAttacksSummary } from "@/features/reports/lib/calculate-recorded-attacks-summary";
import { calculateSymptomFrequencySummary } from "@/features/reports/lib/calculate-symptom-frequency-summary";
import { mapReportRecordsToPefChartPoints } from "@/features/reports/lib/map-report-records-to-pef-chart-points";

import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";
import { buildMedicalPatientReportSummaries } from "./build-medical-patient-report-summaries";

function record(
  overrides: Partial<MedicalPatientDashboardRecord> &
    Pick<MedicalPatientDashboardRecord, "recordedAt" | "pefValue">
): MedicalPatientDashboardRecord {
  return {
    coughSeverity: 0,
    wheezingSeverity: 0,
    shortnessOfBreathSeverity: 0,
    chestTightnessSeverity: 0,
    hadAttack: false,
    usedRescueMedication: false,
    ...overrides,
  };
}

const PATIENT_A_PERIOD_RECORDS: readonly MedicalPatientDashboardRecord[] = [
  record({
    recordedAt: "2026-09-01T15:00:00.000Z",
    pefValue: 420,
    coughSeverity: 1,
    hadAttack: true,
  }),
  record({
    recordedAt: "2026-09-01T15:00:00.000Z",
    pefValue: 380,
    wheezingSeverity: 2,
    hadAttack: true,
  }),
  record({
    recordedAt: "2026-09-03T10:00:00.000Z",
    pefValue: 450,
    chestTightnessSeverity: 1,
    hadAttack: false,
  }),
];

describe("buildMedicalPatientReportSummaries", () => {
  test("matches the patient report helpers for the same records", () => {
    const summaries = buildMedicalPatientReportSummaries(
      PATIENT_A_PERIOD_RECORDS
    );

    assert.deepEqual(
      summaries.pefSummary,
      calculatePefSummary(PATIENT_A_PERIOD_RECORDS)
    );
    assert.deepEqual(
      summaries.symptomSummary,
      calculateSymptomFrequencySummary(PATIENT_A_PERIOD_RECORDS)
    );
    assert.deepEqual(
      summaries.attacksSummary,
      calculateRecordedAttacksSummary(PATIENT_A_PERIOD_RECORDS)
    );
    assert.deepEqual(
      summaries.chartPoints,
      mapReportRecordsToPefChartPoints(PATIENT_A_PERIOD_RECORDS)
    );
    assert.equal(summaries.recordCount, 3);
  });

  test("keeps latest, mean, min, max and duplicate attack timestamps", () => {
    const summaries = buildMedicalPatientReportSummaries(
      PATIENT_A_PERIOD_RECORDS
    );

    assert.deepEqual(summaries.pefSummary, {
      latest: 450,
      average: 1250 / 3,
      minimum: 380,
      maximum: 450,
      measurementCount: 3,
    });
    assert.deepEqual(
      summaries.symptomSummary?.items.map((item) => item.symptom),
      ["cough", "wheezing", "shortnessOfBreath", "chestTightness"]
    );
    assert.equal(summaries.symptomSummary?.totalRecords, 3);
    assert.equal(summaries.symptomSummary?.items[0]?.count, 1);
    assert.equal(summaries.symptomSummary?.items[1]?.count, 1);
    assert.equal(summaries.symptomSummary?.items[2]?.count, 0);
    assert.equal(summaries.symptomSummary?.items[2]?.percentage, 0);
    assert.equal(summaries.symptomSummary?.items[3]?.count, 1);
    assert.deepEqual(
      summaries.attacksSummary?.attacks.map((attack) => attack.recordedAt),
      ["2026-09-01T15:00:00.000Z", "2026-09-01T15:00:00.000Z"]
    );
    assert.deepEqual(
      summaries.chartPoints.map((point) => point.pefValue),
      [420, 380, 450]
    );
    assert.equal("notes" in summaries, false);
  });

  test("does not fabricate summaries for an empty record list", () => {
    const summaries = buildMedicalPatientReportSummaries([]);

    assert.equal(summaries.recordCount, 0);
    assert.equal(summaries.pefSummary, null);
    assert.equal(summaries.symptomSummary, null);
    assert.equal(summaries.attacksSummary, null);
    assert.deepEqual(summaries.chartPoints, []);
  });
});
