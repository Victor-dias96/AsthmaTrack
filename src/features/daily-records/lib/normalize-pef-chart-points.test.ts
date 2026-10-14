import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { buildDashboardPeriodMetrics } from "@/features/dashboard/lib/build-dashboard-period-metrics";
import type { DashboardPeriodRecord } from "@/features/dashboard/lib/map-dashboard-period-record-row";
import { getHistoryPeriodRange } from "@/features/history";
import { buildMedicalPatientReportSummaries } from "@/features/medical-team/lib/build-medical-patient-report-summaries";
import { mapReportRecordsToPefChartPoints } from "@/features/reports/lib/map-report-records-to-pef-chart-points";

import { formatPefChartDateTimeFromIso } from "./format-pef-chart-datetime";
import {
  doesPefChartRangeCrossYears,
  formatPefChartTickDate,
} from "./format-pef-chart-tick-date";
import {
  getPefChartMeasurementListItem,
  getPefChartSummary,
} from "./get-pef-chart-accessibility-text";
import {
  normalizePefChartPoints,
  type PefChartDatum,
} from "./normalize-pef-chart-points";
import type { PefChartPoint } from "../types/pef-chart-point";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  ".."
);

function source(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function point(recordedAt: string, pefValue: number): PefChartPoint {
  return { recordedAt, pefValue };
}

function periodRecord(
  recordedAt: string,
  pefValue: number
): DashboardPeriodRecord {
  return {
    recordedAt,
    pefValue,
    coughSeverity: 0,
    wheezingSeverity: 0,
    shortnessOfBreathSeverity: 0,
    chestTightnessSeverity: 0,
    hadAttack: false,
    usedRescueMedication: false,
  };
}

function datum(
  recordedAt: string,
  pefValue: number,
  chartKey: string
): PefChartDatum {
  return {
    recordedAt,
    pefValue,
    chartKey,
    recordedTimestamp: Date.parse(recordedAt),
  };
}

function readyPoints(data: readonly PefChartPoint[]): readonly PefChartDatum[] {
  const presentation = normalizePefChartPoints(data);

  if (presentation.status !== "ready") {
    throw new Error(`Série esperada pronta, recebida: ${presentation.status}`);
  }

  return presentation.points;
}

function clinicalSeries(data: readonly PefChartPoint[]) {
  return readyPoints(data).map((item) => ({
    recordedAt: item.recordedAt,
    pefValue: item.pefValue,
    recordedTimestamp: item.recordedTimestamp,
  }));
}

describe("normalizePefChartPoints", () => {
  describe("coleção vazia", () => {
    test("devolve série vazia sem ponto sintético", () => {
      const input: PefChartPoint[] = [];

      expect(normalizePefChartPoints(input)).toEqual({ status: "empty" });
      expect(input).toEqual([]);
      expect(getPefChartSummary([])).toBeNull();
    });
  });

  describe("um registro", () => {
    test("preserva o PEF 450 e o instante 23/09/2026 14:00 em Maceió", () => {
      const recordedAt = "2026-09-23T14:00:00-03:00";
      const presentation = normalizePefChartPoints([point(recordedAt, 450)]);

      expect(presentation).toEqual({
        status: "ready",
        points: [datum(recordedAt, 450, "pef-0")],
      });

      const [chartPoint] = readyPoints([point(recordedAt, 450)]);

      expect(chartPoint?.pefValue).toBe(450);
      expect(typeof chartPoint?.pefValue).toBe("number");
      expect(formatPefChartDateTimeFromIso(recordedAt)).toEqual({
        date: "23 de setembro de 2026",
        time: "14:00",
      });
      expect(formatPefChartTickDate(Date.parse(recordedAt), false)).toBe(
        "23/09"
      );
      expect(getPefChartSummary(readyPoints([point(recordedAt, 450)]))).toBe(
        "Gráfico com uma medição de PEF em 23 de setembro de 2026, às 14:00: 450 litros por minuto."
      );
    });
  });

  describe("transformação", () => {
    test("preserva 100, 232, 450 e 700 sem agregar nem inventar dias", () => {
      const recordedAt = [
        "2026-09-23T18:00:00-03:00",
        "2026-09-21T09:00:00-03:00",
        "2026-09-22T14:00:00-03:00",
        "2026-09-24T11:00:00-03:00",
      ] as const;
      const input = [
        point(recordedAt[0], 700),
        point(recordedAt[1], 100),
        point(recordedAt[2], 232),
        point(recordedAt[3], 450),
      ];

      expect(normalizePefChartPoints(input)).toEqual({
        status: "ready",
        points: [
          datum(recordedAt[1], 100, "pef-1"),
          datum(recordedAt[2], 232, "pef-2"),
          datum(recordedAt[0], 700, "pef-0"),
          datum(recordedAt[3], 450, "pef-3"),
        ],
      });
    });
  });

  describe("ordenação cronológica", () => {
    test("ordena do mais antigo ao mais novo, não pela magnitude do PEF", () => {
      const oldest = "2026-09-21T09:00:00-03:00";
      const middle = "2026-09-22T14:00:00-03:00";
      const newest = "2026-09-23T18:00:00-03:00";
      const input = [
        point(newest, 700),
        point(oldest, 100),
        point(middle, 450),
      ];

      expect(readyPoints(input).map((item) => item.pefValue)).toEqual([
        100, 450, 700,
      ]);
      expect(readyPoints(input).map((item) => item.recordedAt)).toEqual([
        oldest,
        middle,
        newest,
      ]);
    });

    test("compara o instante e não a ordem lexical do texto ISO", () => {
      const earlierInstant = "2026-09-23T16:00:00.000Z";
      const laterInstant = "2026-09-23T14:00:00-03:00";

      expect(laterInstant < earlierInstant).toBe(true);
      expect(
        readyPoints([point(laterInstant, 700), point(earlierInstant, 100)]).map(
          (item) => item.recordedAt
        )
      ).toEqual([earlierInstant, laterInstant]);
    });
  });

  describe("medições no mesmo dia", () => {
    test("mantém 08:00, 12:00 e 20:00 como pontos distintos", () => {
      const morning = "2026-09-23T08:00:00-03:00";
      const noon = "2026-09-23T12:00:00-03:00";
      const evening = "2026-09-23T20:00:00-03:00";
      const input = [
        point(evening, 390),
        point(morning, 400),
        point(noon, 430),
      ];
      const points = readyPoints(input);

      expect(points).toEqual([
        datum(morning, 400, "pef-1"),
        datum(noon, 430, "pef-2"),
        datum(evening, 390, "pef-0"),
      ]);
      expect(
        points.map((item) =>
          formatPefChartTickDate(item.recordedTimestamp, false)
        )
      ).toEqual(["23/09", "23/09", "23/09"]);
      expect(
        points.map((item) => getPefChartMeasurementListItem(item))
      ).toEqual([
        "23 de setembro de 2026, 08:00: PEF 400 litros por minuto.",
        "23 de setembro de 2026, 12:00: PEF 430 litros por minuto.",
        "23 de setembro de 2026, 20:00: PEF 390 litros por minuto.",
      ]);
      expect(new Set(points.map((item) => item.chartKey)).size).toBe(3);
    });
  });

  describe("timestamps duplicados", () => {
    test("preserva os dois PEF e desempata pela ordem de entrada", () => {
      const recordedAt = "2026-09-23T14:00:00-03:00";
      const input = [point(recordedAt, 100), point(recordedAt, 700)];
      const points = readyPoints(input);

      expect(points).toEqual([
        datum(recordedAt, 100, "pef-0"),
        datum(recordedAt, 700, "pef-1"),
      ]);
      expect(points[0]?.chartKey).not.toBe(points[1]?.chartKey);
    });
  });

  describe("valores de PEF", () => {
    test("mantém o mínimo válido 1 e um inteiro positivo grande", () => {
      const earlier = "2026-09-21T09:00:00-03:00";
      const later = "2026-09-23T18:00:00-03:00";

      expect(readyPoints([point(later, 1_000_000), point(earlier, 1)])).toEqual(
        [datum(earlier, 1, "pef-1"), datum(later, 1_000_000, "pef-0")]
      );
    });
  });

  describe("valores inválidos", () => {
    test.each([
      ["zero", 0],
      ["negativo", -5],
      ["não inteiro", 450.5],
      ["NaN", Number.NaN],
      ["infinito", Number.POSITIVE_INFINITY],
    ])("PEF %s não vira ponto nem zero", (_label, pefValue) => {
      expect(
        normalizePefChartPoints([point("2026-09-23T14:00:00-03:00", pefValue)])
      ).toEqual({
        status: "unavailable",
      });
    });

    test("PEF textual não é convertido para número", () => {
      expect(
        normalizePefChartPoints([
          {
            recordedAt: "2026-09-23T14:00:00-03:00",
            pefValue: "450" as unknown as number,
          },
        ])
      ).toEqual({ status: "unavailable" });
    });

    test("data inválida não vira o instante atual nem um ponto", () => {
      expect(normalizePefChartPoints([point("not-a-date", 450)])).toEqual({
        status: "unavailable",
      });
      expect(normalizePefChartPoints([point("", 450)])).toEqual({
        status: "unavailable",
      });
    });

    test("omite o item malformado e conserva as medições válidas", () => {
      const validEarlier = "2026-09-21T09:00:00-03:00";
      const validLater = "2026-09-23T18:00:00-03:00";
      const input = [
        point(validLater, 450),
        point("not-a-date", 100),
        point(validEarlier, 0),
        point("2026-09-22T14:00:00-03:00", Number.NaN),
        point(validEarlier, 232),
      ];

      expect(normalizePefChartPoints(input)).toEqual({
        status: "ready",
        points: [
          datum(validEarlier, 232, "pef-4"),
          datum(validLater, 450, "pef-0"),
        ],
      });
    });
  });

  describe("fuso horário", () => {
    test("atravessa a meia-noite local sem deslocar o dia UTC", () => {
      const beforeMidnight = "2026-09-23T02:59:00.000Z";
      const midnight = "2026-09-23T03:00:00.000Z";
      const afterMidnight = "2026-09-23T03:01:00.000Z";
      const points = readyPoints([
        point(afterMidnight, 430),
        point(beforeMidnight, 400),
        point(midnight, 410),
      ]);

      expect(points.map((item) => item.recordedAt)).toEqual([
        beforeMidnight,
        midnight,
        afterMidnight,
      ]);
      expect(
        points.map((item) => formatPefChartDateTimeFromIso(item.recordedAt))
      ).toEqual([
        { date: "22 de setembro de 2026", time: "23:59" },
        { date: "23 de setembro de 2026", time: "00:00" },
        { date: "23 de setembro de 2026", time: "00:01" },
      ]);
      expect(
        points.map((item) =>
          formatPefChartTickDate(item.recordedTimestamp, false)
        )
      ).toEqual(["22/09", "23/09", "23/09"]);
    });

    test("dois instantes no mesmo minuto visível continuam separados", () => {
      const midnight = "2026-09-23T03:00:00.000Z";
      const thirtySecondsLater = "2026-09-23T03:00:30.000Z";
      const points = readyPoints([
        point(thirtySecondsLater, 420),
        point(midnight, 410),
      ]);

      expect(
        points.map(
          (item) => formatPefChartDateTimeFromIso(item.recordedAt)?.time
        )
      ).toEqual(["00:00", "00:00"]);
      expect(points.map((item) => item.recordedTimestamp)).toEqual([
        Date.parse(midnight),
        Date.parse(thirtySecondsLater),
      ]);
      expect(points[0]?.recordedTimestamp).not.toBe(
        points[1]?.recordedTimestamp
      );
    });

    test("ordena a virada do mês pelo instante local", () => {
      const september = "2026-09-30T23:30:00-03:00";
      const october = "2026-10-01T00:30:00-03:00";
      const points = readyPoints([point(october, 450), point(september, 400)]);

      expect(points.map((item) => item.recordedAt)).toEqual([
        september,
        october,
      ]);
      expect(
        points.map((item) =>
          formatPefChartTickDate(item.recordedTimestamp, false)
        )
      ).toEqual(["30/09", "01/10"]);
      expect(
        doesPefChartRangeCrossYears(
          points.map((item) => item.recordedTimestamp)
        )
      ).toBe(false);
    });

    test("ordena a virada do ano e inclui o ano no rótulo", () => {
      const december = "2025-12-31T23:30:00-03:00";
      const january = "2026-01-01T00:30:00-03:00";
      const points = readyPoints([point(january, 450), point(december, 400)]);
      const timestamps = points.map((item) => item.recordedTimestamp);

      expect(points.map((item) => item.recordedAt)).toEqual([
        december,
        january,
      ]);
      expect(doesPefChartRangeCrossYears(timestamps)).toBe(true);
      expect(
        timestamps.map((timestamp) => formatPefChartTickDate(timestamp, true))
      ).toEqual(["31/12/2025", "01/01/2026"]);
      expect(formatPefChartDateTimeFromIso(december)).toEqual({
        date: "31 de dezembro de 2025",
        time: "23:30",
      });
      expect(formatPefChartDateTimeFromIso(january)).toEqual({
        date: "1 de janeiro de 2026",
        time: "00:30",
      });
    });
  });

  describe("rótulos e tooltip", () => {
    test("data inválida não formata Invalid Date", () => {
      expect(formatPefChartDateTimeFromIso("not-a-date")).toBeNull();
      expect(formatPefChartDateTimeFromIso("")).toBeNull();
      expect(formatPefChartTickDate(Number.NaN, false)).toBe("");
      expect(formatPefChartTickDate("2026-09-23", true)).toBe("");
    });
  });

  describe("resumo textual", () => {
    test("resume a contagem e os extremos da série cronológica", () => {
      const points = readyPoints([
        point("2026-09-23T18:00:00-03:00", 390),
        point("2026-09-21T09:00:00-03:00", 400),
        point("2026-09-22T14:00:00-03:00", 430),
      ]);

      expect(getPefChartSummary(points)).toBe(
        "Gráfico com 3 medições de PEF. Primeira medição em 21 de setembro de 2026: 400 litros por minuto. Última medição em 23 de setembro de 2026: 390 litros por minuto."
      );
      expect(getPefChartMeasurementListItem(points[1]!)).toBe(
        "22 de setembro de 2026, 14:00: PEF 430 litros por minuto."
      );
    });

    test("não resume uma data ilegível", () => {
      const invalidPoint: PefChartDatum = {
        recordedAt: "not-a-date",
        pefValue: 450,
        chartKey: "pef-0",
        recordedTimestamp: Number.NaN,
      };

      expect(getPefChartSummary([invalidPoint])).toBeNull();
      expect(getPefChartMeasurementListItem(invalidPoint)).toBeNull();
    });
  });

  describe("imutabilidade", () => {
    test("não altera o array nem os objetos recebidos", () => {
      const input = [
        point("2026-09-23T18:00:00-03:00", 100),
        point("2026-09-21T09:00:00-03:00", 700),
      ];
      const snapshot = structuredClone(input);

      Object.freeze(input[0]);
      Object.freeze(input[1]);
      Object.freeze(input);

      expect(normalizePefChartPoints(input)).toEqual({
        status: "ready",
        points: [
          datum("2026-09-21T09:00:00-03:00", 700, "pef-1"),
          datum("2026-09-23T18:00:00-03:00", 100, "pef-0"),
        ],
      });
      expect(input).toEqual(snapshot);
      expect(Object.keys(input[0]!).sort()).toEqual(["pefValue", "recordedAt"]);
    });
  });

  describe("chaves estáveis", () => {
    test("não copia identificadores extras para o ponto plotado", () => {
      const input = [
        {
          recordedAt: "2026-09-23T14:00:00-03:00",
          pefValue: 450,
          id: "record-fixture",
          notes: "nota ficticia",
        },
      ] as unknown as PefChartPoint[];

      const [chartPoint] = readyPoints(input);

      expect(chartPoint).toEqual(
        datum("2026-09-23T14:00:00-03:00", 450, "pef-0")
      );
      expect(JSON.stringify(chartPoint)).not.toContain("record-fixture");
      expect(JSON.stringify(chartPoint)).not.toContain("nota ficticia");
      expect(input[0]).toMatchObject({
        id: "record-fixture",
        notes: "nota ficticia",
      });
    });
  });

  describe("período", () => {
    test("não filtra 7, 30 ou 90 dias; a janela fica antes do mapeamento", () => {
      const range = getHistoryPeriodRange(
        7,
        new Date("2026-09-23T15:00:00-03:00")
      );

      expect(range).toEqual({
        rangeStart: "2026-09-17T03:00:00.000Z",
        rangeEnd: "2026-09-24T03:00:00.000Z",
      });

      const beforeStart = periodRecord("2026-09-17T02:59:59.000Z", 232);
      const exactStart = periodRecord("2026-09-17T03:00:00.000Z", 100);
      const inside = periodRecord("2026-09-23T14:00:00-03:00", 450);
      const exactEnd = periodRecord("2026-09-24T03:00:00.000Z", 700);
      const received = [exactEnd, inside, beforeStart, exactStart];
      const rangeStartMs = Date.parse(range.rangeStart);
      const rangeEndMs = Date.parse(range.rangeEnd);
      const selected = received.filter((record) => {
        const recordedAtMs = Date.parse(record.recordedAt);

        return recordedAtMs >= rangeStartMs && recordedAtMs < rangeEndMs;
      });

      expect(buildDashboardPeriodMetrics(received).pefChartPoints).toEqual([
        { recordedAt: exactEnd.recordedAt, pefValue: 700 },
        { recordedAt: inside.recordedAt, pefValue: 450 },
        { recordedAt: beforeStart.recordedAt, pefValue: 232 },
        { recordedAt: exactStart.recordedAt, pefValue: 100 },
      ]);
      expect(buildDashboardPeriodMetrics(selected).pefChartPoints).toEqual([
        { recordedAt: inside.recordedAt, pefValue: 450 },
        { recordedAt: exactStart.recordedAt, pefValue: 100 },
      ]);
      expect(
        normalizePefChartPoints(
          buildDashboardPeriodMetrics(selected).pefChartPoints
        )
      ).toEqual({
        status: "ready",
        points: [
          datum(exactStart.recordedAt, 100, "pef-1"),
          datum(inside.recordedAt, 450, "pef-0"),
        ],
      });
    });
  });

  describe("paciente, equipe médica e relatório", () => {
    test("plota a mesma série para o dashboard e para o relatório", () => {
      const newest = periodRecord("2026-09-23T18:00:00-03:00", 700);
      const oldest = periodRecord("2026-09-21T09:00:00-03:00", 100);
      const middle = periodRecord("2026-09-22T14:00:00-03:00", 450);
      const received = [newest, oldest, middle];
      const snapshot = structuredClone(received);
      const dashboardPoints =
        buildDashboardPeriodMetrics(received).pefChartPoints;
      const reportPoints = mapReportRecordsToPefChartPoints(received);
      const medicalReportPoints =
        buildMedicalPatientReportSummaries(received).chartPoints;

      const chronological = [
        { recordedAt: oldest.recordedAt, pefValue: 100 },
        { recordedAt: middle.recordedAt, pefValue: 450 },
        { recordedAt: newest.recordedAt, pefValue: 700 },
      ];

      expect(received).toEqual(snapshot);
      expect(dashboardPoints).toEqual([
        { recordedAt: newest.recordedAt, pefValue: 700 },
        { recordedAt: oldest.recordedAt, pefValue: 100 },
        { recordedAt: middle.recordedAt, pefValue: 450 },
      ]);
      expect(reportPoints).toEqual(chronological);
      expect(medicalReportPoints).toEqual(reportPoints);
      expect(clinicalSeries(dashboardPoints)).toEqual(
        chronological.map((item) => ({
          ...item,
          recordedTimestamp: Date.parse(item.recordedAt),
        }))
      );
      expect(clinicalSeries(reportPoints)).toEqual(
        clinicalSeries(dashboardPoints)
      );

      const orderedRecords = [oldest, middle, newest];
      const orderedDashboardPoints =
        buildDashboardPeriodMetrics(orderedRecords).pefChartPoints;
      const orderedReportPoints =
        mapReportRecordsToPefChartPoints(orderedRecords);

      expect(orderedDashboardPoints).toEqual(chronological);
      expect(orderedReportPoints).toEqual(chronological);
      expect(normalizePefChartPoints(orderedDashboardPoints)).toEqual(
        normalizePefChartPoints(orderedReportPoints)
      );
    });

    test("createdAt presente no objeto não muda a cronologia clínica", () => {
      const input = [
        {
          recordedAt: "2026-09-23T18:00:00-03:00",
          pefValue: 100,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          recordedAt: "2026-09-21T09:00:00-03:00",
          pefValue: 700,
          createdAt: "2026-09-30T00:00:00.000Z",
        },
      ] as unknown as PefChartPoint[];

      expect(readyPoints(input).map((item) => item.pefValue)).toEqual([
        700, 100,
      ]);
      expect(JSON.stringify(readyPoints(input))).not.toContain("createdAt");
      expect(JSON.stringify(readyPoints(input))).not.toContain("2026-01-01");
    });
  });

  describe("autoridade de recorded_at", () => {
    test("consultas do gráfico ordenam recorded_at e desempatam por id", () => {
      const patientLoader = source(
        "src/features/dashboard/lib/load-patient-dashboard-data.ts"
      );
      const patientReport = source(
        "src/features/reports/server/get-patient-report-data.ts"
      );
      const medicalPeriodQuery = source(
        "supabase/migrations/20260908190000_add_medical_authorized_patient_dashboard.sql"
      );
      const chartSources = [
        source("src/features/daily-records/lib/normalize-pef-chart-points.ts"),
        source(
          "src/features/reports/lib/map-report-records-to-pef-chart-points.ts"
        ),
        source("src/features/daily-records/types/pef-chart-point.ts"),
        source("src/features/dashboard/lib/build-dashboard-period-metrics.ts"),
      ];

      expect(patientLoader).toContain(
        '.order("recorded_at", { ascending: true })'
      );
      expect(patientLoader).toContain('.order("id", { ascending: true })');
      expect(patientReport).toContain(
        '.order("recorded_at", { ascending: true })'
      );
      expect(patientReport).toContain('.order("id", { ascending: true })');
      expect(medicalPeriodQuery).toContain(
        "order by dr.recorded_at asc, dr.id asc"
      );

      for (const chartSource of chartSources) {
        expect(chartSource).not.toContain("created_at");
        expect(chartSource).not.toContain("updated_at");
        expect(chartSource).not.toContain("Date.now");
        expect(chartSource).not.toContain("Math.random");
        expect(chartSource).not.toContain("randomUUID");
      }
    });
  });
});
