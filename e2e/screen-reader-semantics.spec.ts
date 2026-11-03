import { expect, test, type Page } from "@playwright/test";

const MAIN = "#conteudo-principal";
const UNKNOWN_PATIENT_ID = "00000000-0000-4000-8000-000000000099";
const UNKNOWN_RECORD_ID = "00000000-0000-4000-8000-000000000088";

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

async function expectOneHeading(page: Page, name: string | RegExp) {
  const headings = page.getByRole("heading", { level: 1 });
  await expect(headings).toHaveCount(1);
  await expect(headings).toHaveAccessibleName(name);
}

async function expectMainLandmark(page: Page) {
  const mains = page.getByRole("main");
  await expect(mains).toHaveCount(1);
  const main = page.locator(MAIN);
  await expect(main).toHaveCount(1);
  await expect(main).toHaveAttribute("tabindex", "-1");
}

async function expectNoDuplicateIds(page: Page) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map<string, number>();

    for (const element of document.querySelectorAll("[id]")) {
      const id = element.id;
      if (!id) {
        continue;
      }
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
  });

  expect(duplicates).toEqual([]);
}

async function expectTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(`${title} | AsthmaTrack`);
}

test.describe("@semantics-public", () => {
  test("login exposes one heading, landmarks, labels and associated errors", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/login");

    await expectTitle(page, "Entrar");
    await expectOneHeading(page, "Entrar");
    await expectMainLandmark(page);
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute(
      "href",
      MAIN
    );
    await expect(page.getByRole("navigation")).toHaveCount(0);

    const email = page.getByRole("textbox", { name: "E-mail" });
    const password = page.getByRole("textbox", { name: "Senha" });
    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");
    await expect(email).toHaveAttribute("id", "login-email");
    await expect(password).toHaveAttribute("id", "login-password");

    const showPassword = page.getByRole("button", { name: "Mostrar senha" });
    await expect(showPassword).toHaveAttribute("aria-pressed", "false");
    await expect(showPassword.locator("svg")).toHaveAttribute("aria-hidden", "true");

    await expect(page.getByText("Você está offline")).toHaveCount(0);
    await expect(page.getByText("Conexão restabelecida")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Atualizar agora" })).toHaveCount(0);
    await expect(
      page.getByRole("alert").filter({ hasText: "Seus dados são armazenados com segurança" })
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "login-email-error");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-describedby", "login-password-error");
    await expect(page.getByRole("alert").filter({ hasText: "Informe seu e-mail" })).toBeVisible();
    await expectNoDuplicateIds(page);
    expectNoPageErrors(pageErrors);
  });

  test("registration associates requirements, errors and the terms checkbox", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/cadastro");

    await expectTitle(page, "Criar conta");
    await expectOneHeading(page, "Criar conta");
    await expectMainLandmark(page);

    const password = page.getByRole("textbox", { name: "Senha", exact: true });
    const confirmation = page.getByRole("textbox", { name: "Confirmar senha" });
    const terms = page.getByRole("checkbox", {
      name: "Li e aceito os Termos de Uso e a Política de Privacidade",
    });

    await expect(password).toHaveAttribute("aria-describedby", "register-password-hint");
    await expect(page.getByText("Mínimo de 6 caracteres.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mostrar senha" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mostrar confirmação da senha" })
    ).toBeVisible();
    await expect(terms).toHaveAttribute("required", "");
    await expect(confirmation).toHaveAttribute("id", "register-password-confirm");

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("textbox", { name: "Nome completo" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveAttribute(
      "aria-describedby",
      "register-email-error"
    );
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-describedby", "register-password-error");
    await expect(confirmation).toHaveAttribute("aria-describedby", "register-password-confirm-error");
    await expect(terms).toHaveAttribute("aria-invalid", "true");
    await expect(terms).toHaveAttribute("aria-describedby", "register-terms-error");
    await expectNoDuplicateIds(page);
    expectNoPageErrors(pageErrors);
  });

  test("recovery and offline pages keep a useful heading and title", async ({ page }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto("/recuperar-senha");
    await expectTitle(page, "Recuperar senha");
    await expectOneHeading(page, "Recuperar senha");
    await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveAttribute(
      "id",
      "recover-email"
    );
    await expectMainLandmark(page);

    await page.goto("/offline");
    await expectTitle(page, "Sem conexão");
    await expectOneHeading(page, "Sem conexão");
    await expectMainLandmark(page);
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    await expect(page.locator("[aria-hidden='true'] svg").first()).toBeAttached();

    await page.goto("/pagina-inexistente");
    await expectOneHeading(page, "Página não encontrada");
    await expectTitle(page, "Página não encontrada");
    await expectMainLandmark(page);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("@semantics-patient", () => {
  test("dashboard, history and report keep headings, navigation and chart text", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/paciente/dashboard");

    await expectTitle(page, "Dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expectMainLandmark(page);
    await expect(page.getByRole("navigation", { name: "Navegação do paciente" })).toHaveCount(1);
    await expect(page.getByRole("complementary", { name: "Menu lateral" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Início", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();

    const chart = page.getByRole("region", { name: "Evolução do PEF" });
    await expect(chart).toBeVisible();
    const summary = page.locator("#dashboard-pef-chart-title-summary");
    if ((await summary.count()) > 0) {
      await expect(summary).toContainText("litros por minuto");
      await expect(summary).toContainText(/mediç/);
    } else {
      await expect(
        page.getByText("Registre medições para acompanhar a evolução do PEF.")
      ).toBeVisible();
    }
    await expectNoDuplicateIds(page);

    await page.goto("/paciente/historico");
    await expectTitle(page, "Histórico");
    await expectOneHeading(page, "Histórico");
    const details = page.getByRole("link", { name: /Ver detalhes do registro de/ });
    if ((await details.count()) > 0) {
      await expect(details.first()).toBeVisible();
      await details.first().click();
      await expectOneHeading(page, "Detalhes do registro");
      await expectTitle(page, "Detalhes do registro");
      await expect(page.getByText("litros por minuto").first()).toBeAttached();

      await page.getByRole("button", { name: "Excluir registro" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toHaveAccessibleName("Excluir este registro?");
      await expect(dialog.getByText("Esta ação não pode ser desfeita")).toBeVisible();
      const descriptionId = await dialog.getAttribute("aria-describedby");
      expect(descriptionId).toBeTruthy();
      await dialog.getByRole("button", { name: "Cancelar" }).click();
      await expect(dialog).toBeHidden();
    } else {
      await expect(page.getByRole("heading", { name: /Nenhum registro/ })).toBeVisible();
    }

    await page.goto("/paciente/relatorio");
    await expectTitle(page, "Relatório");
    await expectOneHeading(page, "Relatório");
    await expectNoDuplicateIds(page);
    expectNoPageErrors(pageErrors);
  });

  test("the new-record form names groups and associates invalid fields", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/paciente/novo-registro");

    await expectTitle(page, "Novo registro");
    await expectOneHeading(page, "Novo registro");
    await expect(page.getByRole("group", { name: "Seções do registro diário" })).toBeVisible();

    const recordedAt = page.getByRole("textbox", { name: "Data e horário" });
    const pef = page.getByRole("spinbutton", { name: /Pico de Fluxo Expiratório/ });
    const notes = page.getByRole("textbox", { name: "Observações" });
    const cough = page.getByRole("radiogroup", { name: "Tosse" });
    const attack = page.getByRole("radiogroup", { name: "Teve uma crise de asma?" });

    await expect(recordedAt).toHaveAttribute("required", "");
    await expect(pef).toHaveAttribute("aria-describedby", /daily-record-pef-value-hint/);
    await expect(pef).toHaveAttribute("aria-describedby", /daily-record-pef-value-unit/);
    await expect(notes).not.toHaveAttribute("required", "");
    await expect(notes).toHaveAttribute("aria-describedby", /daily-record-notes-hint/);
    await expect(notes).toHaveAttribute("aria-describedby", /daily-record-notes-counter/);
    await expect(cough.getByRole("radio", { name: "Nenhuma" })).toBeChecked();
    await expect(attack).toHaveAttribute("aria-describedby", /daily-record-had-attack-label-hint/);
    await expect(
      page.getByRole("radiogroup", { name: "Usou medicação de alívio?" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Salvar registro" }).click();
    await expect(pef).toHaveAttribute("aria-invalid", "true");
    await expect(pef).toHaveAttribute("aria-describedby", "daily-record-pef-value-error");
    await expect(page.getByRole("alert").filter({ hasText: "Informe o valor de PEF" })).toBeVisible();
    await expect(page).toHaveURL(/\/paciente\/novo-registro$/);
    await expectNoDuplicateIds(page);
    expectNoPageErrors(pageErrors);
  });

  test("settings and access management expose labels without changing access", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/paciente/configuracoes");

    await expectTitle(page, "Configurações");
    await expectOneHeading(page, "Configurações");
    await expect(page.getByRole("textbox", { name: "Nome completo" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveAttribute(
      "aria-readonly",
      "true"
    );
    await expect(page.getByRole("textbox", { name: "Tipo de conta" })).toHaveAttribute(
      "aria-readonly",
      "true"
    );
    await expect(page.getByRole("button", { name: "Sair da conta" })).toBeVisible();

    await page.goto("/paciente/configuracoes/acessos");
    await expectTitle(page, "Acesso da equipe médica");
    await expectOneHeading(page, "Acesso da equipe médica");
    const code = page.getByRole("textbox", { name: "Código do profissional" });
    await expect(code).toHaveAttribute("aria-describedby", "authorize-professional-code-hint");
    await expect(code).toHaveAttribute("required", "");
    await page.getByRole("button", { name: "Buscar profissional" }).click();
    await expect(code).toHaveAttribute("aria-invalid", "true");
    await expect(code).toHaveAttribute("aria-describedby", "authorize-professional-code-error");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    await page.goto(`/paciente/historico/${UNKNOWN_RECORD_ID}`);
    await expectOneHeading(page, "Registro não encontrado");
    await expect(page.getByText(UNKNOWN_RECORD_ID)).toHaveCount(0);
    await expect(page).toHaveTitle(/AsthmaTrack/);
    expect((await page.title()).includes(UNKNOWN_RECORD_ID)).toBe(false);
    expectNoPageErrors(pageErrors);
  });
});

test.describe("@semantics-medical", () => {
  test("search, read-only pages and inaccessible patients stay understandable", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const pageErrors = trackPageErrors(page);
    await page.goto("/equipe-medica");

    await expectTitle(page, "Área da equipe médica");
    await expectOneHeading(page, "Área da equipe médica");
    await expectMainLandmark(page);
    await expect(
      page.getByRole("navigation", { name: "Navegação da equipe médica" })
    ).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Início", exact: true })).toHaveAttribute(
      "aria-current",
      "page"
    );

    await page.goto("/equipe-medica/pacientes");
    await expectTitle(page, "Pacientes");
    await expectOneHeading(page, "Pacientes");
    await expect(page.getByRole("search", { name: "Buscar paciente" })).toBeVisible();
    const search = page.getByRole("searchbox", { name: "Buscar paciente" });
    await expect(search).toBeVisible();
    await expect(page.getByText("Somente leitura").first()).toBeVisible();

    await search.fill("zzzz-sem-resultado");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Nenhum paciente encontrado" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Limpar busca" }).first()).toBeVisible();
    await expectNoDuplicateIds(page);

    await page.goto("/equipe-medica/pacientes");
    const dashboard = page.getByRole("link", { name: "Ver dashboard" }).filter({ visible: true });
    if ((await dashboard.count()) > 0) {
      await dashboard.first().click();
      await expect(page.getByRole("heading", { level: 1, name: "Dashboard do paciente" })).toBeVisible({
        timeout: 30_000,
      });
      await expectTitle(page, "Dashboard do paciente");
      await expect(page.getByText("Somente leitura").first()).toBeVisible();
      for (const name of ["Novo registro", "Editar registro", "Excluir registro", "Salvar registro"]) {
        await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
      }
      await expect(page.getByRole("region", { name: "Evolução do PEF" })).toBeVisible();
      await page.getByRole("link", { name: "Ver relatório" }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Relatório de acompanhamento" })
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByText("Somente leitura").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Imprimir relatório" })).toHaveCount(0);

      await page.getByRole("link", { name: "Ver histórico" }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Histórico do paciente" })
      ).toBeVisible({ timeout: 30_000 });
      await expectOneHeading(page, "Histórico do paciente");
      await expect(page.getByText("Somente leitura").first()).toBeVisible();
    }

    await page.goto(`/equipe-medica/pacientes/${UNKNOWN_PATIENT_ID}`);
    await expectOneHeading(page, "Paciente não encontrado");
    await expectTitle(page, "Paciente não encontrado");
    await expect(page.getByText(UNKNOWN_PATIENT_ID)).toHaveCount(0);
    expect((await page.title()).includes(UNKNOWN_PATIENT_ID)).toBe(false);
    await expectNoDuplicateIds(page);
    expectNoPageErrors(pageErrors);
  });
});
