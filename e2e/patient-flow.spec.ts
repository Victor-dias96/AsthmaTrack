import { expect, test, type Locator, type Page } from "@playwright/test";

const INITIAL_NOTE = "Registro fictício da jornada E2E";
const UPDATED_NOTE = "Registro fictício atualizado pela jornada E2E";
const CREATED_SUCCESS = "Registro salvo com sucesso.";
const UPDATED_SUCCESS = "Registro atualizado com sucesso.";
const DELETED_SUCCESS = "Registro excluído com sucesso.";

const DISPOSABLE_PAIRS = [
  { created: "321", edited: "322" },
  { created: "331", edited: "332" },
  { created: "341", edited: "342" },
] as const;

type DisposablePair = (typeof DISPOSABLE_PAIRS)[number];

type JourneyState = {
  created: boolean;
  deleted: boolean;
  detailPath: string | null;
  pef: string | null;
};

type WriteCounts = {
  insert: number;
  update: number;
  delete: number;
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

function standalonePefPattern(pef: string): RegExp {
  return new RegExp(`(?<!\\d)${pef}(?!\\d)`);
}

function pefMeasurementPattern(pef: string): RegExp {
  return new RegExp(
    `(?<!\\d)${pef}(?!\\d)[\\s\\S]{0,80}?(?:L\\/min|litros por minuto)`
  );
}

function latestChartMeasurementPattern(pef: string): RegExp {
  return new RegExp(
    `Última medição[\\s\\S]{0,120}?(?<!\\d)${pef}(?!\\d)[\\s\\S]{0,40}?litros por minuto`
  );
}

function singleChartMeasurementPattern(pef: string): RegExp {
  return new RegExp(
    `uma medição de PEF[\\s\\S]{0,120}?(?<!\\d)${pef}(?!\\d)[\\s\\S]{0,40}?litros por minuto`
  );
}

async function readText(locator: Locator): Promise<string> {
  return locator.evaluate((element) => element.textContent ?? "");
}

function assertMeasurementPresent(text: string, pef: string, label: string) {
  if (!pefMeasurementPattern(pef).test(text)) {
    throw new Error(`${label} does not show the expected PEF measurement.`);
  }
}

function assertMeasurementAbsent(text: string, pef: string, label: string) {
  if (pefMeasurementPattern(pef).test(text)) {
    throw new Error(`${label} includes a PEF measurement that should be absent.`);
  }
}

function assertStandaloneAbsent(text: string, pef: string, label: string) {
  if (standalonePefPattern(pef).test(text)) {
    throw new Error(`${label} still shows disposable PEF ${pef}.`);
  }
}

function assertNoBrokenValues(text: string, label: string) {
  if (
    /\bNaN\b/.test(text) ||
    /\bInfinity\b/.test(text) ||
    text.includes("Invalid Date")
  ) {
    throw new Error(`${label} rendered NaN, Infinity, or Invalid Date.`);
  }
}

function observedWrites(writes: WriteCounts): WriteCounts {
  return {
    insert: writes.insert,
    update: writes.update,
    delete: writes.delete,
  };
}

function trackPageSafety(page: Page, writes: WriteCounts) {
  const pageErrors: string[] = [];
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
    const supabaseApi =
      url.pathname.startsWith("/auth/v1") ||
      url.pathname.startsWith("/rest/v1");

    if (supabaseApi && !loopback) {
      usedNonLoopbackSupabase = true;
    }

    if (!url.pathname.includes("/rest/v1/daily_records")) {
      return;
    }

    if (request.method() === "POST") {
      writes.insert += 1;
    } else if (request.method() === "PATCH") {
      writes.update += 1;
    } else if (request.method() === "DELETE") {
      writes.delete += 1;
    }
  });

  return {
    finish() {
      expect(pageErrors, pageErrors.join("\n")).toEqual([]);
      expect(usedNonLoopbackSupabase).toBe(false);
    },
  };
}

async function chooseRadio(page: Page, groupName: string, optionName: string) {
  const group = page.getByRole("radiogroup", { name: groupName });
  const option = group.getByRole("radio", { name: optionName, exact: true });

  await group.locator("label", { hasText: optionName }).click();
  await expect(option).toBeChecked();
}

