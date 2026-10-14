import { describe, expect, test } from "vitest";

import { getHistoryPeriodRange } from "@/features/history";
import type { MedicalPatientDashboardRecord } from "@/features/medical-team/types/medical-patient-dashboard";
import type { SymptomSeverity } from "@/types/daily-record";

import { buildDashboardPeriodMetrics } from "./build-dashboard-period-metrics";
import type { DashboardPeriodRecord } from "./map-dashboard-period-record-row";
import { selectRecentRecordsForDisplay } from "./select-recent-records-for-display";

/**
 * Fixed local afternoon in America/Maceio (UTC-3). Period windows below are
 * asserted against this instant, never against the machine clock.
 */
const REFERENCE_INSTANT = new Date("2026-09-23T15:00:00-03:00");

const SEVEN_DAY_RANGE = {
  rangeStart: "2026-09-17T03:00:00.000Z",
  rangeEnd: "2026-09-24T03:00:00.000Z",
} as const;

type PeriodRecordInput = {
  recordedAt: string;
  pefValue: number;
  coughSeverity?: SymptomSeverity;
  wheezingSeverity?: SymptomSeverity;
  shortnessOfBreathSeverity?: SymptomSeverity;
  chestTightnessSeverity?: SymptomSeverity;
  hadAttack?: boolean;
  usedRescueMedication?: boolean;
};

function periodRecord(input: PeriodRecordInput): DashboardPeriodRecord {
  return {
    recordedAt: input.recordedAt,
    pefValue: input.pefValue,
    coughSeverity: input.coughSeverity ?? 0,
    wheezingSeverity: input.wheezingSeverity ?? 0,
    shortnessOfBreathSeverity: input.shortnessOfBreathSeverity ?? 0,
    chestTightnessSeverity: input.chestTightnessSeverity ?? 0,
    hadAttack: input.hadAttack ?? false,
    usedRescueMedication: input.usedRescueMedication ?? false,
  };
}

/**
 * Same predicate as the patient query (`.gte` / `.lt` on `recorded_at`) and
 * the medical period RPC (`recorded_at >= start AND recorded_at < end`).
 */
function recordsInsideRecordedAtWindow(
  records: readonly DashboardPeriodRecord[],
  range: { rangeStart: string; rangeEnd: string }
): DashboardPeriodRecord[] {
  return records.filter(
    (record) =>
      record.recordedAt >= range.rangeStart &&
      record.recordedAt < range.rangeEnd
  );
}

function freezeRecords(records: DashboardPeriodRecord[]) {
  for (const record of records) {
    Object.freeze(record);
  }

  return Object.freeze(records);
}

