import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppCheckbox } from "@/components/ui/app-checkbox";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

describe("screen reader semantics", () => {
  test("associates a hint and then replaces it with the field error", () => {
    const { rerender } = render(
      <FormField label="E-mail" htmlFor="email" hint="Use o e-mail da sua conta." required>
        <AppInput id="email" type="email" required />
      </FormField>
    );

    const email = screen.getByRole("textbox", { name: "E-mail" });
    expect(email).toHaveAttribute("aria-describedby", "email-hint");
    expect(email).toBeRequired();
    expect(email).not.toHaveAttribute("aria-invalid");

    rerender(
      <FormField
        label="E-mail"
        htmlFor="email"
        hint="Use o e-mail da sua conta."
        error="Informe seu e-mail"
        required
      >
        <AppInput id="email" type="email" hasError required />
      </FormField>
    );

    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "email-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu e-mail");
    expect(screen.queryByText("Use o e-mail da sua conta.")).toBeNull();
  });

  test("associates a checkbox label, required state and error", async () => {
    const user = userEvent.setup();

    render(
      <AppCheckbox
        id="terms"
        required
        error="Você precisa aceitar os termos de uso para continuar"
        label="Li e aceito os termos"
      />
    );

    const terms = screen.getByRole("checkbox", { name: "Li e aceito os termos" });
    expect(terms).toBeRequired();
    expect(terms).toHaveAttribute("aria-invalid", "true");
    expect(terms).toHaveAttribute("aria-describedby", "terms-error");

    await user.click(terms);
    expect(terms).toBeChecked();
  });

  test("names the password button from its state and hides the icon", async () => {
    const user = userEvent.setup();

    render(<AppInput id="secret" type="password" aria-label="Senha" />);

    const showPassword = screen.getByRole("button", { name: "Mostrar senha" });
    expect(showPassword).toHaveAttribute("aria-pressed", "false");
    expect(showPassword.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await user.click(showPassword);

    const hidePassword = screen.getByRole("button", { name: "Ocultar senha" });
    expect(hidePassword).toHaveAttribute("aria-pressed", "true");
    expect(hidePassword.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("distinguishes a repeated password button", () => {
    render(
      <AppInput
        id="confirm"
        type="password"
        aria-label="Confirmar senha"
        passwordToggleName="confirmação da senha"
      />
    );

    expect(
      screen.getByRole("button", { name: "Mostrar confirmação da senha" })
    ).toBeVisible();
  });

  test("uses alert for failures, status for success, and no live region for information", () => {
    const { rerender } = render(
      <AppAlert variant="warning">E-mail ou senha incorretos.</AppAlert>
    );

    const failure = screen.getByRole("alert");
    expect(failure).toHaveTextContent("E-mail ou senha incorretos.");
    expect(failure.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    rerender(<AppAlert variant="success">Registro salvo.</AppAlert>);
    const success = screen.getByRole("status");
    expect(success).toHaveTextContent("Registro salvo.");
    expect(success).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(<AppAlert variant="info">Este acesso será somente para consulta.</AppAlert>);
    expect(screen.getByText("Este acesso será somente para consulta.")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("keeps a busy button name when the spinner is decorative", () => {
    render(
      <AppButton type="button" disabled>
        <LoadingSpinner size="sm" label="Entrando" decorative />
        Entrando...
      </AppButton>
    );

    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("a standalone spinner exposes one status name", () => {
    render(<LoadingSpinner label="Verificando" />);

    expect(screen.getByRole("status", { name: "Verificando" })).toBeVisible();
  });
});
