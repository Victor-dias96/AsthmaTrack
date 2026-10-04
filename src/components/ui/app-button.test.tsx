import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { AppButton } from "@/components/ui/app-button";

describe("AppButton", () => {
  test("renders an enabled button with the given accessible name", () => {
    render(<AppButton type="button">Salvar rascunho</AppButton>);

    const button = screen.getByRole("button", { name: "Salvar rascunho" });

    expect(button).toBeInTheDocument();
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("type", "button");
  });

  test("runs its action once when the user clicks it", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();

    render(
      <AppButton type="button" onClick={onActivate}>
        Continuar
      </AppButton>
    );

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onActivate).toHaveBeenCalledOnce();
  });

  test("runs its action once when the user presses Enter", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();

    render(
      <AppButton type="button" onClick={onActivate}>
        Continuar
      </AppButton>
    );

    const button = screen.getByRole("button", { name: "Continuar" });
    button.focus();
    await user.keyboard("{Enter}");

    expect(onActivate).toHaveBeenCalledOnce();
  });

  test("does not run its action when disabled", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();

    render(
      <AppButton type="button" disabled onClick={onActivate}>
        Continuar
      </AppButton>
    );

    const button = screen.getByRole("button", { name: "Continuar" });

    expect(button).toBeDisabled();
    await user.click(button);

    expect(onActivate).not.toHaveBeenCalled();
  });
});
