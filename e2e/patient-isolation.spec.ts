import { expect, test, type Locator, type Page } from "@playwright/test";

const PATIENT_A_STATE = "playwright/.auth/patient-a.json";
const PATIENT_B_STATE = "playwright/.auth/patient-b.json";

const RECORD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PatientLabel = "Patient A" | "Patient B";

type PatientFixture = {
  label: PatientLabel;
  pef: string;
  recordId: string;
  otherLabel: PatientLabel;
  otherPef: string;
  otherRecordId: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required E2E variable: ${name}`);
  }

  return value.trim();
}

function requirePef(name: string): string {
  const value = requireEnv(name);

  if (!/^[1-9]\d{0,2}$/.test(value)) {
    throw new Error(
      `${name} must be a whole number from 1 to 999 so the browser assertion can match the established PEF presentation.`
    );
  }

  return value;
}

function requireRecordId(name: string): string {
  const value = requireEnv(name);

  if (!RECORD_ID_PATTERN.test(value)) {
    throw new Error(
      `${name} is not a UUID. Refusing to build a patient route.`
    );
  }

  return value;
}

function loadPatientFixtures(): {
  patientA: PatientFixture;
  patientB: PatientFixture;
} {
  const patientAPef = requirePef("E2E_PATIENT_A_PEF");
  const patientBPef = requirePef("E2E_PATIENT_B_PEF");
  const patientARecordId = requireRecordId("E2E_PATIENT_A_RECORD_ID");
  const patientBRecordId = requireRecordId("E2E_PATIENT_B_RECORD_ID");

  if (patientAPef === patientBPef) {
    throw new Error(
      "E2E_PATIENT_A_PEF and E2E_PATIENT_B_PEF must be different."
    );
  }

  if (patientARecordId === patientBRecordId) {
    throw new Error(
      "E2E_PATIENT_A_RECORD_ID and E2E_PATIENT_B_RECORD_ID must be different."
    );
  }

  return {
    patientA: {
      label: "Patient A",
      pef: patientAPef,
      recordId: patientARecordId,
      otherLabel: "Patient B",
      otherPef: patientBPef,
      otherRecordId: patientBRecordId,
    },
    patientB: {
      label: "Patient B",
      pef: patientBPef,
      recordId: patientBRecordId,
      otherLabel: "Patient A",
      otherPef: patientAPef,
      otherRecordId: patientARecordId,
    },
  };
}

const patients = loadPatientFixtures();

function pefMeasurementPattern(pef: string): RegExp {
  return new RegExp(
    `(?<!\\d)${pef}(?!\\d)[\\s\\S]{0,80}?(?:L\\/min|litros por minuto)`
  );
}

function standalonePefPattern(pef: string): RegExp {
  return new RegExp(`(?<!\\d)${pef}(?!\\d)`);
}

function trackPageSafety(page: Page) {
  const pageErrors: string[] = [];
  const mutations: string[] = [];
  let usedNonLoopbackSupabase = false;

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
    const method = request.method();
    const supabaseApi =
      url.pathname.startsWith("/auth/v1") ||
      url.pathname.startsWith("/rest/v1");

    if (supabaseApi && !loopback) {
      usedNonLoopbackSupabase = true;
    }

    if (
      method !== "GET" &&
      method !== "HEAD" &&
      method !== "OPTIONS" &&
      url.pathname.includes("/rest/v1/daily_records")
    ) {
      mutations.push(method);
    }
  });

  return {
    finish() {
      expect(pageErrors, pageErrors.join("\n")).toEqual([]);
      expect(mutations).toEqual([]);
      expect(usedNonLoopbackSupabase).toBe(false);
    },
  };
}

async function readText(locator: Locator): Promise<string> {
  return locator.evaluate((element) => element.textContent ?? "");
}

async function expectMeasurementPresent(
  locator: Locator,
  pef: string,
  label: string
) {
  await expect(locator).toBeVisible();
  const text = await readText(locator);

  if (!pefMeasurementPattern(pef).test(text)) {
    throw new Error(
      `${label} does not show the expected PEF measurement. If the local record is outside the default period, correct that date manually. This test was not weakened.`
    );
  }
}

async function expectMeasurementAbsent(
  locator: Locator,
  pef: string,
  label: string
) {
  const text = await readText(locator);

  if (pefMeasurementPattern(pef).test(text)) {
    throw new Error(`${label} includes the other patient's PEF measurement.`);
  }
}

