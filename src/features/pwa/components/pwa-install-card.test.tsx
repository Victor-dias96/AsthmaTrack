import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { PwaInstallCard } from "@/features/pwa/components/pwa-install-card";

const { install } = vi.hoisted(() => ({
  install: vi.fn(async () => ({ status: "dismissed" as const })),
}));

vi.mock("./pwa-installation-provider", () => ({
  usePwaInstallationContext: () => ({
    canInstall: true,
    isInstalled: false,
    isInstalling: false,
    installCompleted: false,
    install,
  }),
}));

describe("PwaInstallCard", () => {
  test("keeps the install action keyboard reachable without moving focus on render", async () => {
    const user = userEvent.setup();
    install.mockClear();

    render(<PwaInstallCard />);

    expect(document.activeElement).toBe(document.body);

    const button = screen.getByRole("button", { name: "Instalar AsthmaTrack" });
    expect(button).toBeEnabled();

    button.focus();
    await user.keyboard("{Enter}");

    expect(install).toHaveBeenCalledOnce();
  });
});
