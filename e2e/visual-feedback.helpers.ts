import { expect, type Locator, type Page } from "@playwright/test";

import {
  contrastRatio,
  flattenFrontToBack,
  formatRgb,
  parseColorList,
  parseCssColor,
  type RgbColor,
} from "../src/test/contrast-ratio";

type PaintSample = {
  color: string;
  backgrounds: string[];
};

function opaqueFallback(): RgbColor {
  return { r: 255, g: 255, b: 255, a: 1 };
}

function backgroundOf(sample: PaintSample): RgbColor {
  const layers = parseColorList(sample.backgrounds);
  return layers.length > 0 ? flattenFrontToBack(layers) : opaqueFallback();
}

function foregroundOf(color: string, background: RgbColor): RgbColor {
  const parsed = parseCssColor(color);

  if (!parsed) {
    throw new Error(`Could not parse a rendered color: ${color}`);
  }

  return parsed.a < 1 ? flattenFrontToBack([parsed, background]) : parsed;
}

export function trackPageErrors(page: Page) {
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return pageErrors;
}

export function expectNoPageErrors(pageErrors: string[]) {
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
}

async function readPaint(locator: Locator, colorSource: "color" | "stroke" | "fill") {
  return locator.evaluate((element, source) => {
    function opaque(color: string) {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return false;
      }

      const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      const alpha = parts.length >= 4 ? parts[3] : 1;
      return alpha >= 0.99 && color !== "rgba(0, 0, 0, 0)";
    }

    const backgrounds: string[] = [];
    let node: Element | null = element;

    while (node) {
      const background = getComputedStyle(node).backgroundColor;
      backgrounds.push(background);

      if (opaque(background)) {
        break;
      }

      node = node.parentElement;
    }

    const style = getComputedStyle(element);
    const color =
      source === "stroke"
        ? style.stroke
        : source === "fill"
          ? style.fill
          : style.color;

    return { color, backgrounds };
  }, colorSource);
}

export async function expectContrast(
  locator: Locator,
  minimum: number,
  label: string,
  colorSource: "color" | "stroke" | "fill" = "color"
) {
  const sample = await readPaint(locator, colorSource);
  const background = backgroundOf(sample);
  const foreground = foregroundOf(sample.color, background);
  const ratio = contrastRatio(foreground, background);

  expect(
    ratio,
    `${label}: ${formatRgb(foreground)} on ${formatRgb(background)} is ${ratio.toFixed(2)}:1, required ${minimum}:1`
  ).toBeGreaterThanOrEqual(minimum);
}

export async function expectBorderContrast(
  locator: Locator,
  minimum: number,
  label: string
) {
  const sample = await locator.evaluate((element) => {
    function opaque(color: string) {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return false;
      }

      const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      const alpha = parts.length >= 4 ? parts[3] : 1;
      return alpha >= 0.99 && color !== "rgba(0, 0, 0, 0)";
    }

    function stackFrom(start: Element | null) {
      const backgrounds: string[] = [];
      let node = start;

      while (node) {
        const background = getComputedStyle(node).backgroundColor;
        backgrounds.push(background);

        if (opaque(background)) {
          break;
        }

        node = node.parentElement;
      }

      return backgrounds;
    }

    const style = getComputedStyle(element);

    return {
      borderColor: style.borderTopColor,
      borderWidth: Number.parseFloat(style.borderTopWidth),
      inside: stackFrom(element),
      outside: stackFrom(element.parentElement),
    };
  });

  expect(sample.borderWidth, `${label} has no visible border`).toBeGreaterThan(0);

  const border = parseCssColor(sample.borderColor);
  if (!border) {
    throw new Error(`${label} border color could not be parsed`);
  }

  const inside = flattenFrontToBack(parseColorList(sample.inside));
  const outside = flattenFrontToBack(parseColorList(sample.outside));
  const insideRatio = contrastRatio(border, inside);
  const outsideRatio = contrastRatio(border, outside);

  expect(
    Math.min(insideRatio, outsideRatio),
    `${label}: border ${formatRgb(border)} is ${insideRatio.toFixed(2)}:1 inside and ${outsideRatio.toFixed(2)}:1 outside, required ${minimum}:1`
  ).toBeGreaterThanOrEqual(minimum);
}

export async function expectFocusContrast(locator: Locator, label: string) {
  await expect(locator).toBeFocused();
  await expect
    .poll(async () => focusContrast(locator), { timeout: 1_000 })
    .toBe(true);

  async function focusContrast(target: Locator) {
    return target.evaluate((element) => {
      const style = getComputedStyle(element);
      const shadow = style.boxShadow;
      const spread = [...shadow.matchAll(/rgba?\(([^)]+)\)\s+[-\d.]+px\s+[-\d.]+px\s+[-\d.]+px\s+([-\d.]+)px/g)];
      const strong = spread.some((match) => {
        const parts = match[1].split(",").map((part) => Number(part.trim()));
        const alpha = parts.length >= 4 ? parts[3] : 1;
        const size = Number(match[2]);
        return alpha >= 0.9 && size >= 2;
      });
      const outline =
        style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) >= 2;

      return strong || outline;
    });
  }

  const sample = await locator.evaluate((element) => {
    function opaque(color: string) {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (!match) {
        return false;
      }

      const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      const alpha = parts.length >= 4 ? parts[3] : 1;
      return alpha >= 0.99 && color !== "rgba(0, 0, 0, 0)";
    }

    const backgrounds: string[] = [];
    let node: Element | null = element.parentElement;

    while (node) {
      const background = getComputedStyle(node).backgroundColor;
      backgrounds.push(background);

      if (opaque(background)) {
        break;
      }

      node = node.parentElement;
    }

    const style = getComputedStyle(element);

    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      backgrounds,
    };
  });

  const background = flattenFrontToBack(parseColorList(sample.backgrounds));
  const indicatorColors = [
    ...sample.boxShadow.matchAll(/rgba?\([^)]+\)/g),
  ].map((match) => match[0]);

  if (sample.outlineStyle !== "none" && Number.parseFloat(sample.outlineWidth) > 0) {
    indicatorColors.push(sample.outlineColor);
  }

  const ratios = indicatorColors.flatMap((color) => {
    const parsed = parseCssColor(color);
    if (!parsed || parsed.a < 0.5) {
      return [];
    }

    return [contrastRatio(parsed, background)];
  });

  expect(
    ratios.some((ratio) => ratio >= 3),
    `${label} focus indicator is not 3:1 against ${formatRgb(background)}. Shadows: ${sample.boxShadow}`
  ).toBe(true);
}

export async function expectUnderline(locator: Locator) {
  const decoration = await locator.evaluate(
    (element) => getComputedStyle(element).textDecorationLine
  );
  expect(decoration).toContain("underline");
}

export function visible(page: Page, role: "link" | "button" | "textbox", name: string | RegExp) {
  return page
    .getByRole(role, typeof name === "string" ? { name, exact: true } : { name })
    .filter({ visible: true });
}