describe("buildDashboardPeriodMetrics", () => {
  describe("coleção vazia", () => {
    test("devolve zeros e série vazia sem lançar", () => {
      const records: DashboardPeriodRecord[] = [];

      expect(buildDashboardPeriodMetrics(records)).toEqual({
        totalRecords: 0,
        daysWithSymptoms: 0,
        recordedAttacks: 0,
        rescueMedicationUsage: 0,
        pefChartPoints: [],
      });
      expect(records).toEqual([]);
    });
  });

  describe("um registro", () => {
    test("sem sintoma, crise ou medicação conta só o registro", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 420,
          coughSeverity: 0,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 0,
          chestTightnessSeverity: 0,
          hadAttack: false,
          usedRescueMedication: false,
        }),
      ]);

      expect(metrics).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 0,
        recordedAttacks: 0,
        rescueMedicationUsage: 0,
      });
    });

    test("com sintoma, crise e medicação reflete cada campo", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 380,
          coughSeverity: 2,
          hadAttack: true,
          usedRescueMedication: true,
        }),
      ]);

      expect(metrics).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 1,
        recordedAttacks: 1,
        rescueMedicationUsage: 1,
      });
    });
  });

  describe("total de registros", () => {
    test("conta cada registro do período, inclusive os do mesmo dia", () => {
      const records = [
        periodRecord({
          recordedAt: "2026-09-18T15:00:00.000Z",
          pefValue: 300,
        }),
        periodRecord({
          recordedAt: "2026-09-18T18:00:00.000Z",
          pefValue: 310,
        }),
        periodRecord({
          recordedAt: "2026-09-19T15:00:00.000Z",
          pefValue: 320,
        }),
      ];

      expect(buildDashboardPeriodMetrics(records).totalRecords).toBe(3);
    });

    test("a ordem de entrada não altera o total", () => {
      const first = periodRecord({
        recordedAt: "2026-09-21T12:00:00.000Z",
        pefValue: 300,
        hadAttack: true,
      });
      const second = periodRecord({
        recordedAt: "2026-09-19T12:00:00.000Z",
        pefValue: 700,
        usedRescueMedication: true,
      });
      const records = freezeRecords([second, first]);

      const metrics = buildDashboardPeriodMetrics(records);

      expect(metrics.totalRecords).toBe(2);
      expect(metrics.recordedAttacks).toBe(1);
      expect(metrics.rescueMedicationUsage).toBe(1);
      expect(records.map((record) => record.recordedAt)).toEqual([
        "2026-09-19T12:00:00.000Z",
        "2026-09-21T12:00:00.000Z",
      ]);
    });
  });

  describe("dias com sintomas", () => {
    test("um registro sintomático conta um dia", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 410,
          coughSeverity: 1,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(1);
    });

    test("dois registros sintomáticos no mesmo dia local contam um dia", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T12:00:00.000Z",
          pefValue: 410,
          coughSeverity: 1,
        }),
        periodRecord({
          recordedAt: "2026-09-20T21:00:00.000Z",
          pefValue: 390,
          wheezingSeverity: 2,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(1);
      expect(metrics.totalRecords).toBe(2);
    });

    test("registros sintomáticos em dias locais diferentes contam cada dia", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 410,
          shortnessOfBreathSeverity: 1,
        }),
        periodRecord({
          recordedAt: "2026-09-21T15:00:00.000Z",
          pefValue: 400,
          chestTightnessSeverity: 3,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(2);
    });

    test("um registro sem sintomas no mesmo dia não cria outro dia", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T12:00:00.000Z",
          pefValue: 410,
          coughSeverity: 1,
        }),
        periodRecord({
          recordedAt: "2026-09-20T18:00:00.000Z",
          pefValue: 430,
          coughSeverity: 0,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 0,
          chestTightnessSeverity: 0,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(1);
      expect(metrics.totalRecords).toBe(2);
    });

    test("severidade zero em todos os sintomas não conta o dia", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 450,
          coughSeverity: 0,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 0,
          chestTightnessSeverity: 0,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(0);
      expect(metrics.totalRecords).toBe(1);
    });

    test.each([
      ["tosse", { coughSeverity: 1 as const }],
      ["chiado", { wheezingSeverity: 2 as const }],
      ["falta de ar", { shortnessOfBreathSeverity: 3 as const }],
      ["aperto no peito", { chestTightnessSeverity: 1 as const }],
    ])("%s acima de zero conta um dia com sintomas", (_label, symptoms) => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 410,
          ...symptoms,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(1);
    });

    test("crise e medicação não criam dia com sintomas", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 410,
          hadAttack: true,
          usedRescueMedication: true,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(0);
      expect(metrics.recordedAttacks).toBe(1);
      expect(metrics.rescueMedicationUsage).toBe(1);
    });
  });

  describe("crises registradas", () => {
    test("false não conta e cada true conta um registro", () => {
      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            hadAttack: false,
          }),
          periodRecord({
            recordedAt: "2026-09-20T18:00:00.000Z",
            pefValue: 390,
            hadAttack: false,
          }),
        ]).recordedAttacks
      ).toBe(0);

      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            hadAttack: true,
          }),
          periodRecord({
            recordedAt: "2026-09-20T18:00:00.000Z",
            pefValue: 390,
            hadAttack: false,
          }),
        ]).recordedAttacks
      ).toBe(1);

      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            hadAttack: true,
          }),
          periodRecord({
            recordedAt: "2026-09-21T12:00:00.000Z",
            pefValue: 390,
            hadAttack: true,
          }),
        ]).recordedAttacks
      ).toBe(2);
    });

    test("dois true no mesmo dia local contam dois registros", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T12:00:00.000Z",
          pefValue: 400,
          hadAttack: true,
        }),
        periodRecord({
          recordedAt: "2026-09-20T21:00:00.000Z",
          pefValue: 380,
          hadAttack: true,
        }),
      ]);

      expect(metrics.recordedAttacks).toBe(2);
      expect(metrics.totalRecords).toBe(2);
    });

    test("true fora da janela não entra na contagem", () => {
      const records = [
        periodRecord({
          recordedAt: "2026-09-16T15:00:00.000Z",
          pefValue: 500,
          hadAttack: true,
        }),
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 400,
          hadAttack: true,
        }),
        periodRecord({
          recordedAt: "2026-09-24T15:00:00.000Z",
          pefValue: 360,
          hadAttack: true,
        }),
      ];

      const metrics = buildDashboardPeriodMetrics(
        recordsInsideRecordedAtWindow(records, SEVEN_DAY_RANGE)
      );

      expect(metrics.recordedAttacks).toBe(1);
      expect(metrics.totalRecords).toBe(1);
    });
  });

  describe("medicação de alívio", () => {
    test("false não conta e cada true conta um registro", () => {
      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            usedRescueMedication: false,
          }),
          periodRecord({
            recordedAt: "2026-09-21T12:00:00.000Z",
            pefValue: 390,
            usedRescueMedication: false,
          }),
        ]).rescueMedicationUsage
      ).toBe(0);

      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            usedRescueMedication: true,
          }),
          periodRecord({
            recordedAt: "2026-09-21T12:00:00.000Z",
            pefValue: 390,
            usedRescueMedication: false,
          }),
        ]).rescueMedicationUsage
      ).toBe(1);

      expect(
        buildDashboardPeriodMetrics([
          periodRecord({
            recordedAt: "2026-09-20T12:00:00.000Z",
            pefValue: 400,
            usedRescueMedication: true,
          }),
          periodRecord({
            recordedAt: "2026-09-21T12:00:00.000Z",
            pefValue: 390,
            usedRescueMedication: true,
          }),
        ]).rescueMedicationUsage
      ).toBe(2);
    });

    test("dois true no mesmo dia local contam dois registros", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T12:00:00.000Z",
          pefValue: 400,
          usedRescueMedication: true,
        }),
        periodRecord({
          recordedAt: "2026-09-20T21:00:00.000Z",
          pefValue: 380,
          usedRescueMedication: true,
        }),
      ]);

      expect(metrics.rescueMedicationUsage).toBe(2);
    });

    test("true fora da janela não entra na contagem", () => {
      const records = [
        periodRecord({
          recordedAt: "2026-09-16T15:00:00.000Z",
          pefValue: 500,
          usedRescueMedication: true,
        }),
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 400,
          usedRescueMedication: false,
        }),
      ];

      expect(
        buildDashboardPeriodMetrics(
          recordsInsideRecordedAtWindow(records, SEVEN_DAY_RANGE)
        ).rescueMedicationUsage
      ).toBe(0);
    });

    test("crise não implica uso de medicação", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 400,
          hadAttack: true,
          usedRescueMedication: false,
        }),
      ]);

      expect(metrics.recordedAttacks).toBe(1);
      expect(metrics.rescueMedicationUsage).toBe(0);
    });
  });

  describe("limites do período", () => {
    test("7 dias inclui o início, o dia local corrente e exclui o fim", () => {
      expect(getHistoryPeriodRange(7, REFERENCE_INSTANT)).toEqual(
        SEVEN_DAY_RANGE
      );

      const records = [
        periodRecord({
          recordedAt: "2026-09-16T15:00:00.000Z",
          pefValue: 100,
        }),
        periodRecord({
          recordedAt: "2026-09-17T02:59:59.999Z",
          pefValue: 110,
        }),
        periodRecord({
          recordedAt: "2026-09-17T03:00:00.000Z",
          pefValue: 120,
        }),
        periodRecord({
          recordedAt: "2026-09-20T12:00:00.000Z",
          pefValue: 130,
        }),
        periodRecord({
          recordedAt: "2026-09-20T18:00:00.000Z",
          pefValue: 140,
        }),
        periodRecord({
          recordedAt: "2026-09-23T18:00:00.000Z",
          pefValue: 150,
        }),
        periodRecord({
          recordedAt: "2026-09-24T02:59:59.999Z",
          pefValue: 160,
        }),
        periodRecord({
          recordedAt: "2026-09-24T03:00:00.000Z",
          pefValue: 170,
        }),
        periodRecord({
          recordedAt: "2026-09-25T15:00:00.000Z",
          pefValue: 180,
        }),
      ];
      const frozen = freezeRecords([...records].reverse());

      const metrics = buildDashboardPeriodMetrics(
        recordsInsideRecordedAtWindow(frozen, SEVEN_DAY_RANGE)
      );

      expect(metrics.totalRecords).toBe(5);
      expect(frozen.map((record) => record.pefValue)).toEqual([
        180, 170, 160, 150, 140, 130, 120, 110, 100,
      ]);
    });

    test.each([
      {
        period: 30 as const,
        range: {
          rangeStart: "2026-08-25T03:00:00.000Z",
          rangeEnd: "2026-09-24T03:00:00.000Z",
        },
        beforeStart: "2026-08-25T02:59:59.999Z",
      },
      {
        period: 90 as const,
        range: {
          rangeStart: "2026-06-26T03:00:00.000Z",
          rangeEnd: "2026-09-24T03:00:00.000Z",
        },
        beforeStart: "2026-06-26T02:59:59.999Z",
      },
    ])(
      "$period dias inclui o início exato e exclui o fim exclusivo",
      ({ period, range, beforeStart }) => {
        expect(getHistoryPeriodRange(period, REFERENCE_INSTANT)).toEqual(range);

        const records = [
          periodRecord({ recordedAt: beforeStart, pefValue: 200 }),
          periodRecord({ recordedAt: range.rangeStart, pefValue: 210 }),
          periodRecord({
            recordedAt: "2026-09-24T02:59:59.999Z",
            pefValue: 220,
          }),
          periodRecord({ recordedAt: range.rangeEnd, pefValue: 230 }),
        ];

        expect(
          buildDashboardPeriodMetrics(
            recordsInsideRecordedAtWindow(records, range)
          ).totalRecords
        ).toBe(2);
      }
    );

    test("o mesmo instante entra em 90 dias e fica fora de 7 e 30", () => {
      const records = [
        periodRecord({
          recordedAt: "2026-08-01T15:00:00.000Z",
          pefValue: 330,
        }),
      ];
      const sevenDays = {
        rangeStart: "2026-09-17T03:00:00.000Z",
        rangeEnd: "2026-09-24T03:00:00.000Z",
      };
      const thirtyDays = {
        rangeStart: "2026-08-25T03:00:00.000Z",
        rangeEnd: "2026-09-24T03:00:00.000Z",
      };
      const ninetyDays = {
        rangeStart: "2026-06-26T03:00:00.000Z",
        rangeEnd: "2026-09-24T03:00:00.000Z",
      };

      expect(
        buildDashboardPeriodMetrics(
          recordsInsideRecordedAtWindow(records, sevenDays)
        ).totalRecords
      ).toBe(0);
      expect(
        buildDashboardPeriodMetrics(
          recordsInsideRecordedAtWindow(records, thirtyDays)
        ).totalRecords
      ).toBe(0);
      expect(
        buildDashboardPeriodMetrics(
          recordsInsideRecordedAtWindow(records, ninetyDays)
        ).totalRecords
      ).toBe(1);
    });

    test("1º de setembro entra em 30 e 90 dias e fica fora de 7", () => {
      const records = [
        periodRecord({
          recordedAt: "2026-09-01T15:00:00.000Z",
          pefValue: 340,
        }),
      ];

      expect(
        recordsInsideRecordedAtWindow(records, {
          rangeStart: "2026-09-17T03:00:00.000Z",
          rangeEnd: "2026-09-24T03:00:00.000Z",
        })
      ).toHaveLength(0);
      expect(
        recordsInsideRecordedAtWindow(records, {
          rangeStart: "2026-08-25T03:00:00.000Z",
          rangeEnd: "2026-09-24T03:00:00.000Z",
        })
      ).toHaveLength(1);
      expect(
        recordsInsideRecordedAtWindow(records, {
          rangeStart: "2026-06-26T03:00:00.000Z",
          rangeEnd: "2026-09-24T03:00:00.000Z",
        })
      ).toHaveLength(1);
    });
  });

  describe("fuso horário", () => {
    test("meia-noite local separa dois dias com sintomas", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-23T02:59:59.000Z",
          pefValue: 400,
          coughSeverity: 1,
        }),
        periodRecord({
          recordedAt: "2026-09-23T03:00:00.000Z",
          pefValue: 410,
          wheezingSeverity: 1,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(2);
      expect(metrics.totalRecords).toBe(2);
    });

    test("dois instantes UTC em datas diferentes formam um dia local", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-22T15:00:00.000Z",
          pefValue: 400,
          coughSeverity: 1,
        }),
        periodRecord({
          recordedAt: "2026-09-23T02:59:59.000Z",
          pefValue: 390,
          chestTightnessSeverity: 2,
        }),
      ]);

      expect(metrics.daysWithSymptoms).toBe(1);
    });
  });

  describe("último registro e período", () => {
    test("o PEF mais recente fica fora das métricas do período selecionado", () => {
      const olderInside = periodRecord({
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 700,
        coughSeverity: 1,
        hadAttack: true,
      });
      const newerOutside = periodRecord({
        recordedAt: "2026-09-24T15:00:00.000Z",
        pefValue: 350,
      });
      const periodRecords = freezeRecords([newerOutside, olderInside]);

      const metrics = buildDashboardPeriodMetrics(
        recordsInsideRecordedAtWindow(periodRecords, SEVEN_DAY_RANGE)
      );

      expect(metrics).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 1,
        recordedAttacks: 1,
        rescueMedicationUsage: 0,
      });

      const [latest] = selectRecentRecordsForDisplay([
        {
          id: "record-older",
          patientId: "patient-fixture",
          recordedAt: olderInside.recordedAt,
          pefValue: olderInside.pefValue,
          coughSeverity: 1,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 0,
          chestTightnessSeverity: 0,
          hadAttack: true,
          usedRescueMedication: false,
          notes: null,
          createdAt: "2026-09-24T18:00:00.000Z",
          updatedAt: "2026-09-24T18:00:00.000Z",
        },
        {
          id: "record-newer",
          patientId: "patient-fixture",
          recordedAt: newerOutside.recordedAt,
          pefValue: newerOutside.pefValue,
          coughSeverity: 0,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 0,
          chestTightnessSeverity: 0,
          hadAttack: false,
          usedRescueMedication: false,
          notes: null,
          createdAt: "2026-09-01T12:00:00.000Z",
          updatedAt: "2026-09-01T12:00:00.000Z",
        },
      ]);

      expect(latest?.pefValue).toBe(350);
      expect(latest?.recordedAt).toBe("2026-09-24T15:00:00.000Z");
      expect(periodRecords.map((record) => record.pefValue)).toEqual([
        350, 700,
      ]);
    });
  });

  describe("valores zero e data inválida", () => {
    test("PEF zero continua no total e não vira ponto numérico falso", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "2026-09-20T15:00:00.000Z",
          pefValue: 0,
          coughSeverity: 0,
          hadAttack: false,
          usedRescueMedication: false,
        }),
      ]);

      expect(metrics).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 0,
        recordedAttacks: 0,
        rescueMedicationUsage: 0,
      });
      expect(metrics.pefChartPoints).toEqual([]);
    });

    test("timestamp ilegível não vira o relógio atual nem um dia com sintomas", () => {
      const metrics = buildDashboardPeriodMetrics([
        periodRecord({
          recordedAt: "not-a-date",
          pefValue: 400,
          coughSeverity: 2,
          hadAttack: true,
          usedRescueMedication: false,
        }),
      ]);

      expect(metrics).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 0,
        recordedAttacks: 1,
        rescueMedicationUsage: 0,
      });
      expect(Number.isNaN(metrics.daysWithSymptoms)).toBe(false);
    });
  });

  describe("paciente e equipe médica", () => {
    test("o mesmo registro produz as métricas compartilhadas", () => {
      const shared: MedicalPatientDashboardRecord = {
        recordedAt: "2026-09-20T15:00:00.000Z",
        pefValue: 360,
        coughSeverity: 1,
        wheezingSeverity: 0,
        shortnessOfBreathSeverity: 0,
        chestTightnessSeverity: 0,
        hadAttack: false,
        usedRescueMedication: true,
      };

      expect(buildDashboardPeriodMetrics([shared])).toMatchObject({
        totalRecords: 1,
        daysWithSymptoms: 1,
        recordedAttacks: 0,
        rescueMedicationUsage: 1,
      });
    });
  });
});
