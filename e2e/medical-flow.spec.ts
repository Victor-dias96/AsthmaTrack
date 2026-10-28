import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const MEDICAL_A_STATE = "playwright/.auth/medical-a.json";
const MEDICAL_B_STATE = "playwright/.auth/medical-b.json";
const PATIENT_A_STATE = "playwright/.auth/patient-a.json";
const PATIENT_B_STATE = "playwright/.auth/patient-b.json";

const PATIENT_LIST_PATH = "/equipe-medica/pacientes";
const ACCESS_MANAGEMENT_PATH = "/paciente/configuracoes/acessos";

const MEDICAL_A_NAME = "Profissional Ficticio Alfa";
const MEDICAL_B_NAME = "Profissional Ficticio Beta";
const PATIENT_A_NAME = "pacienteA";
const PATIENT_B_NAME = "pacienteB";

const RECORD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATIENT_ID_PATTERN = RECORD_ID_PATTERN;

const WRITE_CONTROL_NAMES = [
  "Novo registro",
  "Registrar",
  "Registrar medição",
  "Editar",
  "Editar registro",
  "Excluir",
  "Excluir registro",
  "Salvar alterações",
  "Salvar registro",
  "Alterar PEF",
  "Adicionar observação",
  "Registrar crise",
  "Alterar medicação",
  "Revogar acesso",
  "Reativar acesso",
  "Imprimir relatório",
  "Baixar PDF",
  "Compartilhar relatório",
  "Compartilhar agora",
] as const;

type MedicalLabel = "Medical A" | "Medical B";

type MedicalFixture = {
  label: MedicalLabel;
  tag: "@medical-a" | "@medical-b";
  storageState: string;
  patientName: string;
  patientId: string;
  patientPef: string;
  recordId: string;
  otherPatientName: string;
  otherPatientId: string;
  otherPatientPef: string;
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

function requireUuid(name: string, pattern: RegExp): string {
  const value = requireEnv(name);

  if (!pattern.test(value)) {
    throw new Error(`${name} is not a UUID. Refusing to build a route.`);
  }

  return value;
}

function requireProfessionalCode(name: string): string {
  const value = requireEnv(name);

  if (!/^[A-Z2-9]{8}$/.test(value)) {
    throw new Error(
      `${name} is not an 8-character professional code. The value was not printed.`
    );
  }

  return value;
}

function loadMedicalFixtures(): {
  medicalA: MedicalFixture;
  medicalB: MedicalFixture;
} {
  const patientAPef = requirePef("E2E_PATIENT_A_PEF");
  const patientBPef = requirePef("E2E_PATIENT_B_PEF");
  const patientAId = requireUuid("E2E_PATIENT_A_ID", PATIENT_ID_PATTERN);
  const patientBId = requireUuid("E2E_PATIENT_B_ID", PATIENT_ID_PATTERN);
  const patientARecordId = requireUuid(
    "E2E_PATIENT_A_RECORD_ID",
    RECORD_ID_PATTERN
  );
  const patientBRecordId = requireUuid(
    "E2E_PATIENT_B_RECORD_ID",
    RECORD_ID_PATTERN
  );

  if (patientAPef === patientBPef) {
    throw new Error(
      "E2E_PATIENT_A_PEF and E2E_PATIENT_B_PEF must be different."
    );
  }

  if (patientAId === patientBId || patientARecordId === patientBRecordId) {
    throw new Error("Patient fixtures must use distinct ids.");
  }

  return {
    medicalA: {
      label: "Medical A",
      tag: "@medical-a",
      storageState: MEDICAL_A_STATE,
      patientName: PATIENT_A_NAME,
      patientId: patientAId,
      patientPef: patientAPef,
      recordId: patientARecordId,
      otherPatientName: PATIENT_B_NAME,
      otherPatientId: patientBId,
      otherPatientPef: patientBPef,
    },
    medicalB: {
      label: "Medical B",
      tag: "@medical-b",
      storageState: MEDICAL_B_STATE,
      patientName: PATIENT_B_NAME,
      patientId: patientBId,
      patientPef: patientBPef,
      recordId: patientBRecordId,
      otherPatientName: PATIENT_A_NAME,
      otherPatientId: patientAId,
      otherPatientPef: patientAPef,
    },
  };
}

const medicalAccounts = loadMedicalFixtures();

test.beforeEach(({}, testInfo) => {
  testInfo.setTimeout(120_000);
});

function pefMeasurementPattern(pef: string): RegExp {
  return new RegExp(
    `(?<!\\d)${pef}(?!\\d)[\\s\\S]{0,80}?(?:L\\/min|litros por minuto)`
  );
}

function standalonePefPattern(pef: string): RegExp {
  return new RegExp(`(?<!\\d)${pef}(?!\\d)`);
}

function redactUnsafeText(value: string): string {
  return value
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "[uuid]"
    )
    .replace(/\b[A-Z2-9]{8}\b/g, "[code]");
}

