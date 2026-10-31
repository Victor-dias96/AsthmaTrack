import { expect, test, type Page } from "@playwright/test";

import {
  expectFocusIndicator,
  expectFocusWithin,
  expectFocusedHasIndicator,
  expectNoCredentialLeak,
  expectNoPositiveTabIndex,
  pressTabUntilFocused,
  trackHealthWrites,
} from "./keyboard-navigation.helpers";

const MAIN = "#conteudo-principal";

function visible(
  page: Page,
  role: "link" | "button" | "textbox" | "checkbox" | "searchbox" | "spinbutton",
  name: string | RegExp
) {
  return page
    .getByRole(role, typeof name === "string" ? { name, exact: true } : { name })
    .filter({ visible: true });
}

async function activateSkipLink(page: Page) {
  const skip = visible(page, "link", "Pular para o conteúdo");
  await pressTabUntilFocused(page, skip, {
    maxTabs: 3,
    description: "Pular para o conteúdo",
  });
  await expectFocusIndicator(page);
  await page.keyboard.press("Enter");
  await expect(page.locator(MAIN)).toBeFocused();
  await expectFocusIndicator(page);
}

async function submitNativeForm(page: Page) {
  await Promise.all([
    page.waitForEvent("framenavigated"),
    page.keyboard.press("Enter"),
  ]);
  await page.waitForLoadState("domcontentloaded");
}

async function expectQueryHasNoSecrets(page: Page) {
  const safe = await page.evaluate(() => {
    const url = new URL(window.location.href);
    return url.search === "" && url.hash === "";
  });
  expect(safe).toBe(true);
}