async function armBusyObserver(page: Page) {
  await page.evaluate(() => {
    const host = window as Window & { __patientFlowSawBusy?: boolean };
    host.__patientFlowSawBusy = false;

    const form = document.querySelector("form");

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (
          form.getAttribute("aria-busy") === "true" ||
          record.oldValue === "true"
        ) {
          host.__patientFlowSawBusy = true;
        }
      }
    });

    observer.observe(form, {
      attributes: true,
      attributeFilter: ["aria-busy"],
      attributeOldValue: true,
    });
  });
}

async function expectBusyObserved(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as Window & { __patientFlowSawBusy?: boolean })
              .__patientFlowSawBusy === true
        ),
      { timeout: 10_000 }
    )
    .toBe(true);
}

async function throwIfFormError(page: Page, errorId: string) {
  const error = page.locator(`#${errorId}`);

  if (await error.isVisible()) {
    const message = (await error.innerText()).replace(/\s+/g, " ").trim();
    throw new Error(`The daily-record form showed an error alert: ${message}`);
  }
}

function historyArticles(page: Page): Locator {
  return page
    .getByRole("list", { name: "Registros anteriores" })
    .getByRole("article");
}

async function matchingArticleIndexes(
  page: Page,
  pef: string
): Promise<number[]> {
  const articles = historyArticles(page);

  if ((await articles.count()) === 0) {
    return [];
  }

  const pattern = standalonePefPattern(pef);
  const matches: number[] = [];
  const count = await articles.count();

  for (let index = 0; index < count; index += 1) {
    const text = await readText(articles.nth(index));

    if (pattern.test(text)) {
      matches.push(index);
    }
  }

  return matches;
}

async function disposableArticle(page: Page, pef: string): Promise<Locator> {
  const matches = await matchingArticleIndexes(page, pef);

  if (matches.length !== 1) {
    throw new Error(
      `Expected one history card for disposable PEF ${pef} and found ${matches.length}.`
    );
  }

  return historyArticles(page).nth(matches[0]);
}

function captureDetailPath(page: Page): string {
  const pathname = new URL(page.url()).pathname;

  if (!/^\/paciente\/historico\/[^/]+$/.test(pathname)) {
    throw new Error("The disposable record did not open its detail route.");
  }

  return pathname;
}

async function readPeriodTotal(page: Page): Promise<number> {
  const card = page
    .getByRole("region", { name: "Resumo" })
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "Total de registros" }),
    });
  const label = await card.getByRole("group").getAttribute("aria-label");

  if (label === "1 registro no período selecionado.") {
    return 1;
  }

  const match = label?.match(/^(\d+) registros no período selecionado\.$/);

  if (match === null || match === undefined) {
    throw new Error(
      "Dashboard total records were not in the established period format."
    );
  }

  return Number(match[1]);
}

async function expectDetailSymptom(
  page: Page,
  symptom: string,
  severity: string
) {
  // Chromium exposes these `dt` elements as terms without an accessible name,
  // so the visible text is matched instead of the role name.
  const term = page.getByRole("term").filter({ hasText: symptom });
  await expect(term).toHaveCount(1);
  await expect(term).toBeVisible();
  await expect(term.locator("xpath=following-sibling::*[1]")).toHaveText(
    severity
  );
}

async function expectDetailNote(page: Page, note: string) {
  await expect(
    page
      .getByRole("heading", { name: "Observações" })
      .locator("xpath=../following-sibling::p[1]")
  ).toHaveText(note);
}

function latestPefCard(page: Page): Locator {
  return page
    .getByRole("region", { name: "Resumo" })
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { name: "Último PEF" }),
    });
}

