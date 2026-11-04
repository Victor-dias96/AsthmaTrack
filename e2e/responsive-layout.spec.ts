import { expect, test, type Locator, type Page } from "@playwright/test";

const MAIN = "#conteudo-principal";
const UNKNOWN_PATIENT_ID = "00000000-0000-4000-8000-000000000099";
const UNKNOWN_RECORD_ID = "00000000-0000-4000-8000-000000000088";
const PATIENT_NAV = "Navegação do paciente";
const MEDICAL_NAV = "Navegação da equipe médica";
const TOUCH_MIN = 44;

type Box = { x: number; y: number; width: number; height: number };

function trackSafety(page: Page) {
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
    const supabaseApi =
      url.pathname.startsWith("/auth/v1") ||
      url.pathname.startsWith("/rest/v1");

    if (supabaseApi && !loopback) {
      usedNonLoopbackSupabase = true;
    }

    const method = request.method();
    const mutates = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
    const healthTable = [
      "/rest/v1/daily_records",
      "/rest/v1/patient_access_authorizations",
      "/rest/v1/profiles",
    ].some((path) => url.pathname.includes(path));

    if (mutates && healthTable) {
      mutations.push(`${method} ${url.pathname}`);
    }
  });

  return {
    finish() {
      expect(pageErrors, pageErrors.join("\n")).toEqual([]);
      expect(mutations, "Responsive checks must not write health data.").toEqual(
        []
      );
      expect(usedNonLoopbackSupabase).toBe(false);
    },
  };
}

async function expectPageFits(page: Page, label: string) {
  const report = await page.evaluate(() => {
    const root = document.documentElement;
    const pageOverflow = root.scrollWidth - root.clientWidth;
    const bodyOverflow = document.body.scrollWidth - root.clientWidth;
    const offenders: { descriptor: string; overflow: number }[] = [];

    if (pageOverflow > 1 || bodyOverflow > 1) {
      for (const node of document.querySelectorAll("body *")) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }

        if (node.closest(".recharts-wrapper, .recharts-surface")) {
          continue;
        }

        const style = getComputedStyle(node);

        if (style.display === "none" || style.visibility === "hidden") {
          continue;
        }

        const rect = node.getBoundingClientRect();

        if (rect.width <= 1 || rect.height <= 1) {
          continue;
        }

        const overflow = Math.max(rect.right - root.clientWidth, -rect.left, 0);

        if (overflow <= 1) {
          continue;
        }

        const id = node.id ? `#${node.id}` : "";
        const role = node.getAttribute("role");
        const owner = node.closest("[id]");
        const ownerId =
          owner instanceof HTMLElement && owner !== node && owner.id
            ? ` in #${owner.id}`
            : "";

        offenders.push({
          descriptor: `${node.tagName.toLowerCase()}${id}${
            role ? `[role=${role}]` : ""
          }${ownerId}`,
          overflow: Math.round(overflow),
        });
      }

      offenders.sort((left, right) => right.overflow - left.overflow);
    }

    return {
      pageOverflow,
      bodyOverflow,
      offenders: offenders.slice(0, 5),
    };
  });

  const detail = report.offenders
    .map((item) => `${item.descriptor} ${item.overflow}px`)
    .join(", ");

  expect(
    Math.max(report.pageOverflow, report.bodyOverflow),
    `${label} horizontal overflow. Widest: ${detail || "none identified"}`
  ).toBeLessThanOrEqual(1);
}

async function openAt(
  page: Page,
  width: number,
  height: number,
  path: string
) {
  await page.setViewportSize({ width, height });
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await expectPageFits(page, `${width}x${height} ${path}`);
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box, "Expected a visible box.").not.toBeNull();
  return box as Box;
}

async function expectTargetAtLeast(locator: Locator, label: string) {
  await expect(locator, label).toBeVisible();
  const box = await boxOf(locator);
  expect(box.width, `${label} width ${box.width}`).toBeGreaterThanOrEqual(
    TOUCH_MIN - 0.5
  );
  expect(box.height, `${label} height ${box.height}`).toBeGreaterThanOrEqual(
    TOUCH_MIN - 0.5
  );
}

