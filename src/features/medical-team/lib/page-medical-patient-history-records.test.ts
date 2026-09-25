import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { pageMedicalPatientHistoryRecords } from "./page-medical-patient-history-records";
import type { MedicalPatientHistoryRecord } from "../types/medical-patient-history";

function record(recordedAt: string): MedicalPatientHistoryRecord {
  return {
    recordedAt,
    pefValue: 300,
    coughSeverity: 0,
    wheezingSeverity: 0,
    shortnessOfBreathSeverity: 0,
    chestTightnessSeverity: 0,
    hadAttack: false,
    usedRescueMedication: false,
  };
}

describe("pageMedicalPatientHistoryRecords", () => {
  test("returns the first page of an already descending list", () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      record(`2026-09-${String(25 - index).padStart(2, "0")}T12:00:00.000Z`)
    );

    const page = pageMedicalPatientHistoryRecords(records, 1);

    assert.equal(page.totalCount, 12);
    assert.equal(page.totalPages, 2);
    assert.equal(page.records.length, 10);
    assert.equal(page.records[0]?.recordedAt, records[0]?.recordedAt);
    assert.equal(page.records[9]?.recordedAt, records[9]?.recordedAt);
  });

  test("returns the remainder on the last page", () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      record(`2026-09-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`)
    );

    const page = pageMedicalPatientHistoryRecords(records, 2);

    assert.equal(page.records.length, 2);
    assert.equal(page.records[0]?.recordedAt, records[10]?.recordedAt);
  });
});