async function selectDisposablePair(
  page: Page,
  reservedPefs: readonly string[],
  dashboardText: string
): Promise<DisposablePair> {
  await page.goto("/paciente/historico?periodo=90");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Histórico" })
  ).toBeVisible();

  if (
    await page
      .getByRole("heading", { name: "Não foi possível carregar o histórico" })
      .isVisible()
  ) {
    throw new Error(
      "History failed to load before a disposable PEF could be chosen."
    );
  }

  const historyText = await readText(page.getByRole("main"));
  const occupied = `${dashboardText}\n${historyText}`;
  const reserved = new Set(reservedPefs);

  for (const pair of DISPOSABLE_PAIRS) {
    if (reserved.has(pair.created) || reserved.has(pair.edited)) {
      continue;
    }

    if (
      standalonePefPattern(pair.created).test(occupied) ||
      standalonePefPattern(pair.edited).test(occupied)
    ) {
      continue;
    }

    return pair;
  }

  throw new Error(
    "Every fixed disposable PEF pair is already visible in the 90-day history. Remove that local fictional record from the patient UI before retrying. No new record was created."
  );
}

async function fillNewRecord(page: Page, pef: string, note: string) {
  await page.goto("/paciente/novo-registro");
  await expect(page).toHaveURL(/\/paciente\/novo-registro$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Novo registro" })
  ).toBeVisible();

  const recordedAt = page.getByLabel("Data e horário");
  await expect(recordedAt).toBeEnabled();
  await expect(recordedAt).toHaveValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

  const recordedAtValue = await recordedAt.inputValue();
  const productToday = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Maceio",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  if (!recordedAtValue.startsWith(productToday)) {
    throw new Error(
      "The new record date is not the current day in America/Maceio, so it can fall outside the default history and dashboard periods."
    );
  }

  const pefField = page.getByLabel(/Pico de Fluxo Expiratório \(PEF\)/);
  await pefField.fill(pef);
  await expect(pefField).toHaveValue(pef);

  await chooseRadio(page, "Tosse", "Nenhuma");
  await chooseRadio(page, "Chiado", "Nenhum");
  await chooseRadio(page, "Falta de ar", "Nenhuma");
  await chooseRadio(page, "Aperto no peito", "Nenhum");
  await chooseRadio(page, "Teve uma crise de asma?", "Não");
  await chooseRadio(page, "Usou medicação de alívio?", "Não");

  const notes = page.getByLabel("Observações");
  await notes.fill(note);
  await expect(notes).toHaveValue(note);
}

async function submitRecord(
  page: Page,
  successCopy: string,
  errorId: string,
  onConfirmed: () => void
) {
  await armBusyObserver(page);
  await page.getByRole("button", { name: "Salvar registro" }).click();

  const success = page.getByRole("alert").filter({ hasText: successCopy });
  const failure = page.locator(`#${errorId}`);
  await expect(success.or(failure)).toBeVisible({ timeout: 20_000 });
  await throwIfFormError(page, errorId);
  await expect(success).toBeVisible();
  onConfirmed();
  await expectBusyObserved(page);
  await expect(
    page.getByRole("button", { name: "Salvar registro" })
  ).toBeDisabled();
}

