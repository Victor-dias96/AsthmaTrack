import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildMedicalAuthorizedPatientsResult } from "./build-medical-authorized-patients-result";
import { formatLatestRecordedAt } from "./format-latest-recorded-at";
import {
  parseMedicalAuthorizedPatientRows,
  type MedicalAuthorizedPatientRow,
} from "./map-medical-authorized-patient-row";
import { resolveLatestRecordSummary } from "./resolve-latest-record-summary";

function row(
  overrides: Partial<MedicalAuthorizedPatientRow> = {}
): MedicalAuthorizedPatientRow {
  return {
    authorizationId: "auth-a",
    patientId: "patient-a",
    patientFullName: "Ana Lima",
    grantedAt: "2026-09-01T12:00:00.000Z",
    latestPefValue: 300,
    latestRecordedAt: "2026-09-08T17:30:00.000Z",
    ...overrides,
  };
}

describe("parseMedicalAuthorizedPatientRows", () => {
  test("maps snake_case latest-record fields", () => {
    const parsed = parseMedicalAuthorizedPatientRows([
      {
        authorization_id: "auth-a",
        patient_id: "patient-a",
        patient_full_name: "Ana Lima",
        granted_at: "2026-09-01T12:00:00.000Z",
        latest_pef_value: 300,
        latest_recorded_at: "2026-09-08T17:30:00.000Z",
      },
    ]);

    assert.deepEqual(parsed, [
      {
        authorizationId: "auth-a",
        patientId: "patient-a",
        patientFullName: "Ana Lima",
        grantedAt: "2026-09-01T12:00:00.000Z",
        latestPefValue: 300,
        latestRecordedAt: "2026-09-08T17:30:00.000Z",
      },
    ]);
  });

  test("accepts null latest-record fields for patients with no records", () => {
    const parsed = parseMedicalAuthorizedPatientRows([
      {
        authorization_id: "auth-a",
        patient_id: "patient-a",
        patient_full_name: "Ana Lima",
        granted_at: "2026-09-01T12:00:00.000Z",
        latest_pef_value: null,
        latest_recorded_at: null,
      },
    ]);

    assert.equal(parsed?.[0]?.latestPefValue, null);
    assert.equal(parsed?.[0]?.latestRecordedAt, null);
  });

  test("rejects numeric strings for latest PEF without failing the list", () => {
    const parsed = parseMedicalAuthorizedPatientRows([
      {
        authorization_id: "auth-a",
        patient_id: "patient-a",
        patient_full_name: "Ana Lima",
        granted_at: "2026-09-01T12:00:00.000Z",
        latest_pef_value: "300",
        latest_recorded_at: "2026-09-08T17:30:00.000Z",
      },
    ]);

    assert.equal(parsed?.length, 1);
    assert.equal(parsed?.[0]?.latestPefValue, null);
    assert.equal(parsed?.[0]?.latestRecordedAt, "invalid");
  });

  test("Issue 107 payload without latest-record columns remains authorized", () => {
    const parsed = parseMedicalAuthorizedPatientRows([
      {
        authorization_id: "auth-a",
        patient_id: "patient-a",
        patient_full_name: "Ana Lima",
        granted_at: "2026-09-01T12:00:00.000Z",
      },
    ]);

    assert.deepEqual(parsed, [
      {
        authorizationId: "auth-a",
        patientId: "patient-a",
        patientFullName: "Ana Lima",
        grantedAt: "2026-09-01T12:00:00.000Z",
        latestPefValue: null,
        latestRecordedAt: null,
      },
    ]);
  });

  test("rejects a non-array payload", () => {
    assert.equal(parseMedicalAuthorizedPatientRows({}), null);
  });
});

