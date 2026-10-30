import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
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
    throw new Error("Login validation must not create a Supabase client.");
  },
}));

describe("LoginForm", () => {
  test("uses post so a native submit cannot place credentials in the URL", () => {
    render(<LoginForm />);

    const form = document.querySelector("form");

    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("method", "post");
    expect(form?.getAttribute("action")).toBeNull();
  });

  test("operates the password visibility control from the keyboard", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const password = screen.getByLabelText(/^Senha/);
    const showPassword = screen.getByRole("button", { name: "Mostrar senha" });

    expect(showPassword).not.toHaveAttribute("tabindex", "-1");
    expect(showPassword).toHaveAttribute("type", "button");

    password.focus();
    await user.tab();

    expect(showPassword).toHaveFocus();
    await user.keyboard(" ");

    const hidePassword = screen.getByRole("button", { name: "Ocultar senha" });
    expect(hidePassword).toHaveFocus();
    expect(hidePassword).toHaveAttribute("aria-pressed", "true");
    expect(password).toHaveAttribute("type", "text");

    await user.keyboard("{Enter}");

    expect(password).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("shows validation after Enter and keeps later controls reachable", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const submit = screen.getByRole("button", { name: "Entrar" });
    submit.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("Informe seu e-mail")).toBeVisible();
    expect(screen.getByText("Informe sua senha")).toBeVisible();

    await user.tab();

    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveFocus();
  });
});
