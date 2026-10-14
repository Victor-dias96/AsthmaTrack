import { describe, expect, test } from "vitest";

import { HISTORY_TIME_ZONE } from "../constants";
import { getHistoryPeriodRange } from "./get-history-period-range";

const REFERENCE_INSTANT = new Date("2026-09-23T15:00:00-03:00");

describe("getHistoryPeriodRange", () => {
  test("usa America/Maceio", () => {
    expect(HISTORY_TIME_ZONE).toBe("America/Maceio");
  });

  test("7 dias vai da meia-noite local de 17/09 até a de 24/09", () => {
    expect(getHistoryPeriodRange(7, REFERENCE_INSTANT)).toEqual({
      rangeStart: "2026-09-17T03:00:00.000Z",
      rangeEnd: "2026-09-24T03:00:00.000Z",
    });
  });

  test("30 dias vai da meia-noite local de 25/08 até a de 24/09", () => {
    expect(getHistoryPeriodRange(30, REFERENCE_INSTANT)).toEqual({
      rangeStart: "2026-08-25T03:00:00.000Z",
      rangeEnd: "2026-09-24T03:00:00.000Z",
    });
  });

  test("90 dias vai da meia-noite local de 26/06 até a de 24/09", () => {
    expect(getHistoryPeriodRange(90, REFERENCE_INSTANT)).toEqual({
      rangeStart: "2026-06-26T03:00:00.000Z",
      rangeEnd: "2026-09-24T03:00:00.000Z",
    });
  });

  test("7 dias atravessa a virada de ano", () => {
    expect(
      getHistoryPeriodRange(7, new Date("2026-01-03T15:00:00-03:00"))
    ).toEqual({
      rangeStart: "2025-12-28T03:00:00.000Z",
      rangeEnd: "2026-01-04T03:00:00.000Z",
    });
  });

  test("30 dias em fevereiro bissexto começa em 01/02", () => {
    expect(
      getHistoryPeriodRange(30, new Date("2024-03-01T15:00:00-03:00"))
    ).toEqual({
      rangeStart: "2024-02-01T03:00:00.000Z",
      rangeEnd: "2024-03-02T03:00:00.000Z",
    });
  });

  test("30 dias em fevereiro comum começa em 31/01", () => {
    expect(
      getHistoryPeriodRange(30, new Date("2025-03-01T15:00:00-03:00"))
    ).toEqual({
      rangeStart: "2025-01-31T03:00:00.000Z",
      rangeEnd: "2025-03-02T03:00:00.000Z",
    });
  });

  test("um instante antes da meia-noite local ainda é o dia anterior", () => {
    expect(
      getHistoryPeriodRange(7, new Date("2026-09-23T02:59:59.000Z"))
    ).toEqual({
      rangeStart: "2026-09-16T03:00:00.000Z",
      rangeEnd: "2026-09-23T03:00:00.000Z",
    });
  });

  test("a meia-noite local abre o dia corrente", () => {
    expect(
      getHistoryPeriodRange(7, new Date("2026-09-23T03:00:00.000Z"))
    ).toEqual({
      rangeStart: "2026-09-17T03:00:00.000Z",
      rangeEnd: "2026-09-24T03:00:00.000Z",
    });
  });

  test("o instante de referência cai dentro da janela de 7 dias", () => {
    const range = getHistoryPeriodRange(7, REFERENCE_INSTANT);
    const recordedAt = REFERENCE_INSTANT.toISOString();

    expect(recordedAt >= range.rangeStart).toBe(true);
    expect(recordedAt < range.rangeEnd).toBe(true);
  });
});