function trackPageSafety(page: Page) {
  const pageErrors: string[] = [];
  const dailyRecordMutations: string[] = [];
  let usedNonLoopbackSupabase = false;

  page.on("pageerror", (error) => {
    pageErrors.push(redactUnsafeText(error.message));
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
      dailyRecordMutations.push(method);
    }
  });

  return {
    finish() {
      expect(pageErrors, pageErrors.join("\n")).toEqual([]);
      expect(dailyRecordMutations).toEqual([]);
      expect(usedNonLoopbackSupabase).toBe(false);
    },
  };
}

function dashboardPath(patientId: string): string {
  return `/equipe-medica/pacientes/${encodeURIComponent(patientId)}`;
}

function historyPath(patientId: string): string {
  return `${dashboardPath(patientId)}/historico`;
}

function reportPath(patientId: string): string {
  return `${dashboardPath(patientId)}/relatorio`;
}

function editPath(recordId: string): string {
  return `/paciente/historico/${encodeURIComponent(recordId)}/editar`;
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

async function expectPefAbsent(locator: Locator, pef: string, label: string) {
  const text = await readText(locator);

  if (
    pefMeasurementPattern(pef).test(text) ||
    standalonePefPattern(pef).test(text)
  ) {
    throw new Error(`${label} includes the other patient's PEF.`);
  }
}

async function throwIfHeading(page: Page, name: string, message: string) {
  if (await page.getByRole("heading", { name, exact: true }).isVisible()) {
    throw new Error(message);
  }
}

async function expectNoWriteControls(page: Page) {
  for (const name of WRITE_CONTROL_NAMES) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0
    );
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  }

  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(
    page.locator("[contenteditable='true'], [contenteditable='']")
  ).toHaveCount(0);

  const forms = page.locator("form");
  const formCount = await forms.count();

  for (let index = 0; index < formCount; index += 1) {
    const method = (await forms.nth(index).getAttribute("method")) ?? "get";
    expect(method.toLowerCase()).not.toBe("post");
  }
}

async function expectOnlySearchInput(page: Page) {
  await expect(
    page.getByRole("searchbox", { name: "Buscar paciente" })
  ).toHaveCount(1);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
}

async function expectNoHealthInputs(page: Page) {
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
}

async function expectNameVisible(page: Page, name: string) {
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
}

async function expectReadOnlyList(page: Page) {
  await expect(page.getByText("Somente leitura", { exact: true })).toBeVisible();
  await expectOnlySearchInput(page);
  await expectNoWriteControls(page);
}

async function expectReadOnlyClinicalPage(page: Page) {
  await expect(page.getByText("Somente leitura", { exact: true })).toBeVisible();
  await expectNoHealthInputs(page);
  await expectNoWriteControls(page);
}

function assertAuthenticatedMedical(page: Page, label: string) {
  if (/\/login(?:\?|$)/.test(page.url())) {
    throw new Error(
      `${label} was unauthenticated. Refresh the local medical storage state and rerun its setup project.`
    );
  }
}

