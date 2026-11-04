import { describe, expect, test } from "vitest";

import { registrationConfirmationRedirect } from "./registration-redirect";

describe("registrationConfirmationRedirect", () => {
  test("mantém a confirmação no loopback local", () => {
    expect(registrationConfirmationRedirect("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000/login"
    );
    expect(registrationConfirmationRedirect("http://localhost:3000")).toBe(
      "http://localhost:3000/login"
    );
  });

  test("mantém a confirmação na origem HTTPS do preview", () => {
    expect(
      registrationConfirmationRedirect(
        "https://asthmatrack-git-feature-team.vercel.app"
      )
    ).toBe("https://asthmatrack-git-feature-team.vercel.app/login");
  });

  test("mantém a confirmação numa origem HTTPS de produção fictícia", () => {
    expect(
      registrationConfirmationRedirect("https://review.asthmatrack.example")
    ).toBe("https://review.asthmatrack.example/login");
  });

  test("rejeita HTTP hospedado, curingas e origens com caminho", () => {
    expect(
      registrationConfirmationRedirect("http://review.asthmatrack.example")
    ).toBeNull();
    expect(registrationConfirmationRedirect("https://*.vercel.app")).toBeNull();
    expect(
      registrationConfirmationRedirect(
        "https://user:pass@review.asthmatrack.example"
      )
    ).toBeNull();
    expect(
      registrationConfirmationRedirect(
        "https://review.asthmatrack.example/login"
      )
    ).toBeNull();
    expect(registrationConfirmationRedirect("")).toBeNull();
    expect(registrationConfirmationRedirect("javascript:alert(1)")).toBeNull();
  });
});
