import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { ServiceWorkerUpdateNotice } from "@/features/pwa/components/service-worker-update-notice";

const { applyUpdate, dismissUpdate } = vi.hoisted(() => ({
  applyUpdate: vi.fn(async () => {}),
  dismissUpdate: vi.fn(),
}));

vi.mock("../hooks/use-service-worker-update", () => ({
  useServiceWorkerUpdate: () => ({
    updateAvailable: true,
    isActivating: false,
    errorMessage: null,
    applyUpdate,
    dismissUpdate,
  }),
}));

vi.mock("../hooks/use-connection-status", () => ({
  useConnectionNoticeKind: () => "none",
}));

describe("ServiceWorkerUpdateNotice", () => {
  test("does not move focus and activates both actions from the keyboard", async () => {
    const user = userEvent.setup();
    applyUpdate.mockClear();
    dismissUpdate.mockClear();

    render(<ServiceWorkerUpdateNotice />);

    expect(document.activeElement).toBe(document.body);
    expect(screen.getByRole("status")).toBeVisible();

    const later = screen.getByRole("button", { name: "Depois" });
    const update = screen.getByRole("button", { name: "Atualizar agora" });

    later.focus();
    await user.keyboard("{Enter}");

    expect(dismissUpdate).toHaveBeenCalledOnce();
    expect(applyUpdate).not.toHaveBeenCalled();

    update.focus();
    await user.keyboard(" ");

    expect(applyUpdate).toHaveBeenCalledOnce();
  });
});
