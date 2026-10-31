import { expect, test, type Page } from "@playwright/test";

import { pressTabUntilFocused, trackHealthWrites } from "./keyboard-navigation.helpers";
import {
  expectBorderContrast,
  expectContrast,
  expectFocusContrast,
  expectNoPageErrors,
  expectUnderline,
  trackPageErrors,
  visible,
} from "./visual-feedback.helpers";

async function expectChartOrEmpty(page: Page) {
  const grid = page.locator(".recharts-cartesian-grid line");
  const empty = page.getByText(
    /Registre medições para acompanhar a evolução do PEF|Não foi possível exibir as medições de PEF deste período|Uma medição disponível/
  );

  if ((await grid.count()) > 0) {
    await expectContrast(grid.first(), 3, "chart gridline", "stroke");
    const tick = page.locator(".recharts-cartesian-axis-tick text").first();
    await expectContrast(tick, 4.5, "chart axis label", "fill");
    return;
  }

  await expect(empty.first()).toBeVisible();
  await expectContrast(empty.first(), 4.5, "chart empty or single-point text");
}

test.describe("@visual-public", () => {
  test("login text, links, fields, buttons and validation meet contrast", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/login");

    await expectContrast(
      page.getByRole("heading", { level: 1, name: "Entrar" }),
      4.5,
      "login title"
    );
    await expectContrast(
      page.getByText("Acesse sua conta para continuar"),
      4.5,
      "login description"
    );

    const email = visible(page, "textbox", "E-mail");
    await email.evaluate((element) => {
      element.style.setProperty(
        "color",
        getComputedStyle(element, "::placeholder").color
      );
    });
    await expectContrast(email, 4.5, "login placeholder");
    await email.evaluate((element) => {
      element.style.removeProperty("color");
    });
    await expectBorderContrast(email, 3, "login input");

    const forgot = visible(page, "link", "Esqueci minha senha");
    const createAccount = visible(page, "link", "Criar conta");
    await expectUnderline(forgot);
    await expectUnderline(createAccount);
    await expectContrast(forgot, 4.5, "recovery link");
    await expectContrast(createAccount, 4.5, "registration link");
    const privacy = page
      .getByRole("alert")
      .filter({ hasText: "Seus dados são armazenados com segurança" });
    await expect(privacy.locator("svg")).toHaveCount(1);
    await expectContrast(privacy, 4.5, "login notice");

    const submit = visible(page, "button", "Entrar");
    await expectContrast(submit, 4.5, "primary button");
    await pressTabUntilFocused(page, email, { description: "E-mail" });
    await expectFocusContrast(email, "login field");
    await pressTabUntilFocused(page, submit, { description: "Entrar" });
    await expectFocusContrast(submit, "primary button");

    await submit.click();
    const error = page.getByRole("alert").filter({ hasText: "Informe seu e-mail" });
    await expect(error).toBeVisible();
    await expect(error.locator("svg")).toHaveCount(1);
    await expectContrast(error, 4.5, "validation error");
    await expectBorderContrast(email, 3, "invalid input");
    await pressTabUntilFocused(page, email, { description: "invalid email" });
    await expectFocusContrast(email, "invalid field");
    expectNoPageErrors(pageErrors);
  });

  test("registration validation shows a readable error without creating an account", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/cadastro");
    await visible(page, "button", "Criar conta").click();

    const error = page.getByRole("alert").filter({ hasText: "Informe seu nome completo" });
    await expect(error).toBeVisible();
    await expect(error.locator("svg")).toHaveCount(1);
    await expectContrast(error, 4.5, "registration error");
    await expectUnderline(visible(page, "link", "Entrar"));
    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("the offline fallback is readable and does not use color as the only cue", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await page.goto("/offline");

    const heading = page.getByRole("heading", { level: 1, name: "Sem conexão" });
    await expect(heading).toBeVisible();
    await expectContrast(heading, 4.5, "offline title");
    await expectContrast(
      page.getByText("Verifique sua conexão e tente novamente."),
      4.5,
      "offline description"
    );
    await expect(page.locator("svg").first()).toBeVisible();
    const retry = visible(page, "button", "Tentar novamente");
    const home = visible(page, "link", "Voltar ao início");
    await expectContrast(retry, 4.5, "offline retry");
    await expectContrast(home, 4.5, "offline home link");
    await expectBorderContrast(home, 3, "offline secondary action");
    await pressTabUntilFocused(page, retry, { description: "Tentar novamente" });
    await expectFocusContrast(retry, "offline retry");
    expectNoPageErrors(pageErrors);
  });

  test("forced colors keep the login field and its focus visible", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/login");
    const email = visible(page, "textbox", "E-mail");
    await pressTabUntilFocused(page, email, { description: "E-mail" });

    const paint = await email.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        borderWidth: Number.parseFloat(style.borderTopWidth),
      };
    });

    expect(paint.outlineStyle).not.toBe("none");
    expect(paint.outlineWidth).toBeGreaterThan(0);
    expect(paint.borderWidth).toBeGreaterThan(0);
    await expectUnderline(visible(page, "link", "Criar conta"));
    expectNoPageErrors(pageErrors);
  });
});