async function throwIfHeading(page: Page, name: string, message: string) {
  if (await page.getByRole("heading", { name, exact: true }).isVisible()) {
    throw new Error(message);
  }
}

function detailPath(recordId: string): string {
  return `/paciente/historico/${encodeURIComponent(recordId)}`;
}

function editPath(recordId: string): string {
  return `${detailPath(recordId)}/editar`;
}

async function expectDashboardIsolation(page: Page, patient: PatientFixture) {
  await page.goto("/paciente/dashboard");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Olá/ })
  ).toBeVisible();
  await throwIfHeading(
    page,
    "Não foi possível carregar o dashboard",
    `${patient.label} dashboard failed to load.`
  );
  await throwIfHeading(
    page,
    "Você ainda não possui registros",
    `Fixture problem: ${patient.label} has no dashboard records. Correct the local fixture manually. This test was not weakened.`
  );

  const latestPef = page
    .getByRole("region", { name: "Resumo" })
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "Último PEF" }),
    });
  const recentRecords = page.getByRole("region", {
    name: "Registros recentes",
  });
  const chart = page.getByRole("region", { name: "Evolução do PEF" });

  await expectMeasurementPresent(
    latestPef,
    patient.pef,
    `${patient.label} latest PEF card`
  );
  await expectMeasurementAbsent(
    latestPef,
    patient.otherPef,
    `${patient.label} latest PEF card`
  );
  await expectMeasurementPresent(
    recentRecords,
    patient.pef,
    `${patient.label} recent records`
  );
  await expectMeasurementAbsent(
    recentRecords,
    patient.otherPef,
    `${patient.label} recent records`
  );

  await expect(chart).toBeVisible();
  const chartText = await readText(chart);

  if (
    chartText.includes(
      "Registre medições para acompanhar a evolução do PEF."
    ) ||
    chartText.includes("Não foi possível exibir as medições de PEF.")
  ) {
    throw new Error(
      `Fixture problem: ${patient.label} has no PEF measurement in the default 7-day dashboard chart. Move that local record into the last 7 days manually. This test was not weakened.`
    );
  }

  const summary = chartText.match(/Gráfico com [\s\S]*?litros por minuto\./);

  if (summary === null) {
    throw new Error(
      `${patient.label} dashboard chart summary was not rendered.`
    );
  }

  if (!pefMeasurementPattern(patient.pef).test(summary[0])) {
    throw new Error(
      `${patient.label} dashboard chart summary does not include the expected PEF measurement.`
    );
  }

  if (pefMeasurementPattern(patient.otherPef).test(summary[0])) {
    throw new Error(
      `${patient.label} dashboard chart summary includes the other patient's PEF measurement.`
    );
  }
}

async function expectHistoryIsolation(page: Page, patient: PatientFixture) {
  await page.goto("/paciente/historico");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Histórico" })
  ).toBeVisible();
  await throwIfHeading(
    page,
    "Não foi possível carregar o histórico",
    `${patient.label} history failed to load.`
  );

  if (
    await page
      .getByRole("heading", { name: "Nenhum registro nos últimos 7 dias" })
      .isVisible()
  ) {
    throw new Error(
      `Fixture problem: ${patient.label} has no record in the default 7-day history period. Move that local record into the last 7 days manually. This test was not weakened.`
    );
  }

  const history = page.getByRole("main");
  await expectMeasurementPresent(
    history,
    patient.pef,
    `${patient.label} history`
  );
  await expectMeasurementAbsent(
    history,
    patient.otherPef,
    `${patient.label} history`
  );
}

async function expectReportIsolation(page: Page, patient: PatientFixture) {
  await page.goto("/paciente/relatorio");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Relatório" })
  ).toBeVisible();
  await throwIfHeading(
    page,
    "Não foi possível carregar o relatório",
    `${patient.label} report failed to load.`
  );

  if (
    await page
      .getByRole("heading", {
        name: "Nenhum registro no período selecionado",
      })
      .isVisible()
  ) {
    throw new Error(
      `Fixture problem: ${patient.label} has no record in the default 30-day report period. Move that local record into the last 30 days manually. This test was not weakened.`
    );
  }

  const summary = page.getByRole("region", {
    name: "Resumo do PEF",
    exact: true,
  });

  await expectMeasurementPresent(
    summary,
    patient.pef,
    `${patient.label} report PEF summary`
  );
  await expectMeasurementAbsent(
    summary,
    patient.otherPef,
    `${patient.label} report PEF summary`
  );
  await expectMeasurementAbsent(
    page.getByRole("main"),
    patient.otherPef,
    `${patient.label} report`
  );
}

