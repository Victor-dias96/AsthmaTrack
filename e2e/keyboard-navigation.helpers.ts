import { expect, type Locator, type Page } from "@playwright/test";

export const MAX_TAB_PRESSES = 40;

export async function pressTabUntilFocused(
  page: Page,
  target: Locator,
  options?: { shift?: boolean; maxTabs?: number; description?: string }
): Promise<void> {
  const maxTabs = options?.maxTabs ?? MAX_TAB_PRESSES;
  const key = options?.shift ? "Shift+Tab" : "Tab";
  const description = options?.description ?? "expected control";

  for (let attempt = 0; attempt <= maxTabs; attempt += 1) {
    const focused = await target
      .evaluate((element) => element === document.activeElement)
      .catch(() => false);

    if (focused) {
      return;
    }

    if (attempt === maxTabs) {
      break;
    }

    await page.keyboard.press(key);
  }

  const endedOn = await describeFocus(page);
  throw new Error(
    `Did not reach ${description} within ${maxTabs} ${key} presses. Focus ended on ${endedOn}.`
  );
}

export async function describeFocus(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;

    if (!(active instanceof HTMLElement) || active === document.body) {
      return "document body";
    }

    if (
      active instanceof HTMLInputElement &&
      (active.type === "password" || active.type === "email")
    ) {
      return `${active.tagName} ${active.type} field`;
    }

    const name =
      active.getAttribute("aria-label") ||
      active.innerText ||
      active.tagName;

    return `${active.tagName} ${name.replace(/\s+/g, " ").trim().slice(0, 60)}`;
  });
}

export async function expectFocusIndicator(page: Page): Promise<void> {
  const visible = await page.evaluate(() => {
    const active = document.activeElement;

    if (!(active instanceof HTMLElement) || active === document.body) {
      return false;
    }

    function hasIndicator(element: HTMLElement): boolean {
      const style = getComputedStyle(element);
      const width = Number.parseFloat(style.outlineWidth);
      const outline =
        style.outlineStyle !== "none" &&
        Number.isFinite(width) &&
        width > 0;
      const shadow = style.boxShadow !== "none" && style.boxShadow.length > 0;
      return outline || shadow;
    }

    if (hasIndicator(active)) {
      return true;
    }

    if (active instanceof HTMLInputElement && active.id) {
      const label = document.querySelector(
        `label[for="${CSS.escape(active.id)}"]`
      );

      if (label instanceof HTMLElement && hasIndicator(label)) {
        return true;
      }
    }

    return false;
  });

  expect(visible, "Focused control has no visible outline or shadow.").toBe(
    true
  );
}

export async function expectFocusWithin(
  page: Page,
  container: Locator
): Promise<void> {
  await expect
    .poll(async () =>
      container.evaluate((node) => {
        const active = document.activeElement;
        return active instanceof Node && node.contains(active);
      })
    )
    .toBe(true);
}

export async function expectNoCredentialLeak(page: Page): Promise<void> {
  const leaked = await page.evaluate(() => {
    const url = new URL(window.location.href);
    const names = ["email", "password", "senha", "passwordconfirm"];
    const searchHit = [...url.searchParams.keys()].some((key) =>
      names.some((name) => key.toLowerCase().includes(name))
    );
    const hash = url.hash.toLowerCase();
    const hashHit = names.some(
      (name) => hash.includes(`${name}=`) || hash.includes(`${name}%3d`)
    );

    return searchHit || hashHit;
  });

  expect(leaked).toBe(false);
}

export async function expectNoPositiveTabIndex(page: Page): Promise<void> {
  const found = await page.evaluate(
    () =>
      [...document.querySelectorAll("[tabindex]")].some((element) => {
        const value = Number(element.getAttribute("tabindex"));
        return Number.isFinite(value) && value > 0;
      })
  );

  expect(found).toBe(false);
}

export function trackHealthWrites(page: Page) {
  let writes = 0;
  let nonLoopback = false;

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

    if (
      (url.pathname.startsWith("/auth/v1") ||
        url.pathname.startsWith("/rest/v1")) &&
      !loopback
    ) {
      nonLoopback = true;
    }

    const method = request.method();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return;
    }

    if (url.pathname.includes("/rest/v1/")) {
      writes += 1;
    }
  });

  return {
    finish() {
      expect(writes).toBe(0);
      expect(nonLoopback).toBe(false);
    },
  };
}

export async function expectFocusedHasIndicator(
  page: Page,
  target: Locator
): Promise<void> {
  await expect(target).toBeFocused();
  await expectFocusIndicator(page);
}
