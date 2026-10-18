import { expect, test, type Page } from "@playwright/test";

const PATIENT_LINKS = [
  "Novo registro",
  "Registrar",
  "Histórico",
  "Relatório",
  "Configurações",
  "Config.",
] as const;

const PROTECTED_NAVIGATION = [
  "Navegação do paciente",
  "Navegação da equipe médica",
  "Menu lateral",
] as const;

function trackPageErrors(page: Page) {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return pageErrors;
}

function expectNoPageErrors(pageErrors: string[]) {
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
}

async function expectPublicLogin(page: Page, url: RegExp) {
  await expect(page).toHaveURL(url);
  await expect(
    page.getByRole("heading", { level: 1, name: "Entrar" })
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "E-mail" })).toBeVisible();
}

async function expectNoProtectedChrome(page: Page) {
  for (const name of PROTECTED_NAVIGATION) {
    await expect(page.getByRole("navigation", { name })).toHaveCount(0);
  }

  for (const name of PATIENT_LINKS) {
    await expect(page.getByRole("link", { name })).toHaveCount(0);
  }

  await expect(page.getByRole("link", { name: "Pacientes" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ver pacientes" })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("heading", { name: "Área da equipe médica" })
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^Olá/ })).toHaveCount(0);
  await expect(page.getByText(/\b\d{2,4}\s*L\/min\b/)).toHaveCount(0);
}

test("offline page renders safely", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  const consoleWarnings: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "warning") {
      consoleWarnings.push(message.text().slice(0, 180));
    }
  });

  const response = await page.goto("/offline");

  expect(response).not.toBeNull();
  expect(response!.ok()).toBe(true);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAccessibleName("Sem conexão");
  await expect(
    page.getByRole("button", { name: "Tentar novamente" })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Não foi possível acessar o AsthmaTrack porque seu dispositivo está offline."
    )
  ).toBeVisible();
  await expectNoProtectedChrome(page);

  const serviceWorkerControlled = await page.evaluate(
    () => navigator.serviceWorker?.controller != null
  );

  test.info().annotations.push({
    type: "service-worker",
    description: serviceWorkerControlled
      ? "A service worker controlled /offline."
      : "No service worker controlled /offline.",
  });
  expect(serviceWorkerControlled).toBe(false);

  if (consoleWarnings.length > 0) {
    test.info().annotations.push({
      type: "console-warning",
      description: consoleWarnings.join(" | "),
    });
  }

  expectNoPageErrors(pageErrors);
});

test("retry returns to the safe root authentication flow", async ({ page }) => {
  const pageErrors = trackPageErrors(page);

  await page.goto("/offline");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expectPublicLogin(page, /\/login$/);
  await expectNoProtectedChrome(page);
  expectNoPageErrors(pageErrors);
});

test("protected patient route rejects unauthenticated access", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  const response = await page.goto("/paciente/dashboard");

  expect(response).not.toBeNull();
  expect(response!.request().redirectedFrom()?.url()).toMatch(
    /\/paciente\/dashboard$/
  );
  await expectPublicLogin(
    page,
    /\/login\?next=(?:%2F|\/)paciente(?:%2F|\/)dashboard$/
  );
  await expectNoProtectedChrome(page);
  expectNoPageErrors(pageErrors);
});

test("protected medical route rejects unauthenticated access", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  const response = await page.goto("/equipe-medica");

  expect(response).not.toBeNull();
  expect(response!.request().redirectedFrom()?.url()).toMatch(
    /\/equipe-medica$/
  );
  await expectPublicLogin(page, /\/login\?next=(?:%2F|\/)equipe-medica$/);
  await expectNoProtectedChrome(page);
  expectNoPageErrors(pageErrors);
});
