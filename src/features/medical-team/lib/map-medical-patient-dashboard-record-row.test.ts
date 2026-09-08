import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  normalizeMedicalDashboardRpcRows,
  parseMedicalPatientLatestRecordsRows,
  parseMedicalPatientPeriodRecordsRows,
} from "./map-medical-patient-dashboard-record-row";

function populatedLatestRow(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    patient_full_name: "Ana Lima",
    recorded_at: "2026-09-08T17:30:00.000Z",
    pef_value: 320,
    cough_severity: 0,
    wheezing_severity: 1,
    shortness_of_breath_severity: 0,
    chest_tightness_severity: 0,
    had_attack: false,
    used_rescue_medication: false,
    ...overrides,
  };
}

function emptyLatestRow(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    patient_full_name: "Ana Lima",
    recorded_at: null,
    pef_value: null,
    cough_severity: null,
    wheezing_severity: null,
    shortness_of_breath_severity: null,
    chest_tightness_severity: null,
    had_attack: null,
    used_rescue_medication: null,
    ...overrides,
  };
}

describe("parseMedicalPatientLatestRecordsRows", () => {
  test("maps 1-3 populated rows sharing the same patient name", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ recorded_at: "2026-09-08T17:30:00.000Z" }),
      populatedLatestRow({ recorded_at: "2026-09-07T10:00:00.000Z" }),
    ]);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;

    assert.equal(result.patientName, "Ana Lima");
    assert.equal(result.records.length, 2);
    assert.equal(result.records[0]?.pefValue, 320);
  });

  test("exactly one all-null row means zero records, keeping the patient name", () => {
    const result = parseMedicalPatientLatestRecordsRows([emptyLatestRow()]);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;

    assert.equal(result.patientName, "Ana Lima");
    assert.deepEqual(result.records, []);
  });

  test("omitted null record fields are the authorized empty sentinel, not unavailable", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      { patient_full_name: "Ana Lima" },
    ]);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;

    assert.equal(result.patientName, "Ana Lima");
    assert.deepEqual(result.records, []);
  });

  test("falls back to the safe display name when full_name is null", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      emptyLatestRow({ patient_full_name: null }),
    ]);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;

    assert.equal(result.patientName, "Nome não informado");
  });

  test("a half-populated row is malformed data, not a valid record", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ pef_value: null }),
    ]);

    assert.equal(result.status, "error");
  });

  test("inconsistent patient_full_name across rows is malformed", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ patient_full_name: "Ana Lima" }),
      populatedLatestRow({ patient_full_name: "Outro Nome" }),
    ]);

    assert.equal(result.status, "error");
  });

  test("an out-of-range severity is rejected", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ cough_severity: 9 }),
    ]);

    assert.equal(result.status, "error");
  });

  test("a non-finite PEF is rejected", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ pef_value: Number.NaN }),
    ]);

    assert.equal(result.status, "error");
  });

  test("an empty array is malformed (the caller must treat zero rows as inaccessible before calling this parser)", () => {
    const result = parseMedicalPatientLatestRecordsRows([]);

    assert.equal(result.status, "error");
  });

  test("an empty object is an authorized empty sentinel with the name fallback", () => {
    const result = parseMedicalPatientLatestRecordsRows([{}]);

    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;

    assert.equal(result.patientName, "Nome não informado");
    assert.deepEqual(result.records, []);
  });

  test("a wrong JSON type on a record field is rejected", () => {
    const result = parseMedicalPatientLatestRecordsRows([
      populatedLatestRow({ pef_value: "320" }),
    ]);

    assert.equal(result.status, "error");
  });
});

describe("normalizeMedicalDashboardRpcRows", () => {
  test("keeps an array payload", () => {
    assert.deepEqual(normalizeMedicalDashboardRpcRows([{ a: 1 }]), [{ a: 1 }]);
  });

  test("wraps a single-row object payload", () => {
    assert.deepEqual(normalizeMedicalDashboardRpcRows({ a: 1 }), [{ a: 1 }]);
  });

  test("rejects null and primitive payloads", () => {
    assert.equal(normalizeMedicalDashboardRpcRows(null), null);
    assert.equal(normalizeMedicalDashboardRpcRows("rows"), null);
  });
});

describe("parseMedicalPatientPeriodRecordsRows", () => {
  function periodRow(overrides: Record<string, unknown> = {}) {
    return {
      recorded_at: "2026-09-08T17:30:00.000Z",
      pef_value: 320,
      cough_severity: 0,
      wheezing_severity: 0,
      shortness_of_breath_severity: 0,
      chest_tightness_severity: 0,
      had_attack: false,
      used_rescue_medication: false,
      ...overrides,
    };
  }

  test("maps every well-formed row", () => {
    const records = parseMedicalPatientPeriodRecordsRows([
      periodRow(),
      periodRow({ recorded_at: "2026-09-07T10:00:00.000Z", pef_value: 280 }),
    ]);

    assert.ok(records);
    assert.equal(records?.length, 2);
    assert.equal(records?.[1]?.pefValue, 280);
  });

  test("an empty period is a valid, empty result", () => {
    assert.deepEqual(parseMedicalPatientPeriodRecordsRows([]), []);
  });

  test("returns null (not a partial list) for a non-array payload", () => {
    assert.equal(parseMedicalPatientPeriodRecordsRows({}), null);
  });

  test("returns null when any single row is malformed", () => {
    const result = parseMedicalPatientPeriodRecordsRows([
      periodRow(),
      periodRow({ pef_value: null }),
    ]);

    assert.equal(result, null);
  });
});