async function openPatientList(page: Page, actor: MedicalFixture) {
  const heading = page.getByRole("heading", { level: 1, name: "Pacientes" });
  await page.goto(PATIENT_LIST_PATH, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  assertAuthenticatedMedical(page, actor.label);

  try {
    await expect(heading).toBeVisible({ timeout: 45_000 });
  } catch {
    await page.goto(PATIENT_LIST_PATH, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(heading).toBeVisible({ timeout: 45_000 });
  }
  await expect(page).toHaveURL(/\/equipe-medica\/pacientes$/);
  await throwIfHeading(
    page,
    "Não foi possível carregar os pacientes",
    `${actor.label} patient list failed to load.`
  );
}

async function searchPatients(page: Page, term: string) {
  await page.getByRole("searchbox", { name: "Buscar paciente" }).fill(term);
  await page.getByRole("button", { name: "Buscar", exact: true }).click({
    noWaitAfter: true,
  });
  await expect(page).toHaveURL(/\/equipe-medica\/pacientes\?q=/, {
    timeout: 30_000,
  });
}

async function expectInaccessiblePatient(
  page: Page,
  actor: MedicalFixture,
  path: string
) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  assertAuthenticatedMedical(page, actor.label);
  await expect(
    page.getByRole("heading", { level: 1, name: "Paciente não encontrado" })
  ).toBeVisible();
  await expect(
    page.getByText("Não foi possível acessar este paciente.")
  ).toBeVisible();
  await expect(
    page.getByText(actor.otherPatientName, { exact: true })
  ).toHaveCount(0);
  await expectPefAbsent(
    page.getByRole("main"),
    actor.otherPatientPef,
    `${actor.label} unauthorized route`
  );
  await expect(
    page.getByRole("heading", { name: "Último PEF" })
  ).toHaveCount(0);
  await expectNoWriteControls(page);
}

async function expectPatientWriteRouteBlocked(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/equipe-medica\/?$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Área da equipe médica" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Novo registro" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Editar registro" })
  ).toHaveCount(0);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Salvar registro" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Salvar alterações" })
  ).toHaveCount(0);
}

async function contextWithStorage(
  browser: Browser,
  testInfo: TestInfo,
  storageState: string
) {
  return browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: testInfo.project.use.viewport ?? { width: 1280, height: 720 },
    userAgent: testInfo.project.use.userAgent,
    storageState,
  });
}

async function openFreshMedicalPage(
  context: BrowserContext,
  guards: Array<{ finish: () => void }>
): Promise<Page> {
  const page = await context.newPage();
  guards.push(trackPageSafety(page));
  return page;
}

function activeAccessRegion(page: Page): Locator {
  return page.getByRole("region", { name: "Acessos ativos" });
}

async function openAccessManagement(page: Page) {
  await page.goto(ACCESS_MANAGEMENT_PATH);
  if (/\/login(?:\?|$)/.test(page.url())) {
    throw new Error(
      "Patient A was unauthenticated on the access-management page. Refresh the local patient storage state and rerun its setup project."
    );
  }
  await expect(
    page.getByRole("heading", { level: 1, name: "Acesso da equipe médica" })
  ).toBeVisible();
  await expect(activeAccessRegion(page)).toBeVisible();
}

async function clearProfessionalCode(page: Page) {
  const field = page.getByRole("textbox", { name: "Código do profissional" });

  if (await field.isVisible().catch(() => false)) {
    await field.fill("");
  }
}

async function waitForAccessForm(page: Page) {
  await page.waitForFunction(() => {
    const form = document.querySelector("form");

    if (!form) {
      return false;
    }

    return Object.keys(form).some(
      (key) =>
        key.startsWith("__reactProps$") || key.startsWith("__reactFiber$")
    );
  });
}

async function classifyProfessionalLookup(page: Page): Promise<string> {
  const known = [
    ["found", "Profissional encontrado"],
    [
      "not-found",
      "Não foi possível localizar um profissional válido com os dados informados.",
    ],
    [
      "connection",
      "Não foi possível localizar o profissional. Verifique sua conexão e tente novamente.",
    ],
    [
      "unexpected",
      "Ocorreu um erro ao localizar o profissional. Tente novamente.",
    ],
    ["invalid", "Código inválido. Verifique e tente novamente."],
    ["empty", "Informe o código do profissional"],
    ["self", "Não é possível autorizar a própria conta."],
    ["expired", "Sua sessão expirou. Entre novamente para continuar."],
    [
      "session-check",
      "Não foi possível confirmar sua sessão. Verifique sua conexão e tente novamente.",
    ],
  ] as const;

  for (const [label, text] of known) {
    if (await page.getByText(text).isVisible().catch(() => false)) {
      return label;
    }
  }

  if (/\/login(?:\?|$)/.test(page.url())) {
    return "login";
  }

  if (page.url().includes("professionalCode=")) {
    return "native-submit";
  }

  return "unknown";
}