async function expectRecordDetails(
  page: Page,
  pef: string,
  absentPef: string | null,
  note: string
) {
  await expect(
    page.getByRole("heading", { level: 1, name: "Detalhes do registro" })
  ).toBeVisible();

  const article = page.getByRole("article");
  const articleText = await readText(article);
  assertMeasurementPresent(articleText, pef, "Record details");
  assertNoBrokenValues(articleText, "Record details");

  if (absentPef !== null) {
    assertStandaloneAbsent(articleText, absentPef, "Record details");
  }

  const recordedAt = article.locator("time");
  await expect(recordedAt).toBeVisible();
  await expect(recordedAt).toHaveAttribute(
    "dateTime",
    /^\d{4}-\d{2}-\d{2}T/
  );
  await expect(recordedAt).toHaveText(/\d{2}\/\d{2}\/\d{4}/);
  await expect(recordedAt).not.toHaveText("Data indisponível");

  await expectDetailSymptom(page, "Tosse", "Nenhuma");
  await expectDetailSymptom(page, "Chiado", "Nenhum");
  await expectDetailSymptom(page, "Falta de ar", "Nenhuma");
  await expectDetailSymptom(page, "Aperto no peito", "Nenhum");
  await expect(page.getByText("Crise registrada: Não")).toBeVisible();
  await expect(page.getByText("Medicação de alívio: Não")).toBeVisible();
  await expectDetailNote(page, note);
  await expect(
    page.getByRole("link", { name: "Editar registro" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Excluir registro" })
  ).toBeVisible();
}

async function confirmDelete(page: Page) {
  await page.getByRole("button", { name: "Excluir registro" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Excluir este registro?" })
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Excluir registro" }).click();

  await expect(page).toHaveURL(/\/paciente\/historico\?/, { timeout: 20_000 });
  await expect(page).toHaveURL(/(?:^|[?&])excluido=1(?:&|$)/);
  await expect(
    page.getByRole("alert").filter({ hasText: DELETED_SUCCESS })
  ).toBeVisible();
}

async function cleanupDisposable(page: Page, state: JourneyState) {
  if (state.pef === null) {
    throw new Error(
      "Cleanup stopped because the disposable PEF was not known. A fictional E2E journey record may remain."
    );
  }

  if (page.url().includes("/login")) {
    throw new Error(
      `Cleanup stopped because the patient session already ended. Disposable PEF ${state.pef} with a fictional E2E journey note may remain. Open Histórico as Patient A and delete that card.`
    );
  }

  if (state.detailPath !== null) {
    await page.goto(state.detailPath);
  } else {
    await page.goto("/paciente/historico");
  }

  const missing = page.getByRole("heading", {
    level: 1,
    name: "Registro não encontrado",
  });
  const deleteButton = page.getByRole("button", { name: "Excluir registro" });
  const historyHeading = page.getByRole("heading", {
    level: 1,
    name: "Histórico",
  });

  await expect(missing.or(deleteButton).or(historyHeading)).toBeVisible({
    timeout: 20_000,
  });

  if (await missing.isVisible()) {
    state.deleted = true;
    return;
  }

  if (!(await deleteButton.isVisible())) {
    const matches = await matchingArticleIndexes(page, state.pef);

    if (matches.length === 0) {
      state.deleted = true;
      return;
    }

    if (matches.length !== 1) {
      throw new Error(
        `Refusing cleanup because ${matches.length} history cards match disposable PEF ${state.pef}.`
      );
    }

    await historyArticles(page)
      .nth(matches[0])
      .getByRole("link", { name: /Ver detalhes do registro de/ })
      .click();
  }

  await confirmDelete(page);
  state.deleted = true;
}

test.describe.serial("fluxo completo do paciente", () => {
  test("cria, consulta, edita, relata e exclui um registro", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const fixturePef = requirePef("E2E_PATIENT_A_PEF");
    const otherPef = requirePef("E2E_PATIENT_B_PEF");
    const writes: WriteCounts = { insert: 0, update: 0, delete: 0 };
    const safety = trackPageSafety(page, writes);
    const state: JourneyState = {
      created: false,
      deleted: false,
      detailPath: null,
      pef: null,
    };
    let journeyError: unknown;

    try {
      await page.goto("/paciente/dashboard");
      await expect(page).toHaveURL(/\/paciente\/dashboard$/);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { level: 1, name: /^Olá/ })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Você ainda não possui registros" })
      ).toHaveCount(0);

      const initialLatest = await readText(latestPefCard(page));
      assertMeasurementPresent(
        initialLatest,
        fixturePef,
        "Patient A latest PEF before the journey"
      );
      assertMeasurementAbsent(
        initialLatest,
        otherPef,
        "Patient A latest PEF before the journey"
      );

      const initialMain = await readText(page.getByRole("main"));
      assertMeasurementAbsent(
        initialMain,
        otherPef,
        "Patient A dashboard before the journey"
      );
      assertNoBrokenValues(initialMain, "Patient A dashboard");
      const baselineTotal = await readPeriodTotal(page);

      const pair = await selectDisposablePair(page, [fixturePef, otherPef], initialMain);
      state.pef = pair.created;

      await fillNewRecord(page, pair.created, INITIAL_NOTE);
      await submitRecord(
        page,
        CREATED_SUCCESS,
        "daily-record-form-error",
        () => {
          state.created = true;
        }
      );

      const createdWrites = observedWrites(writes);

      if (
        createdWrites.insert !== 1 ||
        createdWrites.update !== 0 ||
        createdWrites.delete !== 0
      ) {
        throw new Error(
          `Expected one insert and no update or delete while creating the record. Observed insert=${createdWrites.insert}, update=${createdWrites.update}, delete=${createdWrites.delete}.`
        );
      }

      await expect(page).toHaveURL(/\/paciente\/dashboard$/, {
        timeout: 20_000,
      });
      await expect(
        page.getByRole("heading", { level: 1, name: /^Olá/ })
      ).toBeVisible();

      const createdLatest = await readText(latestPefCard(page));
      assertMeasurementPresent(
        createdLatest,
        pair.created,
        "Dashboard latest PEF after creation"
      );
      assertMeasurementAbsent(
        createdLatest,
        otherPef,
        "Dashboard latest PEF after creation"
      );

      const recentRecords = page.getByRole("region", {
        name: "Registros recentes",
      });
      const recentText = await readText(recentRecords);
      assertMeasurementPresent(
        recentText,
        pair.created,
        "Dashboard recent records after creation"
      );
      assertMeasurementPresent(
        recentText,
        fixturePef,
        "Dashboard recent records after creation"
      );
      assertMeasurementAbsent(
        recentText,
        otherPef,
        "Dashboard recent records after creation"
      );

      const chart = page.getByRole("region", { name: "Evolução do PEF" });
      const chartText = await readText(chart);
      assertMeasurementPresent(
        chartText,
        pair.created,
        "Dashboard chart after creation"
      );
      assertMeasurementPresent(
        chartText,
        fixturePef,
        "Dashboard chart after creation"
      );

      if (!latestChartMeasurementPattern(pair.created).test(chartText)) {
        throw new Error(
          "Dashboard chart summary does not report the new disposable PEF as the latest measurement."
        );
      }

      assertNoBrokenValues(
        await readText(page.getByRole("main")),
        "Dashboard after creation"
      );
      expect(await readPeriodTotal(page)).toBe(baselineTotal + 1);

      await page.goto("/paciente/historico");
      await expect(
        page.getByRole("heading", { level: 1, name: "Histórico" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Últimos 7 dias/ })
      ).toHaveAttribute("aria-current", "page");

      const createdCard = await disposableArticle(page, pair.created);
      await expect(createdCard.getByText("Com observação")).toBeVisible();
      const historyText = await readText(page.getByRole("main"));
      assertMeasurementPresent(historyText, fixturePef, "History after creation");
      assertMeasurementAbsent(
        historyText,
        otherPef,
        "History after creation"
      );

      await createdCard
        .getByRole("link", { name: /Ver detalhes do registro de/ })
        .click();
      await expect(page).toHaveURL(/\/paciente\/historico\/[^/]+$/, {
        timeout: 20_000,
      });
      state.detailPath = captureDetailPath(page);
      await expectRecordDetails(page, pair.created, null, INITIAL_NOTE);

      const editLink = page.getByRole("link", { name: "Editar registro" });
      await expect(editLink).toBeVisible();
      const editHref = await editLink.getAttribute("href");

      if (editHref === null || !editHref.includes("/editar")) {
        throw new Error("The edit action does not point at the edit route.");
      }

      await editLink.click();
      await expect(page).toHaveURL(/\/editar(?:\?|#|$)/, { timeout: 45_000 });
      await expect(
        page.getByRole("heading", { level: 1, name: "Editar registro" })
      ).toBeVisible();

      const editPef = page.getByLabel(/Pico de Fluxo Expiratório \(PEF\)/);
      await expect(editPef).toHaveValue(pair.created);
      await editPef.fill(pair.edited);
      await expect(editPef).toHaveValue(pair.edited);

      const editNotes = page.getByLabel("Observações");
      await expect(editNotes).toHaveValue(INITIAL_NOTE);
      await editNotes.fill(UPDATED_NOTE);
      await expect(editNotes).toHaveValue(UPDATED_NOTE);

      await submitRecord(
        page,
        UPDATED_SUCCESS,
        "daily-record-edit-form-error",
        () => {
          state.pef = pair.edited;
        }
      );

      const editedWrites = observedWrites(writes);

      if (editedWrites.insert !== 1 || editedWrites.update !== 1) {
        throw new Error(
          `Editing the record created another insert or missed the update. Observed insert=${editedWrites.insert}, update=${editedWrites.update}.`
        );
      }

      await expect(page).toHaveURL(/\/paciente\/historico\/[^/]+$/, {
        timeout: 20_000,
      });
      await expect(page).not.toHaveURL(/\/editar$/);
      state.detailPath = captureDetailPath(page);
      await expectRecordDetails(page, pair.edited, pair.created, UPDATED_NOTE);

      await page.goto("/paciente/historico");
      await disposableArticle(page, pair.edited);
      expect(await matchingArticleIndexes(page, pair.created)).toEqual([]);
      const editedHistory = await readText(page.getByRole("main"));
      assertMeasurementPresent(
        editedHistory,
        fixturePef,
        "History after editing"
      );
      assertMeasurementAbsent(editedHistory, otherPef, "History after editing");

      await page.goto("/paciente/dashboard");
      const editedLatest = await readText(latestPefCard(page));
      assertMeasurementPresent(
        editedLatest,
        pair.edited,
        "Dashboard latest PEF after editing"
      );
      assertStandaloneAbsent(
        editedLatest,
        pair.created,
        "Dashboard latest PEF after editing"
      );

      const editedRecent = await readText(
        page.getByRole("region", { name: "Registros recentes" })
      );
      assertMeasurementPresent(
        editedRecent,
        pair.edited,
        "Dashboard recent records after editing"
      );
      assertMeasurementPresent(
        editedRecent,
        fixturePef,
        "Dashboard recent records after editing"
      );
      assertStandaloneAbsent(
        editedRecent,
        pair.created,
        "Dashboard recent records after editing"
      );

      const editedChart = await readText(
        page.getByRole("region", { name: "Evolução do PEF" })
      );

      if (!latestChartMeasurementPattern(pair.edited).test(editedChart)) {
        throw new Error(
          "Dashboard chart summary still treats the created PEF as the latest measurement."
        );
      }

      assertStandaloneAbsent(
        editedChart,
        pair.created,
        "Dashboard chart after editing"
      );
      assertNoBrokenValues(
        await readText(page.getByRole("main")),
        "Dashboard after editing"
      );

      await page.goto("/paciente/relatorio");
      await expect(
        page.getByRole("heading", { level: 1, name: "Relatório" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Últimos 30 dias/ })
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page.getByRole("heading", {
          name: "Nenhum registro no período selecionado",
        })
      ).toHaveCount(0);

      const reportSummary = page.getByRole("region", {
        name: "Resumo do PEF",
        exact: true,
      });
      const latestReportValue = reportSummary
        .locator("div")
        .filter({
          has: page.getByRole("term").filter({ hasText: "Último valor" }),
        })
        .first();
      const latestReportText = await readText(latestReportValue);
      assertMeasurementPresent(
        latestReportText,
        pair.edited,
        "Report latest PEF"
      );
      assertStandaloneAbsent(
        latestReportText,
        pair.created,
        "Report latest PEF"
      );

      const reportText = await readText(page.getByRole("main"));
      assertStandaloneAbsent(reportText, pair.created, "Patient report");
      assertMeasurementAbsent(reportText, otherPef, "Patient report");
      assertMeasurementPresent(reportText, pair.edited, "Patient report");
      assertNoBrokenValues(reportText, "Patient report");

      await page.reload();
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Relatório" })
      ).toBeVisible();
      const reloadedReport = await readText(
        page.getByRole("region", { name: "Resumo do PEF", exact: true })
      );
      assertMeasurementPresent(
        reloadedReport,
        pair.edited,
        "Report after reload"
      );
      assertStandaloneAbsent(
        reloadedReport,
        pair.created,
        "Report after reload"
      );

      await page.goto("/paciente/dashboard");
      await expect(
        page.getByRole("heading", { level: 1, name: /^Olá/ })
      ).toBeVisible();
      await page.goto(state.detailPath);
      await expectRecordDetails(page, pair.edited, pair.created, UPDATED_NOTE);
      await page.reload();
      await expect(page).not.toHaveURL(/\/login/);
      await expectRecordDetails(page, pair.edited, pair.created, UPDATED_NOTE);

      await page.goto("/paciente/historico");
      await expect(
        page.getByRole("heading", { level: 1, name: "Histórico" })
      ).toBeVisible();
      await expect
        .poll(async () => (await matchingArticleIndexes(page, pair.edited)).length)
        .toBe(1);
      await expect
        .poll(async () => (await matchingArticleIndexes(page, pair.created)).length)
        .toBe(0);

      await page.goto(state.detailPath);
      await confirmDelete(page);
      state.deleted = true;

      const deletedWrites = observedWrites(writes);

      if (deletedWrites.delete !== 1) {
        throw new Error(
          `Expected one delete request and observed ${deletedWrites.delete}.`
        );
      }

      const deletedHistory = await readText(page.getByRole("main"));
      assertStandaloneAbsent(
        deletedHistory,
        pair.edited,
        "History after deletion"
      );
      assertStandaloneAbsent(
        deletedHistory,
        pair.created,
        "History after deletion"
      );
      assertMeasurementPresent(
        deletedHistory,
        fixturePef,
        "History after deletion"
      );
      assertMeasurementAbsent(
        deletedHistory,
        otherPef,
        "History after deletion"
      );

      if (deletedHistory.includes(UPDATED_NOTE) || deletedHistory.includes(INITIAL_NOTE)) {
        throw new Error("History still shows the disposable fictional note.");
      }

      await page.goto(state.detailPath);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Registro não encontrado",
        })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Data da medição" })
      ).toHaveCount(0);
      const missingText = await readText(page.getByRole("main"));
      assertStandaloneAbsent(missingText, pair.edited, "Deleted record route");
      assertStandaloneAbsent(missingText, pair.created, "Deleted record route");

      if (missingText.includes(UPDATED_NOTE) || missingText.includes(INITIAL_NOTE)) {
        throw new Error("The deleted record route still shows its fictional note.");
      }

      await page.goto("/paciente/dashboard");
      const restoredLatest = await readText(latestPefCard(page));
      assertMeasurementPresent(
        restoredLatest,
        fixturePef,
        "Dashboard latest PEF after deletion"
      );
      assertStandaloneAbsent(
        restoredLatest,
        pair.edited,
        "Dashboard latest PEF after deletion"
      );
      const restoredMain = await readText(page.getByRole("main"));
      assertStandaloneAbsent(
        restoredMain,
        pair.edited,
        "Dashboard after deletion"
      );
      assertMeasurementAbsent(
        restoredMain,
        otherPef,
        "Dashboard after deletion"
      );
      expect(await readPeriodTotal(page)).toBe(baselineTotal);

      const restoredChart = await readText(
        page.getByRole("region", { name: "Evolução do PEF" })
      );

      if (
        !latestChartMeasurementPattern(fixturePef).test(restoredChart) &&
        !singleChartMeasurementPattern(fixturePef).test(restoredChart)
      ) {
        throw new Error(
          "Dashboard chart no longer reports the established Patient A fixture as the latest remaining measurement."
        );
      }

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
      await expect(
        page.getByRole("heading", { name: "Último PEF" })
      ).toHaveCount(0);

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
    } catch (error) {
      journeyError = error;
    } finally {
      let cleanupError: unknown;

      if (state.created && !state.deleted) {
        try {
          await cleanupDisposable(page, state);
        } catch (error) {
          cleanupError = error;
        }
      }

      if (cleanupError) {
        const cleanupMessage =
          cleanupError instanceof Error
            ? cleanupError.message
            : "Cleanup failed.";
        const journeyMessage =
          journeyError instanceof Error
            ? journeyError.message
            : journeyError
              ? "The patient journey failed."
              : "";

        throw new Error(
          journeyMessage
            ? `${journeyMessage} ${cleanupMessage}`
            : cleanupMessage
        );
      }
    }

    if (journeyError) {
      throw journeyError;
    }
  });
});
