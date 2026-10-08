import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { RegisterForm } from "@/features/auth/components/register-form";

const { signUp, createSupabaseClient } = vi.hoisted(() => ({
  signUp: vi.fn(),
  createSupabaseClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
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
        signUp,
      },
    };
  },
}));

const FIXTURE_PASSWORD = "SenhaFicticia123!";

describe("RegisterForm", () => {
  beforeEach(() => {
    signUp.mockReset();
    createSupabaseClient.mockReset();
    signUp.mockResolvedValue({
      data: { session: null, user: { id: "usuario-ficticio" } },
      error: null,
    });
  });

  test("mostra as mensagens obrigatórias sem chamar o Supabase", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    try {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/^Nome completo/)).toBeVisible();
      expect(screen.getByLabelText(/^E-mail/)).toBeVisible();
      expect(screen.getByLabelText(/^Senha/)).toBeVisible();
      expect(screen.getByLabelText(/^Confirmar senha/)).toBeVisible();
      expect(
        screen.getByRole("checkbox", {
          name: "Li e aceito os Termos de Uso e a Política de Privacidade",
        })
      ).toBeVisible();

      const submit = screen.getByRole("button", { name: "Criar conta" });
      expect(submit).toBeEnabled();
      expect(submit).toHaveAttribute("type", "submit");

      await user.click(submit);

      expect(document.getElementById("register-name-error")).toHaveTextContent(
        "Informe seu nome completo"
      );
      expect(document.getElementById("register-email-error")).toHaveTextContent(
        "Informe seu e-mail"
      );
      expect(
        document.getElementById("register-password-error")
      ).toHaveTextContent("Crie uma senha");
      expect(
        document.getElementById("register-password-confirm-error")
      ).toHaveTextContent("Confirme sua senha");
      expect(
        screen.getByText("Você precisa aceitar os termos de uso para continuar")
      ).toBeVisible();

      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
      expect(createSupabaseClient).not.toHaveBeenCalled();
      expect(signUp).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("envia só nome, e-mail e senha normalizados para o cadastro simulado", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    try {
      render(<RegisterForm />);

      await user.type(
        screen.getByLabelText(/^Nome completo/),
        "  Paciente Teste  "
      );
      await user.type(
        screen.getByLabelText(/^E-mail/),
        "  paciente.teste@example.com  "
      );
      await user.type(screen.getByLabelText(/^Senha/), FIXTURE_PASSWORD);
      await user.type(
        screen.getByLabelText(/^Confirmar senha/),
        FIXTURE_PASSWORD
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: "Li e aceito os Termos de Uso e a Política de Privacidade",
        })
      );

      await user.click(screen.getByRole("button", { name: "Criar conta" }));

      expect(
        await screen.findByRole("heading", { name: "Verifique seu e-mail" })
      ).toBeVisible();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "paciente.teste@example.com"
      );
      expect(createSupabaseClient).toHaveBeenCalledOnce();
      expect(signUp).toHaveBeenCalledOnce();
      expect(signUp).toHaveBeenCalledWith({
        email: "paciente.teste@example.com",
        password: FIXTURE_PASSWORD,
        options: {
          data: {
            full_name: "Paciente Teste",
          },
        },
      });
      expect(signUp.mock.calls[0]?.[0].options.data).not.toHaveProperty("role");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
