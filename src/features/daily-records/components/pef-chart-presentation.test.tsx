import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DashboardPefChart } from "@/features/dashboard/components/dashboard-pef-chart";
import { MedicalPatientDashboardPefChart } from "@/features/medical-team/components/medical-patient-dashboard-pef-chart";
import { ReportPefChart } from "@/features/reports/components/report-pef-chart";

import {
  PefChartTooltip,
  type PefChartTooltipProps,
} from "./pef-chart-tooltip";

const EMPTY_DASHBOARD_MESSAGE =
  "Registre medições para acompanhar a evolução do PEF.";
const DASHBOARD_UNAVAILABLE_MESSAGE =
  "Não foi possível exibir as medições de PEF.";
const REPORT_EMPTY_MESSAGE =
  "Não foi possível exibir as medições de PEF deste período.";

function tooltipPayload(
  recordedAt: string,
  pefValue: number
): PefChartTooltipProps["payload"] {
  return [
    {
      payload: {
        recordedAt,
        pefValue,
        id: "record-fixture",
        patientId: "patient-fixture",
        notes: "nota ficticia",
      },
    },
  ] as unknown as PefChartTooltipProps["payload"];
}

describe("apresentação do gráfico de PEF", () => {
  test("série vazia do dashboard não desenha eixo nem ponto zero", () => {
    const { container } = render(<DashboardPefChart data={[]} />);

    expect(
      screen.getByRole("heading", { name: "Evolução do PEF" })
    ).toBeVisible();
    expect(
      screen.getByText("Valores em litros por minuto (L/min).")
    ).toBeVisible();
    expect(screen.getByText(EMPTY_DASHBOARD_MESSAGE)).toBeVisible();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("Infinity");
    expect(container.textContent).not.toContain("Invalid Date");
    expect(container.textContent).not.toContain("0 L/min");
  });

  test("dashboard médico vazio usa a mesma mensagem", () => {
    render(<MedicalPatientDashboardPefChart data={[]} />);

    expect(screen.getByText(EMPTY_DASHBOARD_MESSAGE)).toBeVisible();
    expect(
      screen.getByText("Valores em litros por minuto (L/min).")
    ).toBeVisible();
  });

  test("pontos inválidos mostram a mensagem de indisponibilidade", () => {
    const { container } = render(
      <DashboardPefChart data={[{ recordedAt: "not-a-date", pefValue: 0 }]} />
    );

    expect(screen.getByText(DASHBOARD_UNAVAILABLE_MESSAGE)).toBeVisible();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("Invalid Date");
    expect(container.textContent).not.toContain("0 L/min");
  });

  test("relatório sem pontos usa o texto vazio do relatório", () => {
    const { container } = render(<ReportPefChart data={[]} />);

    expect(
      screen.getByRole("heading", { name: "Gráfico de PEF indisponível" })
    ).toBeVisible();
    expect(screen.getByText(REPORT_EMPTY_MESSAGE)).toBeVisible();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("Invalid Date");
  });

  test("tooltip mostra data, hora e PEF sem identificadores", () => {
    const { container } = render(
      <PefChartTooltip
        active
        payload={tooltipPayload("2026-09-23T14:00:00-03:00", 450)}
      />
    );

    expect(screen.getByText("23 de setembro de 2026, 14:00")).toBeVisible();
    expect(screen.getByText("PEF: 450 L/min")).toBeVisible();
    expect(container.textContent).not.toContain("record-fixture");
    expect(container.textContent).not.toContain("patient-fixture");
    expect(container.textContent).not.toContain("nota ficticia");
  });

  test("tooltip distingue duas medições do mesmo dia", () => {
    const { rerender } = render(
      <PefChartTooltip
        active
        payload={tooltipPayload("2026-09-23T08:00:00-03:00", 400)}
      />
    );

    expect(screen.getByText("23 de setembro de 2026, 08:00")).toBeVisible();
    expect(screen.getByText("PEF: 400 L/min")).toBeVisible();

    rerender(
      <PefChartTooltip
        active
        payload={tooltipPayload("2026-09-23T20:00:00-03:00", 390)}
      />
    );

    expect(screen.getByText("23 de setembro de 2026, 20:00")).toBeVisible();
    expect(screen.getByText("PEF: 390 L/min")).toBeVisible();
  });

  test("tooltip inativo ou com PEF zero não renderiza valor", () => {
    const { container, rerender } = render(
      <PefChartTooltip
        active={false}
        payload={tooltipPayload("2026-09-23T14:00:00-03:00", 450)}
      />
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <PefChartTooltip
        active
        payload={tooltipPayload("2026-09-23T14:00:00-03:00", 0)}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