async function authorizeProfessional(
  page: Page,
  professionalName: string,
  codeVariable: string
) {
  await openAccessManagement(page);
  const active = activeAccessRegion(page);

  if ((await active.getByText(professionalName, { exact: true }).count()) > 0) {
    return;
  }

  const code = requireProfessionalCode(codeVariable);
  await waitForAccessForm(page);
  const field = page.getByRole("textbox", { name: "Código do profissional" });
  await field.fill(code);

  try {
    await expect(field).toHaveValue(/^[A-Z2-9]{8}$/);
  } catch {
    await clearProfessionalCode(page);
    throw new Error(
      "The professional code field did not keep the entered value. The value was not printed."
    );
  }

  await page.getByRole("button", { name: "Buscar profissional" }).click();

  try {
    await expect(page.getByText("Profissional encontrado")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(`Nome: ${professionalName}`, { exact: true })
    ).toBeVisible({
      timeout: 15_000,
    });
  } catch {
    const outcome = await classifyProfessionalLookup(page);
    await clearProfessionalCode(page);

    if (page.url().includes("professionalCode=")) {
      await page.goto(ACCESS_MANAGEMENT_PATH);
    }

    throw new Error(
      `Professional lookup did not show ${professionalName}. Outcome: ${outcome}. The code was not printed.`
    );
  }

  await page.getByRole("button", { name: "Autorizar acesso" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  const heading = dialog.getByRole("heading").first();
  await expect(heading).toBeVisible();
  const headingText = (await heading.innerText()).trim();

  if (headingText === "Acesso já concedido") {
    await dialog.getByRole("button", { name: "Fechar" }).click();
  } else if (headingText === "Autorizar este profissional?") {
    await dialog.getByRole("button", { name: "Autorizar acesso" }).click();
    await expect(page.getByText("Acesso autorizado com sucesso.")).toBeVisible();
  } else {
    throw new Error(
      "Authorization dialog was ambiguous. No authorization row was inserted by this step."
    );
  }

  await expect(active.getByText(professionalName, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

async function revokeProfessional(page: Page, professionalName: string) {
  await openAccessManagement(page);
  const item = page.getByRole("listitem").filter({
    has: page.getByText(professionalName, { exact: true }),
  });
  await expect(item).toHaveCount(1);
  await item.getByRole("button", { name: "Revogar acesso" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "Revogar acesso?" })
  ).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Revogar acesso" });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  // Success is a server-rendered notice after router.replace(?revogado=1).
  // The first refresh of this route can outlast the default expect timeout
  // while the confirm button stays disabled and the old list is still shown.
  await expect(page).toHaveURL(
    /\/paciente\/configuracoes\/acessos\?revogado=1(?:&|$)/,
    { timeout: 45_000 }
  );
  await expect(page.getByText("Acesso revogado com sucesso.")).toBeVisible({
    timeout: 45_000,
  });
  await expect(
    activeAccessRegion(page).getByText(professionalName, { exact: true })
  ).toHaveCount(0, { timeout: 45_000 });
}

async function expectAuthorizedPatientVisible(
  page: Page,
  actor: MedicalFixture
) {
  await openPatientList(page, actor);
  await expectNameVisible(page, actor.patientName);
  await expect(
    page.getByText(actor.otherPatientName, { exact: true })
  ).toHaveCount(0);
  const card = page.getByRole("listitem").filter({
    has: page.getByText(actor.patientName, { exact: true }),
  });
  await expectMeasurementPresent(
    card,
    actor.patientPef,
    `${actor.label} patient card`
  );
  await expectPefAbsent(card, actor.otherPatientPef, `${actor.label} patient card`);
}

function registerStableSuite(actor: MedicalFixture) {
  test.describe(`${actor.label} read-only access`, { tag: actor.tag }, () => {
    test.use({ storageState: actor.storageState });

    test("patient list shows only the authorized patient", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectAuthorizedPatientVisible(page, actor);
      await expectReadOnlyList(page);
      safety.finish();
    });

    test("search stays inside the authorized patients", async ({ page }) => {
      const safety = trackPageSafety(page);
      await openPatientList(page, actor);
      await searchPatients(page, actor.patientName);
      await expectNameVisible(page, actor.patientName);
      await expect(
        page.getByText(actor.otherPatientName, { exact: true })
      ).toHaveCount(0);
      await page.getByRole("link", { name: "Limpar busca" }).click();
      await expect(page).toHaveURL(/\/equipe-medica\/pacientes$/);
      await expectNameVisible(page, actor.patientName);

      await searchPatients(page, actor.otherPatientName);
      await expect(
        page.getByRole("heading", { name: "Nenhum paciente encontrado" })
      ).toBeVisible();
      await expect(
        page.getByText("Não encontramos pacientes autorizados com esse nome.")
      ).toBeVisible();
      await expect(
        page.getByText(actor.otherPatientName, { exact: true })
      ).toHaveCount(0);
      await expect(
        page.getByText(actor.patientName, { exact: true })
      ).toHaveCount(0);
      await expectPefAbsent(
        page.getByRole("main"),
        actor.otherPatientPef,
        `${actor.label} search`
      );
      await expect(
        page.getByText("O paciente autorizou o acesso em modo somente leitura.")
      ).toBeVisible();
      await expectOnlySearchInput(page);
      await expectNoWriteControls(page);
      safety.finish();
    });

    test("authorized dashboard is read-only", async ({ page }) => {
      const safety = trackPageSafety(page);
      await page.goto(dashboardPath(actor.patientId));
      assertAuthenticatedMedical(page, actor.label);
      await expect(
        page.getByRole("heading", { level: 1, name: "Dashboard do paciente" })
      ).toBeVisible();
      await throwIfHeading(
        page,
        "Não foi possível carregar o dashboard",
        `${actor.label} dashboard failed to load.`
      );
      await expectNameVisible(page, actor.patientName);
      await expect(
        page.getByText(actor.otherPatientName, { exact: true })
      ).toHaveCount(0);

      const latestPef = page
        .getByRole("region", { name: "Resumo" })
        .getByRole("listitem")
        .filter({
          has: page.getByRole("heading", { name: "Último PEF" }),
        });
      await expectMeasurementPresent(
        latestPef,
        actor.patientPef,
        `${actor.label} dashboard`
      );
      await expectPefAbsent(
        page.getByRole("main"),
        actor.otherPatientPef,
        `${actor.label} dashboard`
      );
      await expectReadOnlyClinicalPage(page);
      safety.finish();
    });

    test("authorized history is read-only", async ({ page }) => {
      const safety = trackPageSafety(page);
      await page.goto(historyPath(actor.patientId));
      assertAuthenticatedMedical(page, actor.label);
      await expect(
        page.getByRole("heading", { level: 1, name: "Histórico do paciente" })
      ).toBeVisible();
      await throwIfHeading(
        page,
        "Não foi possível carregar o histórico",
        `${actor.label} history failed to load.`
      );

      if (
        await page
          .getByRole("heading", { name: "Nenhum registro nos últimos 7 dias" })
          .isVisible()
      ) {
        throw new Error(
          `Fixture problem: ${actor.label} has no record in the default 7-day history period. Move that local record into the last 7 days manually. This test was not weakened.`
        );
      }

      if (
        await page
          .getByRole("heading", { name: "Nenhum registro disponível" })
          .isVisible()
      ) {
        throw new Error(
          `Fixture problem: ${actor.label} has no history records. This test was not weakened.`
        );
      }

      await expectNameVisible(page, actor.patientName);
      await expectMeasurementPresent(
        page.getByRole("main"),
        actor.patientPef,
        `${actor.label} history`
      );
      await expectPefAbsent(
        page.getByRole("main"),
        actor.otherPatientPef,
        `${actor.label} history`
      );
      await expect(
        page.getByRole("link", { name: /Ver detalhes/ })
      ).toHaveCount(0);
      await expectReadOnlyClinicalPage(page);
      safety.finish();
    });

    test("authorized report is read-only", async ({ page }) => {
      const safety = trackPageSafety(page);
      await page.goto(reportPath(actor.patientId));
      assertAuthenticatedMedical(page, actor.label);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Relatório de acompanhamento",
        })
      ).toBeVisible();
      await throwIfHeading(
        page,
        "Não foi possível carregar o relatório",
        `${actor.label} report failed to load.`
      );

      if (
        await page
          .getByRole("heading", {
            name: "Nenhum registro no período selecionado.",
          })
          .isVisible()
      ) {
        throw new Error(
          `Fixture problem: ${actor.label} has no record in the default 30-day report period. Move that local record into the last 30 days manually. This test was not weakened.`
        );
      }

      const summary = page.getByRole("region", { name: "Resumo do PEF" });
      await expectMeasurementPresent(
        summary,
        actor.patientPef,
        `${actor.label} report`
      );
      await expectPefAbsent(
        page.getByRole("main"),
        actor.otherPatientPef,
        `${actor.label} report`
      );
      await expectNameVisible(page, actor.patientName);
      await expect(
        page.getByText(actor.otherPatientName, { exact: true })
      ).toHaveCount(0);
      await expectReadOnlyClinicalPage(page);
      safety.finish();
    });

    test("unauthorized direct routes reveal no patient data", async ({
      page,
    }) => {
      const safety = trackPageSafety(page);
      await expectInaccessiblePatient(
        page,
        actor,
        dashboardPath(actor.otherPatientId)
      );
      await expectInaccessiblePatient(
        page,
        actor,
        historyPath(actor.otherPatientId)
      );
      await expectInaccessiblePatient(
        page,
        actor,
        reportPath(actor.otherPatientId)
      );
      safety.finish();
    });

    test("patient-owned write routes are inaccessible", async ({ page }) => {
      const safety = trackPageSafety(page);
      await expectPatientWriteRouteBlocked(page, "/paciente/novo-registro");
      await expectPatientWriteRouteBlocked(page, editPath(actor.recordId));
      safety.finish();
    });
  });
}