test.describe("@keyboard-public", () => {
  test("login follows a keyboard order, shows validation, and keeps a focus indicator", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
    await expectNoPositiveTabIndex(page);

    await activateSkipLink(page);
    await page.goto("/login");

    const order = [
      visible(page, "link", "Pular para o conteúdo"),
      visible(page, "textbox", "E-mail"),
      visible(page, "textbox", "Senha"),
      visible(page, "button", "Mostrar senha"),
      visible(page, "link", "Esqueci minha senha"),
      visible(page, "button", "Entrar"),
      visible(page, "link", "Criar conta"),
    ];

    for (const [index, control] of order.entries()) {
      await page.keyboard.press("Tab");
      await expectFocusedHasIndicator(page, control);

      if (index === 3) {
        await page.keyboard.press("Space");
        await expect(page.locator("#login-password")).toHaveAttribute("type", "text");
        await page.keyboard.press("Space");
        await expect(page.locator("#login-password")).toHaveAttribute("type", "password");
      }
    }

    for (const control of [...order].reverse().slice(1)) {
      await page.keyboard.press("Shift+Tab");
      await expect(control).toBeFocused();
    }

    await pressTabUntilFocused(page, visible(page, "button", "Entrar"), {
      description: "Entrar",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByText("Informe seu e-mail")).toBeVisible();
    await expect(page.getByText("Informe sua senha")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(visible(page, "link", "Criar conta")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(visible(page, "link", "Criar conta")).not.toBeFocused();
    await expectNoCredentialLeak(page);
  });

  test("a pre-hydration login submit does not put credentials in the URL", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      await page.goto("/login");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.type("keyboard-audit@example.invalid");
      await page.keyboard.press("Tab");
      await page.keyboard.type("not-a-real-password");
      await submitNativeForm(page);
      await expectQueryHasNoSecrets(page);
    } finally {
      await context.close();
    }
  });

  test("registration can be traversed and rejected without creating an account", async ({
    page,
  }) => {
    await page.goto("/cadastro");

    const order = [
      visible(page, "link", "Pular para o conteúdo"),
      visible(page, "textbox", "Nome completo"),
      visible(page, "textbox", "E-mail"),
      visible(page, "textbox", "Senha"),
      visible(page, "button", "Mostrar senha").first(),
      visible(page, "textbox", "Confirmar senha"),
      visible(page, "button", "Mostrar senha").nth(1),
      page.getByRole("checkbox", {
        name: "Li e aceito os Termos de Uso e a Política de Privacidade",
      }),
      visible(page, "button", "Criar conta"),
      visible(page, "link", "Entrar"),
    ];

    const terms = page.getByRole("checkbox", {
      name: "Li e aceito os Termos de Uso e a Política de Privacidade",
    });

    for (const control of order) {
      await page.keyboard.press("Tab");
      await expectFocusedHasIndicator(page, control);
    }

    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "button", "Criar conta")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(terms).toBeFocused();
    await page.keyboard.press("Space");
    await expect(terms).toBeChecked();
    await page.keyboard.press("Space");
    await expect(terms).not.toBeChecked();
    await page.keyboard.press("Tab");
    await expect(visible(page, "button", "Criar conta")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Informe seu nome completo")).toBeVisible();
    await expect(page.getByText("Informe seu e-mail")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(visible(page, "link", "Entrar")).toBeFocused();
    await expect(page).toHaveURL(/\/cadastro$/);
    await expectNoCredentialLeak(page);
  });

  test("a pre-hydration registration submit does not put credentials in the URL", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      await page.goto("/cadastro");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.type("Teclado Audit");
      await page.keyboard.press("Tab");
      await page.keyboard.type("keyboard-audit@example.invalid");
      await page.keyboard.press("Tab");
      await page.keyboard.type("not-a-real-password");
      await submitNativeForm(page);
      await expectQueryHasNoSecrets(page);
    } finally {
      await context.close();
    }
  });

  test("password recovery validates from the keyboard without sending mail", async ({
    page,
  }) => {
    await page.goto("/recuperar-senha");

    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Pular para o conteúdo"));
    await page.keyboard.press("Tab");
    const email = visible(page, "textbox", "E-mail");
    await expectFocusedHasIndicator(page, email);
    await page.keyboard.type("nao-e-email");
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(
      page,
      visible(page, "button", "Enviar link de recuperação")
    );
    await page.keyboard.press("Enter");
    await expect(page.getByText("Informe um e-mail válido")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(visible(page, "link", "Voltar ao login")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "button", "Enviar link de recuperação")).toBeFocused();
    await expectNoCredentialLeak(page);
  });

  test("password reset without a token stays on the safe initial state", async ({
    page,
  }) => {
    await page.goto("/redefinir-senha");
    await expect(
      page.getByText("Este link de recuperação é inválido ou expirou.")
    ).toBeVisible();
    await expect(page.locator("input[type='password']")).toHaveCount(0);

    await pressTabUntilFocused(page, visible(page, "link", "Solicitar novo link"), {
      description: "Solicitar novo link",
    });
    await expectFocusIndicator(page);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/recuperar-senha$/);
    await expectNoCredentialLeak(page);
  });

  test("the offline retry control is reachable from the keyboard", async ({
    page,
  }) => {
    await page.goto("/offline");
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Pular para o conteúdo"));
    await page.keyboard.press("Enter");
    await expect(page.locator(MAIN)).toBeFocused();

    await pressTabUntilFocused(page, visible(page, "button", "Tentar novamente"), {
      description: "Tentar novamente",
    });
    await expectFocusIndicator(page);
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Voltar ao início"));
    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "button", "Tentar novamente")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
  });
});