describe("resolveLatestRecordSummary", () => {
  test("ready when PEF and date are both valid", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(300, "2026-09-08T17:30:00.000Z"),
      {
        kind: "ready",
        pefValue: 300,
        recordedAt: "2026-09-08T17:30:00.000Z",
      }
    );
  });

  test("empty when both latest-record fields are null", () => {
    assert.deepEqual(resolveLatestRecordSummary(null, null), { kind: "empty" });
  });

  test("unavailable when only PEF is present", () => {
    assert.deepEqual(resolveLatestRecordSummary(300, null), {
      kind: "unavailable",
    });
  });

  test("unavailable when only the date is present", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(null, "2026-09-08T17:30:00.000Z"),
      { kind: "unavailable" }
    );
  });

  test("zero is not a valid PEF", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(0, "2026-09-08T17:30:00.000Z"),
      { kind: "unavailable" }
    );
  });

  test("negative PEF is not displayed", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(-10, "2026-09-08T17:30:00.000Z"),
      { kind: "unavailable" }
    );
  });

  test("fractional PEF is not rounded into a valid value", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(300.5, "2026-09-08T17:30:00.000Z"),
      { kind: "unavailable" }
    );
  });

  test("non-finite PEF is not displayed", () => {
    assert.deepEqual(
      resolveLatestRecordSummary(Number.NaN, "2026-09-08T17:30:00.000Z"),
      { kind: "unavailable" }
    );
    assert.deepEqual(
      resolveLatestRecordSummary(
        Number.POSITIVE_INFINITY,
        "2026-09-08T17:30:00.000Z"
      ),
      { kind: "unavailable" }
    );
  });

  test("invalid date is not replaced with the current time", () => {
    assert.deepEqual(resolveLatestRecordSummary(300, "not-a-date"), {
      kind: "unavailable",
    });
  });
});

describe("formatLatestRecordedAt", () => {
  test("formats a valid timestamp in pt-BR at America/Maceio", () => {
    const formatted = formatLatestRecordedAt("2026-09-08T17:30:00.000Z");

    assert.ok(formatted);
    assert.equal(formatted.includes("08/09/2026"), true);
    assert.equal(formatted.includes("14:30"), true);
    assert.equal(formatted.includes("Invalid Date"), false);
  });

  test("returns null for an invalid timestamp", () => {
    assert.equal(formatLatestRecordedAt("not-a-date"), null);
    assert.equal(formatLatestRecordedAt(""), null);
  });
});

