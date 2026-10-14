import { describe, expect, test } from "vitest";

import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

import { RECENT_RECORDS_DISPLAY_LIMIT } from "../constants";
import { selectRecentRecordsForDisplay } from "./select-recent-records-for-display";

type RecentRecordInput = {
  id: string;
  recordedAt: string;
  pefValue: number;
  createdAt: string;
  coughSeverity?: SymptomSeverity;
  hadAttack?: boolean;
  usedRescueMedication?: boolean;
};

function recentRecord(input: RecentRecordInput): DailyRecord {
  return {
    id: input.id,
    patientId: "patient-fixture",
    recordedAt: input.recordedAt,
    pefValue: input.pefValue,
    coughSeverity: input.coughSeverity ?? 0,
    wheezingSeverity: 0,
    shortnessOfBreathSeverity: 0,
    chestTightnessSeverity: 0,
    hadAttack: input.hadAttack ?? false,
    usedRescueMedication: input.usedRescueMedication ?? false,
    notes: null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

describe("selectRecentRecordsForDisplay", () => {
  test("o PEF exibido é o do recorded_at mais novo, não o maior PEF", () => {
    const older = recentRecord({
      id: "record-older",
      recordedAt: "2026-09-01T15:00:00.000Z",
      pefValue: 700,
      createdAt: "2026-09-20T12:00:00.000Z",
    });
    const newer = recentRecord({
      id: "record-newer",
      recordedAt: "2026-09-20T15:00:00.000Z",
      pefValue: 350,
      createdAt: "2026-09-01T12:00:00.000Z",
    });
    const records = [older, newer];
    Object.freeze(records);
    Object.freeze(older);
    Object.freeze(newer);

    const [latest] = selectRecentRecordsForDisplay(records);

    expect(latest?.pefValue).toBe(350);
    expect(latest?.recordedAt).toBe("2026-09-20T15:00:00.000Z");
    expect(latest?.id).toBe("record-newer");
    expect(records.map((record) => record.id)).toEqual([
      "record-older",
      "record-newer",
    ]);
  });

  test("created_at mais novo não supera recorded_at mais antigo", () => {
    const selected = selectRecentRecordsForDisplay([
      recentRecord({
        id: "record-created-later",
        recordedAt: "2026-09-01T15:00:00.000Z",
        pefValue: 700,
        createdAt: "2026-09-20T12:00:00.000Z",
      }),
      recentRecord({
        id: "record-recorded-later",
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 350,
        createdAt: "2026-09-01T12:00:00.000Z",
      }),
    ]);

    expect(selected[0]?.id).toBe("record-recorded-later");
    expect(selected[0]?.recordedAt).toBe("2026-09-20T15:00:00.000Z");
    expect(selected[0]?.pefValue).toBe(350);
  });

  test("recorded_at igual preserva a ordem recebida", () => {
    const selected = selectRecentRecordsForDisplay([
      recentRecord({
        id: "record-first",
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 280,
        createdAt: "2026-09-01T12:00:00.000Z",
      }),
      recentRecord({
        id: "record-second",
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 640,
        createdAt: "2026-09-21T12:00:00.000Z",
      }),
    ]);

    expect(selected.map((record) => record.id)).toEqual([
      "record-first",
      "record-second",
    ]);
  });

  test("devolve no máximo os três recorded_at mais novos", () => {
    const selected = selectRecentRecordsForDisplay([
      recentRecord({
        id: "record-18",
        recordedAt: "2026-09-18T15:00:00.000Z",
        pefValue: 300,
        createdAt: "2026-09-18T15:00:00.000Z",
      }),
      recentRecord({
        id: "record-21",
        recordedAt: "2026-09-21T15:00:00.000Z",
        pefValue: 310,
        createdAt: "2026-09-21T15:00:00.000Z",
      }),
      recentRecord({
        id: "record-19",
        recordedAt: "2026-09-19T15:00:00.000Z",
        pefValue: 320,
        createdAt: "2026-09-19T15:00:00.000Z",
      }),
      recentRecord({
        id: "record-23",
        recordedAt: "2026-09-23T15:00:00.000Z",
        pefValue: 330,
        createdAt: "2026-09-23T15:00:00.000Z",
      }),
    ]);

    expect(RECENT_RECORDS_DISPLAY_LIMIT).toBe(3);
    expect(selected.map((record) => record.id)).toEqual([
      "record-23",
      "record-21",
      "record-19",
    ]);
  });

  test("severidade zero e false continuam elegíveis", () => {
    const selected = selectRecentRecordsForDisplay([
      recentRecord({
        id: "record-zero",
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 410,
        createdAt: "2026-09-20T15:00:00.000Z",
        coughSeverity: 0,
        hadAttack: false,
        usedRescueMedication: false,
      }),
    ]);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.coughSeverity).toBe(0);
    expect(selected[0]?.hadAttack).toBe(false);
    expect(selected[0]?.usedRescueMedication).toBe(false);
    expect(selected[0]?.notes).toBeNull();
  });

  test("PEF zero não é selecionado como último registro exibível", () => {
    expect(
      selectRecentRecordsForDisplay([
        recentRecord({
          id: "record-zero-pef",
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 0,
          createdAt: "2026-09-20T15:00:00.000Z",
        }),
      ])
    ).toEqual([]);
  });
});
