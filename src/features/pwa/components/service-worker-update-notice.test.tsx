import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { ServiceWorkerUpdateNotice } from "@/features/pwa/components/service-worker-update-notice";

const { applyUpdate, dismissUpdate, noticeState } = vi.hoisted(() => ({
  applyUpdate: vi.fn(async () => {}),
  dismissUpdate: vi.fn(),
  noticeState: { errorMessage: null as string | null },
}));

vi.mock("../hooks/use-service-worker-update", () => ({
  useServiceWorkerUpdate: () => ({
    updateAvailable: true,
    isActivating: false,
    errorMessage: noticeState.errorMessage,
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

  test("keeps a long update-failure message intact", () => {
    noticeState.errorMessage =
      "Não foi possível concluir a atualização fictícia deste aplicativo neste momento. Tente novamente mais tarde, quando a conexão estiver estável.";

    render(<ServiceWorkerUpdateNotice />);

    expect(screen.getByRole("status")).toHaveTextContent(noticeState.errorMessage);
    expect(screen.getByRole("button", { name: "Atualizar agora" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Depois" })).toBeVisible();
    noticeState.errorMessage = null;
  });
});