describe("buildMedicalAuthorizedPatientsResult", () => {
  test("ready patient keeps PEF and date from the same record", () => {
    const result = buildMedicalAuthorizedPatientsResult([
      row({
        latestPefValue: 300,
        latestRecordedAt: "2026-09-08T17:30:00.000Z",
      }),
    ]);

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.equal(result.patients[0]?.patientName, "Ana Lima");
    assert.deepEqual(result.patients[0]?.latestRecord, {
      kind: "ready",
      pefValue: 300,
      recordedAt: "2026-09-08T17:30:00.000Z",
    });
  });

  test("does not treat the highest PEF as latest in the display model", () => {
    // The RPC already selected the greatest recorded_at. The mapper must
    // keep that pair as-is and never substitute a higher PEF.
    const result = buildMedicalAuthorizedPatientsResult([
      row({
        latestPefValue: 300,
        latestRecordedAt: "2026-09-08T17:30:00.000Z",
      }),
    ]);

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.equal(result.patients[0]?.latestRecord.kind, "ready");
    if (result.patients[0]?.latestRecord.kind !== "ready") {
      return;
    }

    assert.equal(result.patients[0].latestRecord.pefValue, 300);
    assert.notEqual(result.patients[0].latestRecord.pefValue, 500);
  });

  test("patient with no records stays visible with an empty summary", () => {
    const result = buildMedicalAuthorizedPatientsResult([
      row({ latestPefValue: null, latestRecordedAt: null }),
    ]);

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.equal(result.patients.length, 1);
    assert.deepEqual(result.patients[0]?.latestRecord, { kind: "empty" });
  });

  test("Issue 107 payload still yields a ready searchable list", () => {
    const parsed = parseMedicalAuthorizedPatientRows([
      {
        authorization_id: "auth-a",
        patient_id: "patient-a",
        patient_full_name: "Ana Lima",
        granted_at: "2026-09-01T12:00:00.000Z",
      },
      {
        authorization_id: "auth-b",
        patient_id: "patient-b",
        patient_full_name: "Bruno Costa",
        granted_at: "2026-09-02T12:00:00.000Z",
      },
    ]);

    assert.ok(parsed);
    const unfiltered = buildMedicalAuthorizedPatientsResult(parsed);
    const matching = buildMedicalAuthorizedPatientsResult(parsed, "Ana");
    const missing = buildMedicalAuthorizedPatientsResult(parsed, "NomeInexistente");

    assert.equal(unfiltered.status, "ready");
    assert.equal(matching.status, "ready");
    assert.equal(missing.status, "no-results");
    if (unfiltered.status === "ready") {
      assert.equal(unfiltered.patients.length, 2);
      assert.deepEqual(unfiltered.patients[0]?.latestRecord, { kind: "empty" });
    }
    if (matching.status === "ready") {
      assert.equal(matching.patients.length, 1);
      assert.equal(matching.patients[0]?.patientName, "Ana Lima");
    }
  });

  test("malformed latest record is isolated per card", () => {
    const result = buildMedicalAuthorizedPatientsResult([
      row({
        patientId: "patient-a",
        authorizationId: "auth-a",
        patientFullName: "Ana Lima",
        latestPefValue: 0,
        latestRecordedAt: "2026-09-08T17:30:00.000Z",
      }),
      row({
        patientId: "patient-b",
        authorizationId: "auth-b",
        patientFullName: "Bruno Costa",
        latestPefValue: 280,
        latestRecordedAt: "2026-09-07T10:00:00.000Z",
      }),
    ]);

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.equal(result.patients[0]?.latestRecord.kind, "unavailable");
    assert.equal(result.patients[1]?.latestRecord.kind, "ready");
  });

  test("search still filters by authorized patient name only", () => {
    const result = buildMedicalAuthorizedPatientsResult(
      [
        row({
          patientId: "patient-a",
          authorizationId: "auth-a",
          patientFullName: "Ana Lima",
          latestPefValue: 300,
        }),
        row({
          patientId: "patient-b",
          authorizationId: "auth-b",
          patientFullName: "Bruno Costa",
          latestPefValue: 280,
        }),
      ],
      "Ana"
    );

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.equal(result.patients.length, 1);
    assert.equal(result.patients[0]?.patientName, "Ana Lima");
    assert.equal(result.patients[0]?.latestRecord.kind, "ready");
  });

  test("search does not match PEF values or record dates", () => {
    const byPef = buildMedicalAuthorizedPatientsResult(
      [row({ patientFullName: "Ana Lima", latestPefValue: 300 })],
      "300"
    );
    const byDate = buildMedicalAuthorizedPatientsResult(
      [
        row({
          patientFullName: "Ana Lima",
          latestRecordedAt: "2026-09-08T17:30:00.000Z",
        }),
      ],
      "2026"
    );

    assert.equal(byPef.status, "no-results");
    assert.equal(byDate.status, "no-results");
  });

  test("preserves authorization created_at descending order among matches", () => {
    const result = buildMedicalAuthorizedPatientsResult(
      [
        row({
          patientId: "patient-z",
          authorizationId: "auth-z",
          patientFullName: "Zed Newest",
          grantedAt: "2026-09-03T12:00:00.000Z",
        }),
        row({
          patientId: "patient-a",
          authorizationId: "auth-a",
          patientFullName: "Ana Lima",
          grantedAt: "2026-09-02T12:00:00.000Z",
        }),
        row({
          patientId: "patient-b",
          authorizationId: "auth-b",
          patientFullName: "Bruno Costa",
          grantedAt: "2026-09-01T12:00:00.000Z",
        }),
      ],
      "a"
    );

    assert.equal(result.status, "ready");
    if (result.status !== "ready") {
      return;
    }

    assert.deepEqual(
      result.patients.map((patient) => patient.patientName),
      ["Ana Lima", "Bruno Costa"]
    );
  });

  test("empty authorized list remains empty", () => {
    assert.deepEqual(buildMedicalAuthorizedPatientsResult([]), {
      status: "empty",
    });
  });

  test("search no-result remains distinct from empty", () => {
    const result = buildMedicalAuthorizedPatientsResult(
      [row({ patientFullName: "Ana Lima" })],
      "Bruno"
    );

    assert.equal(result.status, "no-results");
  });

  test("duplicate active patient ids make the list unavailable", () => {
    const result = buildMedicalAuthorizedPatientsResult([
      row({ authorizationId: "auth-1" }),
      row({ authorizationId: "auth-2" }),
    ]);

    assert.equal(result.status, "unavailable");
  });

  test("invalid authorization date makes the list unavailable", () => {
    const result = buildMedicalAuthorizedPatientsResult([
      row({ grantedAt: "not-a-date" }),
    ]);

    assert.equal(result.status, "unavailable");
  });
});
