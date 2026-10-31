import { describe, expect, test } from "vitest";

import {
  composite,
  contrastRatio,
  flattenFrontToBack,
  parseCssColor,
} from "./contrast-ratio";

function rgb(r: number, g: number, b: number, a = 1) {
  return { r, g, b, a };
}

function ratio(foreground: string, background: string) {
  const fg = parseCssColor(foreground);
  const bg = parseCssColor(background);

  if (!fg || !bg) {
    throw new Error(`Could not parse ${foreground} on ${background}`);
  }

  return contrastRatio(fg, bg);
}

describe("contrast ratio helper", () => {
  test("parses comma and space rgb syntax, including alpha", () => {
    expect(parseCssColor("rgb(17, 24, 39)")).toEqual(rgb(17, 24, 39));
    expect(parseCssColor("rgba(255, 255, 255, 0.55)")).toEqual(
      rgb(255, 255, 255, 0.55)
    );
    expect(parseCssColor("rgb(94 104 116 / 50%)")).toEqual(rgb(94, 104, 116, 0.5));
  });

  test("uses the WCAG relative luminance formula", () => {
    expect(ratio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBeCloseTo(21, 1);
    expect(ratio("rgb(255, 255, 255)", "rgb(255, 255, 255)")).toBeCloseTo(1, 5);
  });

  test("composites transparent foregrounds before measuring", () => {
    const navy = rgb(15, 32, 68);
    const muted = composite(rgb(255, 255, 255, 0.55), navy);

    expect(contrastRatio(muted, navy)).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(flattenFrontToBack([rgb(255, 255, 255, 0.55), navy]), navy)
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("locks the corrected semantic pairs above WCAG 2.2 AA", () => {
    const pairs: Array<[string, string, number]> = [
      ["rgb(94, 104, 116)", "rgb(245, 247, 250)", 4.5],
      ["rgb(94, 104, 116)", "rgb(255, 255, 255)", 4.5],
      ["rgb(94, 104, 116)", "rgb(238, 241, 246)", 4.5],
      ["rgb(17, 24, 39)", "rgb(245, 247, 250)", 4.5],
      ["rgb(255, 255, 255)", "rgb(30, 78, 232)", 4.5],
      ["rgb(180, 35, 24)", "rgb(245, 247, 250)", 4.5],
      ["rgb(180, 35, 24)", "rgb(238, 241, 246)", 4.5],
      ["rgb(122, 88, 0)", "rgb(255, 248, 225)", 4.5],
      ["rgb(22, 101, 52)", "rgb(240, 253, 244)", 4.5],
      ["rgb(30, 58, 138)", "rgb(239, 246, 255)", 4.5],
      ["rgb(63, 74, 90)", "rgb(213, 219, 227)", 4.5],
      ["rgb(119, 129, 145)", "rgb(255, 255, 255)", 3],
      ["rgb(119, 129, 145)", "rgb(238, 241, 246)", 3],
      ["rgb(122, 132, 146)", "rgb(255, 255, 255)", 3],
      ["rgb(30, 78, 232)", "rgb(245, 247, 250)", 3],
      ["rgb(255, 255, 255)", "rgb(15, 32, 68)", 3],
    ];

    for (const [foreground, background, minimum] of pairs) {
      expect(ratio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    }
  });
});