async function expectInsideViewport(page: Page, locator: Locator, label: string) {
  const viewport = page.viewportSize();
  expect(viewport, "Viewport is required.").not.toBeNull();
  const box = await boxOf(locator);
  expect(box.x, `${label} left`).toBeGreaterThanOrEqual(-1);
  expect(box.y, `${label} top`).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, `${label} right`).toBeLessThanOrEqual(
    viewport!.width + 1
  );
  expect(box.y + box.height, `${label} bottom`).toBeLessThanOrEqual(
    viewport!.height + 1
  );
}

function overlaps(first: Box, second: Box) {
  return (
    first.x < second.x + second.width - 1 &&
    first.x + first.width > second.x + 1 &&
    first.y < second.y + second.height - 1 &&
    first.y + first.height > second.y + 1
  );
}

async function expectAboveNavigation(
  page: Page,
  target: Locator,
  navName: string,
  label: string
) {
  await target.scrollIntoViewIfNeeded();
  const targetBox = await boxOf(target);
  const navBox = await boxOf(page.getByRole("navigation", { name: navName }));
  expect(
    targetBox.y + targetBox.height,
    `${label} is covered by navigation.`
  ).toBeLessThanOrEqual(navBox.y + 1);
}

async function expectReachableAtTop(page: Page, locator: Locator, label: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await boxOf(locator);
  expect(box.y, `${label} is clipped above the scroll origin.`).toBeGreaterThanOrEqual(
    -1
  );
}

async function expectChartFits(page: Page, label: string) {
  const region = page.getByRole("region", { name: "Evolução do PEF" });
  await expect(region).toBeVisible();
  const metrics = await region.evaluate((element) => {
    const rootWidth = document.documentElement.clientWidth;
    const regionRect = element.getBoundingClientRect();
    const svg = element.querySelector("svg");
    const svgRect = svg?.getBoundingClientRect();
    const wrapper = element.querySelector(".recharts-wrapper");
    const wrapperRect = wrapper?.getBoundingClientRect();

    return {
      regionRight: regionRect.right,
      regionWidth: regionRect.width,
      rootWidth,
      svgWidth: svgRect?.width ?? null,
      wrapperWidth: wrapperRect?.width ?? null,
    };
  });

  expect(metrics.regionRight, `${label} chart region`).toBeLessThanOrEqual(
    metrics.rootWidth + 1
  );

  if (metrics.wrapperWidth !== null) {
    expect(metrics.wrapperWidth, `${label} chart wrapper`).toBeLessThanOrEqual(
      metrics.regionWidth + 1
    );
  }

  if (metrics.svgWidth !== null) {
    expect(metrics.svgWidth, `${label} chart svg`).toBeLessThanOrEqual(
      (metrics.wrapperWidth ?? metrics.regionWidth) + 1
    );
  }
}

function requireProfessionalCode(): string {
  const value = process.env.E2E_MEDICAL_A_PROFESSIONAL_CODE ?? "";

  if (!/^[A-Z2-9]{8}$/.test(value)) {
    throw new Error(
      "E2E_MEDICAL_A_PROFESSIONAL_CODE is not an 8-character professional code. The value was not printed."
    );
  }

  return value;
}

