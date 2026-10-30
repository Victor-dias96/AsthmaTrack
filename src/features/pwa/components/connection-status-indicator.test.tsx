import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ConnectionStatusIndicator } from "@/features/pwa/components/connection-status-indicator";

vi.mock("next/navigation", () => ({
  usePathname: () => "/login",
}));

describe("ConnectionStatusIndicator", () => {
  test("does not take focus when the connection notice is status only", async () => {
    render(<ConnectionStatusIndicator />);

    expect(document.activeElement).toBe(document.body);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Você está offline")).not.toBeInTheDocument();
  });
});
