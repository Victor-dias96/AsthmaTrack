import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { AppAlert } from "@/components/ui/app-alert";
import { FieldError } from "@/components/ui/form-field";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { AuthorizedPatientItem } from "@/features/medical-team/components/authorized-patient-item";
import { ReportHeader } from "@/features/reports/components/report-header";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const LONG_NAME =
  "Nome ficticio extremamente longo para verificar que o texto continua inteiro e pode quebrar em telas estreitas";

describe("responsive content", () => {
  test("keeps a long alert message complete", () => {
    const message =
      "Mensagem de validação fictícia que precisa permanecer inteira e quebrar em várias linhas sem ser cortada no aviso.";

    render(<AppAlert>{message}</AppAlert>);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  test("keeps a long field error complete", () => {
    const message =
      "Informe um valor fictício válido. Esta mensagem de validação longa precisa permanecer associada ao campo e continuar legível.";

    render(<FieldError>{message}</FieldError>);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  test("keeps a long fictional greeting complete", () => {
    render(<DashboardHeader firstName={LONG_NAME} />);

    expect(
      screen.getByRole("heading", { level: 1, name: `Olá, ${LONG_NAME}!` })
    ).toBeVisible();
  });

  test("keeps a long fictional report name complete", () => {
    render(
      <ReportHeader
        patientName={LONG_NAME}
        period={30}
        displayStart={{ year: 2026, month: 1, day: 1 }}
        displayEnd={{ year: 2026, month: 1, day: 30 }}
        generatedAtIso="2026-01-30T12:00:00.000Z"
        generatedAtLabel="30/01/2026"
        showTitle={false}
      />
    );

    expect(screen.getByText(LONG_NAME)).toBeVisible();
    expect(screen.getByText(/Últimos 30 dias/)).toBeVisible();
  });

  test("keeps a long fictional patient card name complete", () => {
    render(
      <ul>
        <AuthorizedPatientItem
          patient={{
            authorizationId: "00000000-0000-4000-8000-000000000001",
            patientId: "00000000-0000-4000-8000-000000000002",
            patientName: LONG_NAME,
            authorizedAt: "2026-01-15T12:00:00.000Z",
            latestRecord: { kind: "empty" },
          }}
        />
      </ul>
    );

    expect(screen.getByText(LONG_NAME)).toBeVisible();
    expect(screen.getByText("Somente leitura")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver dashboard" })).toBeVisible();
  });
});
