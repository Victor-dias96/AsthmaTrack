import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MedicalPatientDashboardHeader } from "@/features/medical-team/components/medical-patient-dashboard-header";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

describe("visual feedback", () => {
  test("warning, information and success alerts include text and an icon", () => {
    const { rerender } = render(
      <AppAlert variant="warning">Falha na conexão. Verifique sua internet.</AppAlert>
    );

    const warning = screen.getByRole("alert");
    expect(warning).toHaveTextContent("Falha na conexão. Verifique sua internet.");
    expect(warning.querySelector("svg")).not.toBeNull();

    rerender(<AppAlert variant="info">Este acesso será somente para consulta.</AppAlert>);
    const information = screen.getByRole("alert");
    expect(information).toHaveTextContent("Este acesso será somente para consulta.");
    expect(information.querySelector("svg")).not.toBeNull();
    expect(information).not.toHaveTextContent("Falha na conexão");

    rerender(<AppAlert variant="success">Registro salvo.</AppAlert>);
    const success = screen.getByRole("alert");
    expect(success).toHaveTextContent("Registro salvo.");
    expect(success.querySelector("svg")).not.toBeNull();
    expect(success).not.toHaveTextContent("Falha na conexão");
  });

  test("a field error shows the message and an icon", () => {
    render(
      <FormField label="E-mail" htmlFor="email" error="Informe seu e-mail">
        <input id="email" />
      </FormField>
    );

    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Informe seu e-mail");
    expect(error.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("E-mail")).toBeVisible();
  });

  test("a disabled button keeps its name and stays disabled", () => {
    render(
      <AppButton type="button" disabled>
        Salvar registro
      </AppButton>
    );

    const button = screen.getByRole("button", { name: "Salvar registro" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName("Salvar registro");
  });

  test("a loading control keeps its accessible name", () => {
    render(<LoadingSpinner label="Entrando" />);

    expect(screen.getByRole("status", { name: "Entrando" })).toBeVisible();
  });

  test("the medical read-only notice uses visible wording", () => {
    render(
      <MedicalPatientDashboardHeader patientId="exemplo" patientName={null} />
    );

    expect(screen.getByText("Somente leitura")).toBeVisible();
    expect(
      screen.getByText("Visualização em modo somente leitura dos registros autorizados.")
    ).toBeVisible();
  });
});