test.describe("@responsive-public", () => {
  test("public pages fit the representative viewport matrix", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);
    const matrix: { width: number; height: number; paths: string[] }[] = [
      {
        width: 320,
        height: 568,
        paths: [
          "/login",
          "/cadastro",
          "/recuperar-senha",
          "/offline",
          "/onboarding",
          "/pagina-inexistente",
        ],
      },
      { width: 360, height: 800, paths: ["/login", "/cadastro"] },
      { width: 390, height: 844, paths: ["/redefinir-senha", "/recuperar-senha"] },
      { width: 844, height: 390, paths: ["/login", "/cadastro", "/offline"] },
      { width: 768, height: 1024, paths: ["/login", "/onboarding"] },
      { width: 1024, height: 768, paths: ["/cadastro", "/login"] },
      { width: 1280, height: 800, paths: ["/login", "/recuperar-senha"] },
      { width: 1440, height: 900, paths: ["/login"] },
      { width: 1280, height: 600, paths: ["/login", "/cadastro", "/offline"] },
      { width: 640, height: 400, paths: ["/login", "/cadastro", "/offline"] },
    ];

    for (const viewport of matrix) {
      for (const path of viewport.paths) {
        await openAt(page, viewport.width, viewport.height, path);
      }
    }

    safety.finish();
  });

  test("narrow and short public forms keep actions reachable", async ({
    page,
  }) => {
    const safety = trackSafety(page);

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/login");
    await expectReachableAtTop(
      page,
      page.getByRole("heading", { level: 1, name: "Entrar" }),
      "Login heading"
    );
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Informe seu e-mail")).toBeVisible();
    await expect(page.getByText("Informe sua senha")).toBeVisible();
    await expectPageFits(page, "login validation 320");

    const alert = page.getByRole("alert").first();
    await alert.evaluate((element) => {
      const text = element.querySelector("span");
      if (text) {
        text.textContent =
          "MensagemDeValidacaoFicticiaMuitoLonga ".repeat(6) +
          "precisa continuar legível na largura mínima.";
      }
    });
    await expectPageFits(page, "long login validation 320");

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/cadastro");
    await expectReachableAtTop(
      page,
      page.getByRole("heading", { level: 1, name: "Criar conta" }),
      "Registration heading"
    );
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Informe seu nome completo")).toBeVisible();
    await expectPageFits(page, "registration validation 320");
    const submit = page.getByRole("button", { name: "Criar conta" });
    await submit.scrollIntoViewIfNeeded();
    await expectInsideViewport(page, submit, "Registration submit");

    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/cadastro");
    await expectReachableAtTop(
      page,
      page.getByRole("heading", { level: 1, name: "Criar conta" }),
      "Landscape registration heading"
    );
    await page.getByRole("button", { name: "Criar conta" }).scrollIntoViewIfNeeded();
    await expectInsideViewport(
      page,
      page.getByRole("button", { name: "Criar conta" }),
      "Landscape registration submit"
    );
    await expectPageFits(page, "registration landscape");

    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto("/offline");
    const retry = page.getByRole("button", { name: "Tentar novamente" });
    await retry.scrollIntoViewIfNeeded();
    await expectInsideViewport(page, retry, "Offline retry");
    await expectPageFits(page, "offline reduced height");

    safety.finish();
  });

  test("public touch targets and password control fit a phone", async ({
    page,
  }) => {
    const safety = trackSafety(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/login");

    await expectTargetAtLeast(
      page.getByRole("button", { name: "Mostrar senha" }),
      "Password visibility"
    );
    await expectTargetAtLeast(
      page.getByRole("button", { name: "Entrar" }),
      "Login submit"
    );
    const passwordButton = await boxOf(
      page.getByRole("button", { name: "Mostrar senha" })
    );
    const passwordField = await boxOf(page.locator("#login-password"));
    expect(passwordButton.x).toBeGreaterThanOrEqual(passwordField.x - 1);
    expect(passwordButton.x + passwordButton.width).toBeLessThanOrEqual(
      passwordField.x + passwordField.width + 1
    );

    await page.goto("/cadastro");
    await expectTargetAtLeast(
      page.locator("label[for='register-terms']"),
      "Terms checkbox label"
    );
    await expectTargetAtLeast(
      page.getByRole("button", { name: "Criar conta" }),
      "Registration submit"
    );
    await expectPageFits(page, "registration touch");

    const safeArea = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        let rules: CSSRuleList;

        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }

        for (const rule of rules) {
          if (
            rule instanceof CSSStyleRule &&
            rule.selectorText === ".safe-area-inset-bottom"
          ) {
            return rule.style.paddingBottom;
          }
        }
      }

      return "";
    });
    expect(safeArea).toContain("safe-area-inset-bottom");

    safety.finish();
  });
});

