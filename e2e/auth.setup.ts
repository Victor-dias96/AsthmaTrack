import { expect, test as setup, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const authDir = path.join(process.cwd(), "playwright", ".auth");

setup.setTimeout(120_000);

export const patientAAuthFile = path.join(authDir, "patient-a.json");
export const patientBAuthFile = path.join(authDir, "patient-b.json");

function requireEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required E2E variable: ${name}`);
  }

  return value;
}

function requireEmail(name: string): string {
  const value = requireEnv(name);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(
      `${name} is not a valid email address. Correct .env.e2e.local. The value was not printed.`
    );
  }

  return value;
}

function trackPageSafety(page: Page) {
  const pageErrors: string[] = [];
  let usedNonLoopbackSupabase = false;
  let sawLoopbackAuth = false;

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("request", (request) => {
    let url: URL;

    try {
      url = new URL(request.url());
    } catch {
      return;
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const loopback =
      hostname === "127.0.0.1" ||
      hostname === "localhost" ||
      hostname === "::1";
    const supabaseApi =
      url.pathname.startsWith("/auth/v1") ||
      url.pathname.startsWith("/rest/v1");

    if (!supabaseApi) {
      return;
    }

    if (loopback && url.pathname.startsWith("/auth/v1")) {
      sawLoopbackAuth = true;
      return;
    }

    if (!loopback) {
      usedNonLoopbackSupabase = true;
    }
  });

  return {
    pageErrors,
    sawLoopbackAuth: () => sawLoopbackAuth,
    usedNonLoopbackSupabase: () => usedNonLoopbackSupabase,
  };
}

async function authenticate(
  page: Page,
  emailVariable: string,
  passwordVariable: string,
  storagePath: string
) {
  const email = requireEmail(emailVariable);
  const password = requireEnv(passwordVariable);
  const safety = trackPageSafety(page);

  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/paciente\/dashboard$/, { timeout: 45_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: /^Olá/ })
  ).toBeVisible();

  await page.context().storageState({ path: storagePath });

  expect(safety.pageErrors, safety.pageErrors.join("\n")).toEqual([]);
  expect(safety.usedNonLoopbackSupabase()).toBe(false);
  expect(safety.sawLoopbackAuth()).toBe(true);
}

setup("authenticate patient A", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });
  await authenticate(
    page,
    "E2E_PATIENT_A_EMAIL",
    "E2E_PATIENT_A_PASSWORD",
    patientAAuthFile
  );
});

setup("authenticate patient B", async ({ page }) => {
  mkdirSync(authDir, { recursive: true });
  await authenticate(
    page,
    "E2E_PATIENT_B_EMAIL",
    "E2E_PATIENT_B_PASSWORD",
    patientBAuthFile
  );
});
