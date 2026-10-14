import { describe, expect, test } from "vitest";

import { DASHBOARD_DEFAULT_PERIOD } from "../constants";
import { parseDashboardPeriod } from "./parse-dashboard-period";

describe("parseDashboardPeriod", () => {
  test("aceita somente 7, 30 e 90", () => {
    expect(parseDashboardPeriod("7")).toBe(7);
    expect(parseDashboardPeriod("30")).toBe(30);
    expect(parseDashboardPeriod("90")).toBe(90);
  });

  test("ausência usa o período padrão de 7 dias", () => {
    expect(parseDashboardPeriod(undefined)).toBe(DASHBOARD_DEFAULT_PERIOD);
    expect(DASHBOARD_DEFAULT_PERIOD).toBe(7);
  });

  test.each([
    ["string vazia", ""],
    ["espaço antes", " 30"],
    ["espaço depois", "30 "],
    ["decimal", "30.5"],
    ["sufixo", "30abc"],
    ["zero à esquerda", "07"],
    ["negativo", "-7"],
    ["valor grande", "999999"],
    ["texto", "trinta"],
    ["período fora da lista", "14"],
  ])("%s cai no padrão 7", (_label, value) => {
    expect(parseDashboardPeriod(value)).toBe(7);
  });

  test("array repetido não escolhe o primeiro valor", () => {
    expect(parseDashboardPeriod(["30", "90"])).toBe(7);
    expect(parseDashboardPeriod(["7"])).toBe(7);
  });
});