test.describe("@keyboard-patient", () => {
  test("dashboard navigation, periods, and logout are reachable without a mouse", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/dashboard");
    await expect(page.getByRole("heading", { name: /^Olá/ })).toBeVisible();
    await activateSkipLink(page);
    await page.goto("/paciente/dashboard");

    const sidebar = [
      visible(page, "link", "Pular para o conteúdo"),
      visible(page, "link", "Início"),
      visible(page, "link", "Novo registro"),
      visible(page, "link", "Histórico"),
      visible(page, "link", "Relatório"),
      visible(page, "link", "Configurações"),
      visible(page, "button", "Encerrar sessão"),
    ];

    for (const control of sidebar) {
      await page.keyboard.press("Tab");
      await expectFocusedHasIndicator(page, control);
    }

    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "link", "Configurações")).toBeFocused();

    const period = visible(page, "link", "30 dias");
    await pressTabUntilFocused(page, period, { description: "30 dias" });
    await expectFocusIndicator(page);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=30/);
    await expect
      .poll(async () => page.evaluate(() => document.activeElement !== document.body))
      .toBe(true);
    await expectFocusIndicator(page);
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(async () => page.evaluate(() => document.activeElement !== document.body))
      .toBe(true);

    await expect(visible(page, "link", "Registrar")).toHaveCount(0);
    await expectNoPositiveTabIndex(page);
    await pressTabUntilFocused(page, visible(page, "link", "Novo registro"), {
      description: "Novo registro",
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/paciente\/novo-registro$/);
    await expect
      .poll(async () => page.evaluate(() => document.activeElement !== document.body))
      .toBe(true);
    writes.finish();
  });

  test("the new record form validates from the keyboard and is not saved", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/novo-registro");
    const recordedAt = visible(page, "textbox", "Data e horário");
    await expect(recordedAt).toBeEnabled();

    await pressTabUntilFocused(page, recordedAt, { description: "Data e horário" });
    await expectFocusIndicator(page);
    const pef = visible(page, "spinbutton", /Pico de Fluxo Expiratório/);
    await pressTabUntilFocused(page, pef, {
      maxTabs: 8,
      description: "Pico de Fluxo Expiratório",
    });
    await expectFocusIndicator(page);

    const cough = page.getByRole("radiogroup", { name: "Tosse" });
    await pressTabUntilFocused(page, cough.getByRole("radio", { name: "Nenhuma" }), {
      description: "Tosse nenhuma",
    });
    await page.keyboard.press("ArrowRight");
    await expect(cough.getByRole("radio", { name: "Leve" })).toBeChecked();
    await expectFocusIndicator(page);

    const attack = page.getByRole("radiogroup", { name: "Teve uma crise de asma?" });
    await pressTabUntilFocused(page, attack.getByRole("radio", { name: "Não" }), {
      description: "crise Não",
    });
    await page.keyboard.press("ArrowRight");
    await expect(attack.getByRole("radio", { name: "Sim" })).toBeChecked();

    const rescue = page.getByRole("radiogroup", { name: "Usou medicação de alívio?" });
    await pressTabUntilFocused(page, rescue.getByRole("radio", { name: "Não" }), {
      description: "medicação Não",
    });
    await expectFocusIndicator(page);

    const notes = visible(page, "textbox", "Observações");
    await pressTabUntilFocused(page, notes, { description: "Observações" });
    await page.keyboard.type("x");
    const notesAccepted = await notes.evaluate(
      (element) => element instanceof HTMLTextAreaElement && element.value.length === 1
    );
    expect(notesAccepted).toBe(true);

    await pressTabUntilFocused(page, visible(page, "button", "Salvar registro"), {
      description: "Salvar registro",
    });
    await expect(visible(page, "button", "Salvar registro")).toBeEnabled();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Informe o valor de PEF")).toBeVisible();
    await pressTabUntilFocused(page, visible(page, "link", "Cancelar"), {
      description: "Cancelar",
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/paciente\/dashboard/);
    writes.finish();
  });

  test("history and record details are reachable in both directions", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/historico");
    const period = visible(page, "link", "Últimos 30 dias");
    await pressTabUntilFocused(page, period, { description: "Últimos 30 dias" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=30/);

    const details = page
      .getByRole("link", { name: /Ver detalhes do registro/ })
      .filter({ visible: true })
      .first();
    await expect(details).toBeVisible();
    await pressTabUntilFocused(page, details, { description: "Ver detalhes" });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Detalhes do registro" })).toBeVisible();

    await pressTabUntilFocused(page, visible(page, "link", "Editar registro"), {
      description: "Editar registro",
    });
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "button", "Excluir registro"));
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Voltar ao histórico"));
    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "button", "Excluir registro")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "link", "Editar registro")).toBeFocused();

    const nextPage = visible(page, "link", "Próxima");
    if ((await nextPage.count()) > 0) {
      await page.goto("/paciente/historico");
      await pressTabUntilFocused(page, nextPage, { description: "Próxima" });
      await expectFocusIndicator(page);
    }

    await expectNoPositiveTabIndex(page);
    writes.finish();
  });

  test("the edit form is reachable and Escape does not discard it", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/historico");
    const period = visible(page, "link", "Últimos 30 dias");
    await pressTabUntilFocused(page, period, { description: "Últimos 30 dias" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=30/);
    const details = page
      .getByRole("link", { name: /Ver detalhes do registro/ })
      .filter({ visible: true })
      .first();
    await pressTabUntilFocused(page, details, { description: "Ver detalhes" });
    await page.keyboard.press("Enter");
    await pressTabUntilFocused(page, visible(page, "link", "Editar registro"), {
      description: "Editar registro",
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/editar$/);
    await expect(page.getByRole("heading", { name: "Editar registro" })).toBeVisible();

    const pef = visible(page, "spinbutton", /Pico de Fluxo Expiratório/);
    await expect(pef).toBeEnabled();
    const keptValue = await pef.evaluate(
      (element) => element instanceof HTMLInputElement && element.value.trim().length > 0
    );
    expect(keptValue).toBe(true);

    await pressTabUntilFocused(page, pef, { description: "PEF" });
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/editar$/);
    const stillKept = await pef.evaluate(
      (element) => element instanceof HTMLInputElement && element.value.trim().length > 0
    );
    expect(stillKept).toBe(true);

    await pressTabUntilFocused(page, visible(page, "link", "Cancelar"), {
      description: "Cancelar",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Detalhes do registro" })).toBeVisible();
    writes.finish();
  });

  test("the delete dialog traps focus and restores it without deleting", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/historico");
    const period = visible(page, "link", "Últimos 30 dias");
    await pressTabUntilFocused(page, period, { description: "Últimos 30 dias" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=30/);
    const details = page
      .getByRole("link", { name: /Ver detalhes do registro/ })
      .filter({ visible: true })
      .first();
    await pressTabUntilFocused(page, details, { description: "Ver detalhes" });
    await page.keyboard.press("Enter");

    const trigger = visible(page, "button", "Excluir registro");
    await pressTabUntilFocused(page, trigger, { description: "Excluir registro" });
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expectFocusWithin(page, dialog);
    await expect(dialog.getByRole("button", { name: "Excluir registro" })).not.toBeFocused();

    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press("Tab");
      await expectFocusWithin(page, dialog);
    }
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press("Shift+Tab");
      await expectFocusWithin(page, dialog);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Space");
    await expect(dialog).toBeVisible();
    const cancel = dialog.getByRole("button", { name: "Cancelar" });
    await pressTabUntilFocused(page, cancel, { maxTabs: 4, description: "Cancelar" });
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    writes.finish();
  });

  test("report controls are reachable without printing or downloading", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/relatorio");
    await expect(page.getByText("Informação importante")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const period = visible(page, "link", "Últimos 7 dias");
    await pressTabUntilFocused(page, period, { description: "Últimos 7 dias" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=7/);
    await expectFocusIndicator(page);

    for (const name of ["Imprimir relatório", "Baixar PDF", "Compartilhar relatório"]) {
      const control = visible(page, "button", name);
      await pressTabUntilFocused(page, control, { description: name });
      await expectFocusIndicator(page);
      await expect(control).toBeEnabled();
    }

    writes.finish();
  });

  test("access management can open and cancel revocation without changing access", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/configuracoes/acessos");
    const code = visible(page, "textbox", "Código do profissional");
    await pressTabUntilFocused(page, code, { description: "Código do profissional" });
    await expectFocusIndicator(page);
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "button", "Buscar profissional"));
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Informe o código do profissional", { exact: true })
    ).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(code).not.toBeFocused();
    await expectNoCredentialLeak(page);

    const trigger = visible(page, "button", "Revogar acesso").first();
    await pressTabUntilFocused(page, trigger, { description: "Revogar acesso" });
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expectFocusWithin(page, dialog);
    await expect(dialog.getByRole("button", { name: "Revogar acesso" })).not.toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Space");
    await expect(dialog).toBeVisible();
    const cancel = dialog.getByRole("button", { name: "Cancelar" });
    await pressTabUntilFocused(page, cancel, { maxTabs: 4, description: "Cancelar" });
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    writes.finish();
  });

  test("settings expose the install action and logout without activating them", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/paciente/configuracoes");
    await expect(page.getByText("Você está offline")).toHaveCount(0);
    await expect(page.getByText("Nova versão disponível")).toHaveCount(0);

    const install = visible(page, "button", "Instalar AsthmaTrack");
    if ((await install.count()) > 0) {
      await pressTabUntilFocused(page, install, { description: "Instalar AsthmaTrack" });
      await expectFocusIndicator(page);
      await expect(install).toBeEnabled();
    } else {
      await expect(
        page.getByText("A instalação pode estar disponível pelo menu do navegador.")
      ).toBeVisible();
    }

    await pressTabUntilFocused(page, visible(page, "link", "Gerenciar acessos"), {
      description: "Gerenciar acessos",
    });
    await expectFocusIndicator(page);
    writes.finish();
  });

  test.describe("mobile navigation", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("the patient tab bar works without a mouse and stays out of the desktop tab order", async ({
      page,
    }) => {
      const writes = trackHealthWrites(page);
      await page.goto("/paciente/dashboard");
      await expect(visible(page, "link", "Novo registro")).toHaveCount(0);
      await expect(visible(page, "link", "Registrar")).toBeVisible();

      const registrar = visible(page, "link", "Registrar");
      await pressTabUntilFocused(page, registrar, { description: "Registrar" });
      await expectFocusIndicator(page);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/paciente\/novo-registro$/);
      await expect
        .poll(async () => page.evaluate(() => document.activeElement !== document.body))
        .toBe(true);

      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/\/paciente\/novo-registro$/);
      await page.keyboard.press("Tab");
      await expect
        .poll(async () => page.evaluate(() => document.activeElement !== document.body))
        .toBe(true);

      await page.goto("/paciente/dashboard");
      const config = visible(page, "link", "Config.");
      await pressTabUntilFocused(page, config, { description: "Config." });
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/paciente\/configuracoes$/);
      writes.finish();
    });
  });
});

