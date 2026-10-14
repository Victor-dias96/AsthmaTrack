import { describe, expect, test } from "vitest";

import {
  mapDashboardPeriodRecordRow,
  type DashboardPeriodRecordRow,
} from "./map-dashboard-period-record-row";

function row(
  overrides: Partial<Record<keyof DashboardPeriodRecordRow, unknown>> = {}
): DashboardPeriodRecordRow {
  return {
    id: "row-fixture",
    recorded_at: "2026-09-20T15:00:00.000Z",
    pef_value: 420,
    cough_severity: 0,
    wheezing_severity: 0,
    shortness_of_breath_severity: 0,
    chest_tightness_severity: 0,
    had_attack: false,
    used_rescue_medication: false,
    ...overrides,
  } as DashboardPeriodRecordRow;
}

describe("mapDashboardPeriodRecordRow", () => {
  test("mapeia um registro válido e descarta o id", () => {
    expect(mapDashboardPeriodRecordRow(row())).toEqual({
      recordedAt: "2026-09-20T15:00:00.000Z",
      pefValue: 420,
      coughSeverity: 0,
      wheezingSeverity: 0,
      shortnessOfBreathSeverity: 0,
      chestTightnessSeverity: 0,
      hadAttack: false,
      usedRescueMedication: false,
    });
  });

  test("preserva severidade zero e booleanos false", () => {
    const mapped = mapDashboardPeriodRecordRow(
      row({
        cough_severity: 0,
        had_attack: false,
        used_rescue_medication: false,
      })
    );

    expect(mapped?.coughSeverity).toBe(0);
    expect(mapped?.hadAttack).toBe(false);
    expect(mapped?.usedRescueMedication).toBe(false);
  });

  test("PEF zero finito permanece zero", () => {
    expect(mapDashboardPeriodRecordRow(row({ pef_value: 0 }))?.pefValue).toBe(
      0
    );
  });

  test.each([
    ["recorded_at vazio", { recorded_at: "" }],
    ["recorded_at ausente", { recorded_at: undefined }],
    ["PEF NaN", { pef_value: Number.NaN }],
    ["PEF infinito", { pef_value: Number.POSITIVE_INFINITY }],
    ["PEF ausente", { pef_value: undefined }],
    ["tosse fora da escala", { cough_severity: 4 }],
    ["chiado negativo", { wheezing_severity: -1 }],
    ["crise não booleana", { had_attack: "true" }],
    ["medicação nula", { used_rescue_medication: null }],
  ])("rejeita %s", (_label, overrides) => {
    expect(mapDashboardPeriodRecordRow(row(overrides))).toBeNull();
  });
});