registerStableSuite(medicalAccounts.medicalA);
registerStableSuite(medicalAccounts.medicalB);

test.describe("medical revocation and restoration", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Patient A can revoke and restore Medical A",
    { tag: "@medical-revocation" },
    async ({ browser }, testInfo) => {
      test.setTimeout(600_000);
      const patientContext = await contextWithStorage(
        browser,
        testInfo,
        PATIENT_A_STATE
      );
      const medicalContext = await contextWithStorage(
        browser,
        testInfo,
        MEDICAL_A_STATE
      );
      const patientPage = await patientContext.newPage();
      const patientSafety = trackPageSafety(patientPage);
      const medicalGuards: Array<{ finish: () => void }> = [];
      let restored = false;

      try {
        const initialPage = await openFreshMedicalPage(
          medicalContext,
          medicalGuards
        );
        await expectAuthorizedPatientVisible(
          initialPage,
          medicalAccounts.medicalA
        );
        await initialPage.close();

        await revokeProfessional(patientPage, MEDICAL_A_NAME);

        const revokedList = await openFreshMedicalPage(
          medicalContext,
          medicalGuards
        );
        await openPatientList(revokedList, medicalAccounts.medicalA);
        await expect(revokedList.getByText("Nenhum paciente autorizado")).toBeVisible();
        await expect(
          revokedList.getByText(PATIENT_A_NAME, { exact: true })
        ).toHaveCount(0);
        await searchPatients(revokedList, PATIENT_A_NAME);
        await expect(
          revokedList.getByText(PATIENT_A_NAME, { exact: true })
        ).toHaveCount(0);
        await expect(
          revokedList.getByText("Nenhum paciente autorizado")
        ).toBeVisible();
        await expectPefAbsent(
          revokedList.getByRole("main"),
          medicalAccounts.medicalA.patientPef,
          "Medical A search after revocation"
        );
        await revokedList.close();

        for (const path of [
          dashboardPath(medicalAccounts.medicalA.patientId),
          historyPath(medicalAccounts.medicalA.patientId),
          reportPath(medicalAccounts.medicalA.patientId),
        ]) {
          const revokedPage = await openFreshMedicalPage(
            medicalContext,
            medicalGuards
          );
          await expectInaccessiblePatient(
            revokedPage,
            {
              ...medicalAccounts.medicalA,
              otherPatientName: PATIENT_A_NAME,
              otherPatientId: medicalAccounts.medicalA.patientId,
              otherPatientPef: medicalAccounts.medicalA.patientPef,
            },
            path
          );
          await revokedPage.close();
        }

        await authorizeProfessional(
          patientPage,
          MEDICAL_A_NAME,
          "E2E_MEDICAL_A_PROFESSIONAL_CODE"
        );
        restored = true;

        const restoredList = await openFreshMedicalPage(
          medicalContext,
          medicalGuards
        );
        await expectAuthorizedPatientVisible(
          restoredList,
          medicalAccounts.medicalA
        );
        await restoredList.close();

        const restoredDashboard = await openFreshMedicalPage(
          medicalContext,
          medicalGuards
        );
        await restoredDashboard.goto(
          dashboardPath(medicalAccounts.medicalA.patientId),
          { waitUntil: "domcontentloaded", timeout: 60_000 }
        );
        await expect(
          restoredDashboard.getByRole("heading", {
            level: 1,
            name: "Dashboard do paciente",
          })
        ).toBeVisible();
        await expectNameVisible(restoredDashboard, PATIENT_A_NAME);
        await expectMeasurementPresent(
          restoredDashboard.getByRole("main"),
          medicalAccounts.medicalA.patientPef,
          "Medical A dashboard after restoration"
        );
        await restoredDashboard.close();
      } catch (error) {
        if (!restored) {
          try {
            await authorizeProfessional(
              patientPage,
              MEDICAL_A_NAME,
              "E2E_MEDICAL_A_PROFESSIONAL_CODE"
            );
            restored = true;
          } catch {
            throw new Error(
              "Medical A authorization fixture is revoked. Restore it manually: sign in as Patient A, open /paciente/configuracoes/acessos, search the value of E2E_MEDICAL_A_PROFESSIONAL_CODE, confirm Profissional Ficticio Alfa, and choose Autorizar acesso. Do not clear an existing revoked row."
            );
          }
        }

        throw error;
      } finally {
        try {
          for (const guard of medicalGuards) {
            guard.finish();
          }
          patientSafety.finish();
        } finally {
          await patientContext.close();
          await medicalContext.close();
        }
      }
    }
  );
});