test.describe("@visual-patient", () => {
  test("dashboard cards, navigation and the chart stay readable", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/dashboard");

    await expectContrast(
      page.getByRole("heading", { name: /^Olá/ }),
      4.5,
      "dashboard greeting"
    );
    const latest = page.getByRole("heading", { name: "Último PEF" });
    await expectContrast(latest, 4.5, "dashboard card title");
    await expectChartOrEmpty(page);

    const home = visible(page, "link", "Início");
    await expectContrast(home, 4.5, "active navigation");
    const activeCue = await home.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(activeCue).not.toBe("none");

    const selectedPeriod = page
      .getByRole("link", { name: /dias/ })
      .and(page.locator("[aria-current='page']"));
    await expect(selectedPeriod).toBeVisible();
    await expectContrast(selectedPeriod, 4.5, "selected period");
    const weight = await selectedPeriod.evaluate((element) =>
      Number.parseInt(getComputedStyle(element).fontWeight, 10)
    );
    expect(weight).toBeGreaterThanOrEqual(600);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileHome = page
      .getByRole("navigation", { name: "Navegação do paciente" })
      .getByRole("link", { name: "Início" });
    await expect(mobileHome).toBeVisible();
    const mobileCue = await mobileHome.evaluate((element) => {
      const label = element.querySelector("span:last-child");
      return label instanceof HTMLElement
        ? getComputedStyle(label).textDecorationLine
        : "";
    });
    expect(mobileCue).toContain("underline");
    await expectContrast(mobileHome, 4.5, "mobile navigation");

    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("an invalid new record shows a readable error and is not saved", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/novo-registro");
    await visible(page, "button", "Salvar registro").click();

    const error = page.getByRole("alert").filter({ hasText: "Informe o valor de PEF" });
    await expect(error).toBeVisible();
    await expect(error.locator("svg")).toHaveCount(1);
    await expectContrast(error, 4.5, "PEF validation");
    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("history metadata, record actions and delete confirmation stay readable", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/historico");
    await expectContrast(
      page.getByRole("heading", { level: 1, name: "Histórico" }),
      4.5,
      "history title"
    );
    await expectContrast(
      page.getByText("Consulte os registros de PEF e sintomas que você salvou anteriormente."),
      4.5,
      "history description"
    );
    const emptyPeriod = page.getByRole("heading", {
      name: "Nenhum registro nos últimos 7 dias",
    });
    if (await emptyPeriod.isVisible()) {
      await expectContrast(emptyPeriod, 4.5, "empty period title");
      await expectContrast(
        page.getByText("Não encontramos registros neste período."),
        4.5,
        "empty period description"
      );
    }

    await visible(page, "link", "Últimos 30 dias").click();
    await expect(page).toHaveURL(/periodo=30/);

    const details = page
      .getByRole("link", { name: /Ver detalhes do registro/ })
      .filter({ visible: true })
      .first();
    await expect(details).toBeVisible();
    await expectContrast(details, 4.5, "record details action");
    await expectBorderContrast(details, 3, "record details action");
    await details.click();

    await expectContrast(
      page.getByRole("heading", { name: "Detalhes do registro" }),
      4.5,
      "record title"
    );
    await expectContrast(
      page.getByText("Consulte os dados completos deste registro de PEF e sintomas."),
      4.5,
      "record description"
    );

    await visible(page, "button", "Excluir registro").click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("heading", { name: "Excluir este registro?" })).toBeVisible();
    await expectContrast(dialog.getByRole("heading"), 4.5, "delete dialog title");
    await expectContrast(
      dialog.getByText("Esta ação não pode ser desfeita. O registro será removido permanentemente."),
      4.5,
      "delete dialog description"
    );
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { name: "Detalhes do registro" })).toBeVisible();
    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("the report stays readable", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/relatorio");
    await expectContrast(
      page.getByRole("heading", { level: 1, name: "Relatório" }),
      4.5,
      "report title"
    );
    await expectChartOrEmpty(page);
    await expectContrast(
      page.getByRole("heading", { name: "Informação importante" }),
      4.5,
      "report notice"
    );
    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("the access notice stays readable", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/configuracoes/acessos");
    const accessNotice = page
      .getByRole("alert")
      .filter({ hasText: "Este acesso será somente para consulta." });
    await expect(accessNotice).toBeVisible();
    await expect(accessNotice.locator("svg")).toHaveCount(1);
    await expectContrast(accessNotice, 4.5, "access notice");
    writes.finish();
    expectNoPageErrors(pageErrors);
  });
});