async function expectForbiddenValueAbsent(
  page: Page,
  pef: string,
  label: string
) {
  const text = await readText(page.getByRole("main"));

  if (standalonePefPattern(pef).test(text)) {
    throw new Error(`${label} exposed the other patient's PEF.`);
  }

  const leakedInField = await page.locator("input, textarea").evaluateAll(
    (elements, forbiddenPef) =>
      elements.some((element) => {
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        ) {
          return element.value === forbiddenPef;
        }

        return false;
      }),
    pef
  );

  if (leakedInField) {
    throw new Error(
      `${label} rendered a form containing the other patient's PEF.`
    );
  }
}

async function expectInaccessibleDetail(page: Page, patient: PatientFixture) {
  await page.goto(detailPath(patient.otherRecordId));
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Registro não encontrado",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Data da medição" })
  ).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(0);
  await expectForbiddenValueAbsent(
    page,
    patient.otherPef,
    `${patient.label} detail route`
  );
}

async function expectInaccessibleEdit(page: Page, patient: PatientFixture) {
  await page.goto(editPath(patient.otherRecordId));
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Registro não encontrado",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Editar registro" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Salvar alterações" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Salvar registro" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("spinbutton", { name: /Pico de Fluxo Expiratório/ })
  ).toHaveCount(0);
  await expectForbiddenValueAbsent(
    page,
    patient.otherPef,
    `${patient.label} edit route`
  );
}

function registerIsolationSuite(patient: PatientFixture, storageState: string) {
  const tag = patient.label === "Patient A" ? "@patient-a" : "@patient-b";

  test.describe(`${patient.label} isolation`, { tag }, () => {
    test.use({ storageState });

    test("dashboard shows only this patient's PEF", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectDashboardIsolation(page, patient);
      safety.finish();
    });

    test("history shows only this patient's PEF", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectHistoryIsolation(page, patient);
      safety.finish();
    });

    test("other patient detail route is inaccessible", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectInaccessibleDetail(page, patient);
      safety.finish();
    });

    test("other patient edit route is inaccessible", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectInaccessibleEdit(page, patient);
      safety.finish();
    });

    test("report shows only this patient's PEF", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectReportIsolation(page, patient);
      safety.finish();
    });
  });
}

registerIsolationSuite(patients.patientA, PATIENT_A_STATE);
registerIsolationSuite(patients.patientB, PATIENT_B_STATE);

test.describe("patient A logout", { tag: "@patient-a" }, () => {
  test.use({ storageState: PATIENT_A_STATE });

  test("logout blocks fresh access and browser back", async ({ page }) => {
    const safety = trackPageSafety(page);

    await page.goto("/paciente/dashboard");
    await expect(
      page.getByRole("heading", { level: 1, name: /^Olá/ })
    ).toBeVisible();

    const logout = page.getByRole("button", { name: "Encerrar sessão" });
    await expect(logout).toHaveCount(1);
    await logout.click();

    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: "Entrar" })
    ).toBeVisible();

    await page.goto("/paciente/dashboard");
    await expect(page).toHaveURL(
      /\/login\?next=(?:%2F|\/)paciente(?:%2F|\/)dashboard$/
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Entrar" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Último PEF" })).toHaveCount(
      0
    );

    await page.goBack();

    const loginHeading = page.getByRole("heading", {
      level: 1,
      name: "Entrar",
    });
    const dashboardPef = page.getByRole("heading", { name: "Último PEF" });

    await expect(loginHeading.or(dashboardPef)).toBeVisible();
    await expect(dashboardPef).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: /^Olá/ })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Encerrar sessão" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("complementary", { name: "Menu lateral" })
    ).toHaveCount(0);
    await expect(page.getByText(/\b\d{2,4}\s*L\/min\b/)).toHaveCount(0);

    safety.finish();
  });
});