test.describe("@responsive-patient", () => {
  test("patient pages fit a 320px phone", async ({ page }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);
    await page.setViewportSize({ width: 320, height: 568 });

    for (const path of [
      "/paciente/dashboard",
      "/paciente/novo-registro",
      "/paciente/historico",
      "/paciente/relatorio",
      "/paciente/configuracoes",
      "/paciente/configuracoes/acessos",
      `/paciente/historico/${UNKNOWN_RECORD_ID}`,
    ]) {
      await page.goto(path);
      await expect(page.locator(MAIN)).toBeVisible();
      await expect(page.getByRole("navigation", { name: PATIENT_NAV })).toBeVisible();
      await expect(page.getByRole("complementary", { name: "Menu lateral" })).toBeHidden();
      await expect(
        page.getByRole("link", { name: "Config.", exact: true })
      ).toBeVisible();
      await expectPageFits(page, `320 ${path}`);
    }

    await page.goto("/paciente/dashboard");
    await page.getByRole("link", { name: "30 dias", exact: true }).click();
    await expect(page).toHaveURL(/periodo=30/);
    await expectPageFits(page, "320 dashboard period");
    await expectChartFits(page, "320 dashboard");

    await page.goto("/paciente/novo-registro");
    await page.getByRole("button", { name: "Salvar registro" }).click();
    await expect(page.getByText("Informe o valor de PEF")).toBeVisible();
    await expect(page).toHaveURL(/\/paciente\/novo-registro/);
    await expectPageFits(page, "320 invalid record form");
    await expectAboveNavigation(
      page,
      page.getByRole("button", { name: "Salvar registro" }),
      PATIENT_NAV,
      "Save record"
    );
    await expectAboveNavigation(
      page,
      page.getByRole("link", { name: "Cancelar" }),
      PATIENT_NAV,
      "Cancel record"
    );

    await page.goto("/paciente/historico");
    const details = page.getByRole("link", { name: /Ver detalhes do registro de/ });

    if ((await details.count()) > 0) {
      await details.first().click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Detalhes do registro" })
      ).toBeVisible();
      await expectPageFits(page, "320 record details");
      await page.getByRole("button", { name: "Excluir registro" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();
      await expectInsideViewport(page, dialog, "Delete dialog");
      await expectInsideViewport(
        page,
        dialog.getByRole("button", { name: "Cancelar" }),
        "Delete cancel"
      );
      await expectPageFits(page, "320 delete dialog");
      await dialog.getByRole("button", { name: "Cancelar" }).click();
      await expect(dialog).toBeHidden();

      await page.getByRole("link", { name: "Editar registro" }).click();
      await expect(page).toHaveURL(/\/editar$/);
      const pef = page.getByRole("spinbutton", {
        name: /Pico de Fluxo Expiratório/,
      });
      await expect(pef).toBeVisible();
      expect((await pef.inputValue()).length).toBeGreaterThan(0);
      await expectPageFits(page, "320 edit record");
      await page.getByRole("link", { name: "Cancelar" }).click();
      await expect(page).not.toHaveURL(/\/editar$/);
    } else {
      await expect(page.getByRole("heading", { name: /Nenhum registro/ })).toBeVisible();
      await expectPageFits(page, "320 empty history");
    }

    safety.finish();
  });

  test("patient shell adapts across tablet, desktop, landscape, and zoom proxy", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);
    const sizes = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1280, height: 600 },
      { width: 640, height: 400 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/paciente/dashboard");
      await expect(page.locator(MAIN)).toBeVisible();

      if (size.width < 1024) {
        await expect(page.getByRole("navigation", { name: PATIENT_NAV })).toBeVisible();
        await expect(
          page.getByRole("complementary", { name: "Menu lateral" })
        ).toBeHidden();
      } else {
        const aside = await boxOf(
          page.getByRole("complementary", { name: "Menu lateral" })
        );
        const main = await boxOf(page.locator(MAIN));
        expect(aside.x + aside.width).toBeLessThanOrEqual(main.x + 1);
        expect(overlaps(aside, main)).toBe(false);
        const displays = await page
          .locator(`nav[aria-label="${PATIENT_NAV}"]`)
          .evaluateAll((nodes) =>
            nodes.map((node) => getComputedStyle(node).display)
          );
        expect(displays).toContain("none");
      }

      await expectPageFits(page, `${size.width}x${size.height} dashboard`);
    }

    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto("/paciente/historico");
    const details = page.getByRole("link", { name: /Ver detalhes do registro de/ });

    if ((await details.count()) > 0) {
      await details.first().click();
      await page.getByRole("button", { name: "Excluir registro" }).click();
      const dialog = page.getByRole("alertdialog");
      await expectInsideViewport(page, dialog, "Short delete dialog");
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }

    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/paciente/novo-registro");
    await expectPageFits(page, "landscape record form");
    await expectAboveNavigation(
      page,
      page.getByRole("button", { name: "Salvar registro" }),
      PATIENT_NAV,
      "Landscape save"
    );

    safety.finish();
  });

  test("patient touch targets, charts, notices, and print stay usable", async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/paciente/dashboard");
    for (const name of ["Início", "Registrar", "Histórico", "Relatório", "Config."]) {
      await expectTargetAtLeast(
        page.getByRole("link", { name, exact: true }),
        `Patient nav ${name}`
      );
    }
    await expectTargetAtLeast(
      page.getByRole("link", { name: "7 dias", exact: true }),
      "Dashboard period"
    );
    const navLinks = ["Início", "Registrar", "Histórico", "Relatório", "Config."];
    const navBoxes = [];
    for (const name of navLinks) {
      navBoxes.push(
        await boxOf(page.getByRole("link", { name, exact: true }))
      );
    }
    for (let index = 0; index < navBoxes.length - 1; index += 1) {
      expect(overlaps(navBoxes[index], navBoxes[index + 1])).toBe(false);
    }

    await page.goto("/paciente/relatorio");
    await expectTargetAtLeast(
      page.getByRole("button", { name: "Imprimir relatório" }),
      "Print report"
    );
    await expectChartFits(page, "360 report");

    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/paciente/dashboard");
      await expectChartFits(page, `${width} dashboard chart`);
      await page.goto("/paciente/relatorio");
      await expectChartFits(page, `${width} report chart`);
      await expectPageFits(page, `${width} report`);
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/paciente/configuracoes");
    const install = page.getByRole("heading", { name: "Aplicativo" });
    if (await install.count()) {
      await expectPageFits(page, "320 install card");
      const action = page.getByRole("button", { name: /Adicionar|Instalar|aplicativo/i });
      if (await action.count()) {
        await expectTargetAtLeast(action.first(), "PWA install action");
        await expectAboveNavigation(page, action.first(), PATIENT_NAV, "PWA install");
      }
    }

    await page.goto("/paciente/dashboard");
    try {
      await context.setOffline(true);
      await expect(page.getByText("Você está offline")).toBeVisible();
      const notice = page.getByRole("status").filter({
        hasText: "Você está offline",
      });
      const nav = page.getByRole("navigation", { name: PATIENT_NAV });
      expect(overlaps(await boxOf(notice), await boxOf(nav))).toBe(false);
      await expectPageFits(page, "offline notice");
    } finally {
      await context.setOffline(false);
    }

    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.goto("/paciente/relatorio");
    const patientNavDisplays = await page
      .locator(`nav[aria-label="${PATIENT_NAV}"]`)
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).display));
    expect(patientNavDisplays.length).toBeGreaterThan(0);
    expect(patientNavDisplays.every((display) => display === "none")).toBe(true);
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Imprimir relatório" })).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Evolução do PEF" })
    ).toBeVisible();
    await expectPageFits(page, "print report");
    await page.emulateMedia({ media: "screen" });

    safety.finish();
  });

  test("focused record fields stay above the mobile navigation", async ({
    page,
  }) => {
    const safety = trackSafety(page);
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto("/paciente/novo-registro");
    const notes = page.getByRole("textbox", { name: "Observações" });
    await notes.focus();
    await expectAboveNavigation(page, notes, PATIENT_NAV, "Notes field");
    const recordedAt = page.getByRole("textbox", { name: "Data e horário" });
    await recordedAt.focus();
    await expectAboveNavigation(page, recordedAt, PATIENT_NAV, "Date field");
    await expectPageFits(page, "focused record form");
    safety.finish();
  });

  test("access dialogs fit narrow and short viewports and can be cancelled", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);

    async function cancelAccessDialogs(width: number, height: number) {
      await page.setViewportSize({ width, height });
      await page.goto("/paciente/configuracoes/acessos");
      await expect(
        page.getByRole("heading", { level: 1, name: "Acesso da equipe médica" })
      ).toBeVisible();
      await expectPageFits(page, `${width}x${height} access page`);

      const revoke = page.getByRole("button", { name: "Revogar acesso" });
      if ((await revoke.count()) > 0) {
        await revoke.first().click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        await expectInsideViewport(page, dialog, "Revoke dialog");
        await expectPageFits(page, `${width}x${height} revoke dialog`);
        await dialog.getByRole("button", { name: "Cancelar" }).click();
        await expect(dialog).toBeHidden();
      }

      const code = requireProfessionalCode();
      const field = page.getByRole("textbox", { name: "Código do profissional" });
      await field.fill(code);
      await page.getByRole("button", { name: "Buscar profissional" }).click();

      try {
        await expect(page.getByText("Profissional encontrado")).toBeVisible({
          timeout: 15_000,
        });
      } catch {
        await field.fill("");
        throw new Error(
          "Professional lookup did not reach the confirmation step. The code was not printed."
        );
      }

      await page.getByRole("button", { name: "Autorizar acesso" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();
      await expectInsideViewport(page, dialog, "Authorize dialog");
      await expectPageFits(page, `${width}x${height} authorize dialog`);
      const dismiss = dialog
        .getByRole("button", { name: "Cancelar" })
        .or(dialog.getByRole("button", { name: "Fechar" }));
      await dismiss.click();
      await expect(dialog).toBeHidden();
      const reset = page.getByRole("button", { name: "Buscar outro código" });
      if ((await reset.count()) > 0) {
        await reset.click();
      }
      if (await field.isVisible()) {
        await field.fill("");
      }
      await expect(page.getByText("Acesso autorizado com sucesso.")).toHaveCount(0);
    }

    await cancelAccessDialogs(320, 568);
    await cancelAccessDialogs(844, 390);
    await cancelAccessDialogs(1280, 600);
    safety.finish();
  });
});

