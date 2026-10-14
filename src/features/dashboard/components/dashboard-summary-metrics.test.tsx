import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DashboardSummaryMetrics } from "./dashboard-summary-metrics";

function cardItem(name: string) {
  const heading = screen.getByRole("heading", { name });
  const item = heading.closest("li");

  if (!(item instanceof HTMLElement)) {
    throw new Error(`Card ausente: ${name}`);
  }

  return item;
}

function card(name: string) {
  return within(cardItem(name));
}

describe("DashboardSummaryMetrics", () => {
  test("mostra rótulos e valores conhecidos", () => {
    render(
      <DashboardSummaryMetrics
        latestPef={350}
        latestRecordDate="2026-09-23T18:00:00.000Z"
        totalRecords={4}
        daysWithSymptoms={2}
        recordedAttacks={1}
        rescueMedicationUsage={3}
      />
    );

    expect(screen.getByRole("heading", { name: "Resumo" })).toBeVisible();
    expect(card("Último PEF").getByText("350")).toBeVisible();
    expect(
      card("Último PEF").getByText("litros por minuto")
    ).toBeInTheDocument();
    expect(
      card("Data do último registro").getByText("23/09/2026")
    ).toBeVisible();
    expect(card("Data do último registro").getByText("15:00")).toBeVisible();
    expect(
      screen.getByRole("group", { name: "4 registros no período selecionado." })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "2 dias com sintomas no período selecionado.",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "1 crise registrada no período selecionado.",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "3 registros com uso de medicação de alívio no período selecionado.",
      })
    ).toBeVisible();
  });

  test("ausência de último PEF não aparece como 0 L/min", () => {
    render(
      <DashboardSummaryMetrics
        latestPef={null}
        latestRecordDate={null}
        totalRecords={0}
        daysWithSymptoms={0}
        recordedAttacks={0}
        rescueMedicationUsage={0}
      />
    );

    expect(card("Último PEF").getByText("Sem dados")).toBeVisible();
    expect(cardItem("Último PEF").textContent).not.toContain("L/min");
    expect(cardItem("Último PEF").textContent).not.toContain("0");
    expect(
      card("Data do último registro").getByText("Sem registros")
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "Nenhum registro no período selecionado.",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "Nenhum dia com sintomas no período selecionado.",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "Nenhuma crise registrada no período selecionado.",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "Nenhum uso registrado no período selecionado.",
      })
    ).toBeVisible();
  });

  test("PEF zero exibível vira indisponível, não 0 L/min", () => {
    render(
      <DashboardSummaryMetrics
        latestPef={0}
        latestRecordDate={null}
        totalRecords={1}
        daysWithSymptoms={0}
        recordedAttacks={0}
        rescueMedicationUsage={0}
      />
    );

    expect(card("Último PEF").getByText("Indisponível")).toBeVisible();
    expect(cardItem("Último PEF").textContent).not.toContain("L/min");
    expect(cardItem("Último PEF").textContent).not.toContain("0");
    expect(
      screen.getByRole("group", { name: "1 registro no período selecionado." })
    ).toBeVisible();
  });

  test("total nulo permanece sem dados e não vira zero", () => {
    render(
      <DashboardSummaryMetrics
        latestPef={null}
        latestRecordDate={null}
        totalRecords={null}
        daysWithSymptoms={null}
        recordedAttacks={null}
        rescueMedicationUsage={null}
      />
    );

    expect(card("Total de registros").getByText("Sem dados")).toBeVisible();
    expect(
      screen.queryByRole("group", {
        name: "Nenhum registro no período selecionado.",
      })
    ).not.toBeInTheDocument();
  });
});