async function expectLogoutBlocksMedicalArea(page: Page) {
  await page.goto("/equipe-medica");
  await expect(
    page.getByRole("heading", { level: 1, name: "Área da equipe médica" })
  ).toBeVisible();

  const logout = page.getByRole("button", { name: "Encerrar sessão" });
  await expect(logout).toHaveCount(1);
  await logout.click();

  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Entrar" })
  ).toBeVisible();

  await page.goto("/equipe-medica");
  await expect(page).toHaveURL(
    /\/login\?next=(?:%2F|\/)equipe-medica$/
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Entrar" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Área da equipe médica" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Pacientes" })
  ).toHaveCount(0);

  await page.goBack();

  const loginHeading = page.getByRole("heading", { level: 1, name: "Entrar" });
  const medicalHeading = page.getByRole("heading", {
    name: "Área da equipe médica",
  });
  await expect(loginHeading.or(medicalHeading)).toBeVisible();
  await expect(medicalHeading).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Pacientes" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Encerrar sessão" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Menu lateral" })
  ).toHaveCount(0);
  await expect(page.getByText(PATIENT_A_NAME, { exact: true })).toHaveCount(0);
  await expect(page.getByText(PATIENT_B_NAME, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/\b\d{2,4}\s*L\/min\b/)).toHaveCount(0);
}