test.describe("@responsive-medical", () => {
  test("medical pages fit small, tablet, desktop, and short layouts", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);
    const writeControls = [
      "Novo registro",
      "Registrar",
      "Editar registro",
      "Excluir registro",
      "Salvar registro",
      "Imprimir relatório",
      "Baixar PDF",
      "Compartilhar relatório",
    ];

    async function expectReadOnly(pathLabel: string) {
      for (const name of writeControls) {
        await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
      }
      await expect(page.getByText("pacienteB", { exact: true })).toHaveCount(0);
      await expectPageFits(page, pathLabel);
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/equipe-medica");
    await expect(
      page.getByRole("heading", { level: 1, name: "Área da equipe médica" })
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: MEDICAL_NAV })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Menu lateral" })).toBeHidden();
    await expect(page.locator(MAIN)).toHaveCount(1);
    await expectReadOnly("320 medical home");

    await page.goto("/equipe-medica/pacientes");
    await expect(page.getByRole("search", { name: "Buscar paciente" })).toBeVisible();
    await expect(page.getByText("modo somente leitura")).toBeVisible();
    await expectReadOnly("320 patient list");

    const dashboardLink = page.getByRole("link", { name: "Ver dashboard" });
    expect(await dashboardLink.count()).toBeGreaterThan(0);
    await dashboardLink.first().click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard do paciente" })
    ).toBeVisible();
    await expect(page.getByText("Somente leitura").first()).toBeVisible();
    await expectChartFits(page, "320 medical dashboard");
    await expectReadOnly("320 medical dashboard");
    await expectAboveNavigation(
      page,
      page.getByRole("link", { name: "Ver relatório" }),
      MEDICAL_NAV,
      "Medical report link"
    );

      await page.getByRole("link", { name: "Ver histórico" }).click();
      await expectReadOnly("320 medical history");
      await page.getByRole("link", { name: "Voltar para o dashboard" }).click();
      await page.getByRole("link", { name: "Ver relatório" }).click();
    await expectChartFits(page, "320 medical report");
    await expectReadOnly("320 medical report");

    await page.goto(`/equipe-medica/pacientes/${UNKNOWN_PATIENT_ID}`);
    await expect(page.locator(MAIN)).toBeVisible();
    await expectReadOnly("320 unauthorized patient");

    const sizes = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1280, height: 600 },
      { width: 640, height: 400 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/equipe-medica/pacientes");
      await expect(page.getByRole("search", { name: "Buscar paciente" })).toBeVisible();

      if (size.width < 1024) {
        await expect(page.getByRole("navigation", { name: MEDICAL_NAV })).toBeVisible();
        await expect(
          page.getByRole("complementary", { name: "Menu lateral" })
        ).toBeHidden();
      } else {
        const aside = await boxOf(
          page.getByRole("complementary", { name: "Menu lateral" })
        );
        const main = await boxOf(page.locator(MAIN));
        expect(aside.x + aside.width).toBeLessThanOrEqual(main.x + 1);
        expect(overlaps(aside, main)).toBe(false);
      }

      await expectReadOnly(`${size.width}x${size.height} medical list`);
    }

    safety.finish();
  });

  test("medical search, touch targets, and charts fit", async ({ page }) => {
    test.setTimeout(180_000);
    const safety = trackSafety(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/equipe-medica/pacientes");

    await expectTargetAtLeast(
      page.getByRole("link", { name: "Início", exact: true }),
      "Medical nav home"
    );
    await expectTargetAtLeast(
      page.getByRole("link", { name: "Pacientes", exact: true }),
      "Medical nav patients"
    );
    await expectTargetAtLeast(
      page.getByRole("button", { name: "Buscar", exact: true }),
      "Medical search"
    );
    await expectTargetAtLeast(
      page.getByRole("button", { name: "Sair", exact: true }),
      "Medical logout"
    );

    const search = page.getByRole("searchbox", { name: "Buscar paciente" });
    await search.fill("Nome ficticio sem resultado");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Nenhum paciente encontrado" })
    ).toBeVisible();
    await expectPageFits(page, "medical no results");
    const clear = page.getByRole("link", { name: "Limpar busca" }).first();
    await expectTargetAtLeast(clear, "Clear search");
    const searchBox = await boxOf(search);
    const clearBox = await boxOf(clear);
    expect(overlaps(searchBox, clearBox)).toBe(false);
    await clear.click();
    await expect(page).not.toHaveURL(/[?&]q=/);
    await expect(page.getByRole("link", { name: "Ver dashboard" }).first()).toBeVisible();

    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/equipe-medica/pacientes");
      await page.getByRole("link", { name: "Ver dashboard" }).first().click();
      await expectChartFits(page, `${width} medical dashboard chart`);
      await page.getByRole("link", { name: "Ver relatório" }).click();
      await expectChartFits(page, `${width} medical report chart`);
      await expect(
        page.getByRole("button", { name: "Imprimir relatório" })
      ).toHaveCount(0);
      await expectPageFits(page, `${width} medical report`);
    }

    await page.emulateMedia({ media: "print" });
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.goto("/equipe-medica/pacientes");
    const medicalNavDisplays = await page
      .locator(`nav[aria-label="${MEDICAL_NAV}"]`)
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).display));
    expect(medicalNavDisplays.length).toBeGreaterThan(0);
    expect(medicalNavDisplays.every((display) => display === "none")).toBe(true);
    await expect(page.getByRole("button", { name: "Imprimir relatório" })).toHaveCount(
      0
    );
    await page.emulateMedia({ media: "screen" });

    safety.finish();
  });
});
