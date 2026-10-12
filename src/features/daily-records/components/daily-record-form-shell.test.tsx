import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PEF_FIELD_ID } from "@/features/daily-records/constants/field-ids";

import { DailyRecordFormShell } from "./daily-record-form-shell";

const { createSupabaseClient } = vi.hoisted(() => ({
  createSupabaseClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

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

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    createSupabaseClient();
    return {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };
  },
}));

async function renderForm() {
  const user = userEvent.setup();
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<DailyRecordFormShell />);

  await waitFor(() => {
    expect(screen.getByLabelText(/^Data e horário/)).toBeEnabled();
  });

  return { user, fetchSpy };
}

describe("DailyRecordFormShell", () => {
  beforeEach(() => {
    createSupabaseClient.mockReset();
  });

  test("mostra a mensagem de PEF obrigatório sem chamar o Supabase", async () => {
    const { user, fetchSpy } = await renderForm();

    try {
      expect(
        screen.getByLabelText(/^Pico de Fluxo Expiratório \(PEF\)/)
      ).toBeVisible();
      expect(screen.getByRole("radiogroup", { name: "Tosse" })).toBeVisible();
      expect(screen.getByRole("radiogroup", { name: "Chiado" })).toBeVisible();
      expect(
        screen.getByRole("radiogroup", { name: "Falta de ar" })
      ).toBeVisible();
      expect(
        screen.getByRole("radiogroup", { name: "Aperto no peito" })
      ).toBeVisible();
      expect(
        screen.getByRole("radiogroup", { name: "Teve uma crise de asma?" })
      ).toBeVisible();
      expect(
        screen.getByRole("radiogroup", { name: "Usou medicação de alívio?" })
      ).toBeVisible();
      expect(screen.getByLabelText(/^Observações/)).toBeVisible();

      const cough = screen.getByRole("radiogroup", { name: "Tosse" });
      expect(within(cough).getByRole("radio", { name: "Nenhuma" })).toBeChecked();

      const submit = screen.getByRole("button", { name: "Salvar registro" });
      expect(submit).toBeEnabled();
      expect(submit).toHaveAttribute("type", "submit");
      expect(submit.tabIndex).not.toBe(-1);
      submit.focus();
      expect(submit).toHaveFocus();

      await user.click(submit);

      const pef = screen.getByLabelText(/^Pico de Fluxo Expiratório \(PEF\)/);
      const pefError = document.getElementById(`${PEF_FIELD_ID}-error`);

      expect(pefError).toHaveTextContent("Informe o valor de PEF");
      expect(pefError).toHaveAttribute("role", "alert");
      expect(pef).toHaveAttribute("aria-invalid", "true");
      expect(pef).toHaveAttribute("aria-describedby", `${PEF_FIELD_ID}-error`);
      expect(screen.queryByText("Selecione uma intensidade válida")).toBeNull();
      expect(createSupabaseClient).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("bloqueia PEF zero e decimal sem persistir", async () => {
    const { user, fetchSpy } = await renderForm();

    try {
      const pef = screen.getByLabelText(/^Pico de Fluxo Expiratório \(PEF\)/);
      const submit = screen.getByRole("button", { name: "Salvar registro" });

      await user.type(pef, "0");
      await user.click(submit);

      expect(document.getElementById(`${PEF_FIELD_ID}-error`)).toHaveTextContent(
        "O PEF deve ser maior que zero"
      );
      expect(createSupabaseClient).not.toHaveBeenCalled();

      await user.clear(pef);
      await user.type(pef, "12.5");
      await user.click(submit);

      expect(document.getElementById(`${PEF_FIELD_ID}-error`)).toHaveTextContent(
        "O PEF deve ser um número inteiro"
      );
      expect(createSupabaseClient).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