test.describe("@keyboard-medical", () => {
  test("search, patient navigation, and read-only pages work from the keyboard", async ({
    page,
  }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/equipe-medica");
    await expect(
      page.getByRole("heading", { name: "Área da equipe médica" })
    ).toBeVisible();
    await activateSkipLink(page);
    await page.goto("/equipe-medica");
    await expect(
      page.getByRole("heading", { name: "Área da equipe médica" })
    ).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(visible(page, "link", "Pular para o conteúdo")).toBeFocused();
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Início"));
    await page.keyboard.press("Tab");
    await expectFocusedHasIndicator(page, visible(page, "link", "Pacientes"));
    await page.keyboard.press("Shift+Tab");
    await expect(visible(page, "link", "Início")).toBeFocused();

    await pressTabUntilFocused(page, visible(page, "link", "Ver pacientes"), {
      description: "Ver pacientes",
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/equipe-medica\/pacientes$/);

    const search = visible(page, "searchbox", "Buscar paciente");
    await pressTabUntilFocused(page, search, { description: "Buscar paciente" });
    await page.keyboard.type("zzzzkeyboard");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Nenhum paciente encontrado" })).toBeVisible();
    await pressTabUntilFocused(page, visible(page, "link", "Limpar busca").first(), {
      description: "Limpar busca",
    });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/equipe-medica\/pacientes$/);
    await expectNoCredentialLeak(page);

    const dashboard = visible(page, "link", "Ver dashboard").first();
    await expect(dashboard).toBeVisible();
    await expect(page.getByText("Somente leitura").filter({ visible: true }).first()).toBeVisible();
    await pressTabUntilFocused(page, dashboard, { description: "Ver dashboard" });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Dashboard do paciente" })).toBeVisible();
    await expect(page.getByText("Somente leitura").filter({ visible: true }).first()).toBeVisible();

    for (const name of [
      "Novo registro",
      "Editar registro",
      "Excluir registro",
      "Salvar registro",
    ]) {
      await expect(visible(page, "link", name)).toHaveCount(0);
      await expect(visible(page, "button", name)).toHaveCount(0);
    }

    const historyPeriod = visible(page, "link", /^Últimos 7 dias/).first();
    await pressTabUntilFocused(page, historyPeriod, { description: "Últimos 7 dias" });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/periodo=7/);

    await pressTabUntilFocused(page, visible(page, "link", "Ver histórico"), {
      description: "Ver histórico",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Histórico do paciente" })).toBeVisible();
    await expect(page.getByText("Somente leitura").filter({ visible: true }).first()).toBeVisible();

    await pressTabUntilFocused(page, visible(page, "link", "Voltar para o dashboard"), {
      description: "Voltar para o dashboard",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Dashboard do paciente" })).toBeVisible();
    await pressTabUntilFocused(page, visible(page, "link", "Ver relatório"), {
      description: "Ver relatório",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByText("Somente leitura").filter({ visible: true }).first()).toBeVisible();
    await expect(visible(page, "button", "Imprimir relatório")).toHaveCount(0);
    await expect(visible(page, "button", "Baixar PDF")).toHaveCount(0);
    await expect(visible(page, "button", "Compartilhar relatório")).toHaveCount(0);

    await pressTabUntilFocused(page, visible(page, "link", "Voltar para o dashboard"), {
      description: "Voltar para o dashboard",
    });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Dashboard do paciente" })).toBeVisible();
    await expectNoPositiveTabIndex(page);
    writes.finish();
  });

  test("logout is reachable and is not activated", async ({ page }) => {
    const writes = trackHealthWrites(page);
    await page.goto("/equipe-medica/pacientes");
    await pressTabUntilFocused(page, visible(page, "button", "Encerrar sessão"), {
      description: "Encerrar sessão",
    });
    await expectFocusIndicator(page);
    await expect(page).toHaveURL(/\/equipe-medica\/pacientes/);
    writes.finish();
  });

  test.describe("mobile navigation", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("the medical tab bar opens patient search without a mouse", async ({
      page,
    }) => {
      const writes = trackHealthWrites(page);
      await page.goto("/equipe-medica");
      await expect(page.getByRole("navigation", { name: "Menu lateral" })).toBeHidden();

      const patients = visible(page, "link", "Pacientes");
      await pressTabUntilFocused(page, patients, { description: "Pacientes" });
      await expectFocusIndicator(page);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/equipe-medica\/pacientes$/);

      const search = visible(page, "searchbox", "Buscar paciente");
      await pressTabUntilFocused(page, search, { description: "Buscar paciente" });
      await page.keyboard.press("Escape");
      await expect(search).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(search).not.toBeFocused();
      await expect(page.getByText("Somente leitura").filter({ visible: true }).first()).toBeVisible();
      writes.finish();
    });
  });
});