test.describe("authorization fixture", () => {
  test(
    "creates the paired local authorizations",
    { tag: "@authorization-fixture" },
    async ({ browser }, testInfo) => {
      test.setTimeout(180_000);
      const pairs = [
        {
          storageState: PATIENT_A_STATE,
          professionalName: MEDICAL_A_NAME,
          codeVariable: "E2E_MEDICAL_A_PROFESSIONAL_CODE",
        },
        {
          storageState: PATIENT_B_STATE,
          professionalName: MEDICAL_B_NAME,
          codeVariable: "E2E_MEDICAL_B_PROFESSIONAL_CODE",
        },
      ] as const;

      for (const pair of pairs) {
        const context = await contextWithStorage(
          browser,
          testInfo,
          pair.storageState
        );
        const page = await context.newPage();
        const safety = trackPageSafety(page);

        try {
          await authorizeProfessional(
            page,
            pair.professionalName,
            pair.codeVariable
          );
        } finally {
          safety.finish();
          await context.close();
        }
      }
    }
  );
});

test.describe("medical logout", { tag: "@medical-logout" }, () => {
  test("Medical A logout blocks fresh access and browser back", async ({
    browser,
  }, testInfo) => {
    const context = await contextWithStorage(
      browser,
      testInfo,
      MEDICAL_A_STATE
    );
    const page = await context.newPage();
    const safety = trackPageSafety(page);

    try {
      await expectLogoutBlocksMedicalArea(page);
    } finally {
      safety.finish();
      await context.close();
    }
  });

  test("Medical B logout blocks fresh access and browser back", async ({
    browser,
  }, testInfo) => {
    const context = await contextWithStorage(
      browser,
      testInfo,
      MEDICAL_B_STATE
    );
    const page = await context.newPage();
    const safety = trackPageSafety(page);

    try {
      await expectLogoutBlocksMedicalArea(page);
    } finally {
      safety.finish();
      await context.close();
    }
  });
});