test.describe("@visual-medical", () => {
  test("navigation, search and no-results stay distinct and readable", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/equipe-medica");
    await expectContrast(
      page.getByRole("heading", { name: "Área da equipe médica" }),
      4.5,
      "medical home title"
    );
    const home = visible(page, "link", "Início");
    await expectContrast(home, 4.5, "medical active navigation");
    const activeCue = await home.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(activeCue).not.toBe("none");

    await page.goto("/equipe-medica/pacientes?q=sem-resultado-visual");
    const noResults = page.getByRole("heading", { name: "Nenhum paciente encontrado" });
    await expect(noResults).toBeVisible();
    await expectContrast(noResults, 4.5, "no-results title");
    await expectContrast(
      page.getByText("Não encontramos pacientes autorizados com esse nome."),
      4.5,
      "no-results description"
    );
    await expect(visible(page, "link", "Limpar busca").first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/equipe-medica/pacientes");
    const mobilePatients = page
      .getByRole("navigation", { name: "Navegação da equipe médica" })
      .getByRole("link", { name: "Pacientes" });
    await expect(mobilePatients).toBeVisible();
    const mobileCue = await mobilePatients.evaluate((element) => {
      const label = element.querySelector("span:last-child");
      return label instanceof HTMLElement
        ? getComputedStyle(label).textDecorationLine
        : "";
    });
    expect(mobileCue).toContain("underline");
    writes.finish();
    expectNoPageErrors(pageErrors);
  });

  test("read-only patient views and an inaccessible patient stay readable", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    const writes = trackHealthWrites(page);
    await page.goto("/equipe-medica/pacientes");
    const dashboard = visible(page, "link", "Ver dashboard").first();
    await expect(dashboard).toBeVisible();
    await expectUnderline(dashboard);
    await expect(page.getByText("Somente leitura").first()).toBeVisible();
    await expectContrast(page.getByText("Somente leitura").first(), 4.5, "read-only label");
    await dashboard.click();

    await expectContrast(
      page.getByRole("heading", { name: "Dashboard do paciente" }),
      4.5,
      "medical dashboard title"
    );
    await expectContrast(
      page.getByText("Visualização em modo somente leitura dos registros autorizados."),
      4.5,
      "read-only description"
    );
    await expectChartOrEmpty(page);

    await visible(page, "link", "Ver histórico").click();
    await expectContrast(
      page.getByRole("heading", { name: "Histórico do paciente" }),
      4.5,
      "medical history title"
    );
    await page.goBack();
    await visible(page, "link", "Ver relatório").click();
    await expectContrast(
      page.getByRole("heading", { name: "Relatório de acompanhamento" }),
      4.5,
      "medical report title"
    );

    await page.goto("/equipe-medica/pacientes/nao-autorizado");
    await expectContrast(
      page.getByRole("heading", { name: "Paciente não encontrado" }),
      4.5,
      "inaccessible title"
    );
    await expectContrast(
      page.getByText("Não foi possível acessar este paciente."),
      4.5,
      "inaccessible description"
    );
    await expect(page.getByText("Volte para a lista de pacientes autorizados.")).toBeVisible();
    writes.finish();
    expectNoPageErrors(pageErrors);
  });
});
