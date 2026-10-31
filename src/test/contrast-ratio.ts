export type RgbColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

function channel(value: number): number {
  const scaled = value / 255;
  if (scaled <= 0.04045) {
    return scaled / 12.92;
  }

  return ((scaled + 0.055) / 1.055) ** 2.4;
}

export function parseCssColor(input: string): RgbColor | null {
  const value = input.trim();
  const comma = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  const space = value.match(
    /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i
  );
  const match = comma ?? space;

  if (!match) {
    return null;
  }

  const alpha = match[4];
  const parsedAlpha =
    alpha === undefined
      ? 1
      : alpha.endsWith("%")
        ? Number(alpha.slice(0, -1)) / 100
        : Number(alpha);

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: parsedAlpha,
  };
}

export function composite(front: RgbColor, back: RgbColor): RgbColor {
  const alpha = front.a + back.a * (1 - front.a);

  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const mix = (foreground: number, background: number) =>
    (foreground * front.a + background * back.a * (1 - front.a)) / alpha;

  return {
    r: mix(front.r, back.r),
    g: mix(front.g, back.g),
    b: mix(front.b, back.b),
    a: alpha,
  };
}

export function flattenFrontToBack(layers: readonly RgbColor[]): RgbColor {
  let result: RgbColor = { r: 255, g: 255, b: 255, a: 1 };

  for (let index = layers.length - 1; index >= 0; index -= 1) {
    result = composite(layers[index], result);
  }

  return { r: result.r, g: result.g, b: result.b, a: 1 };
}

export function relativeLuminance(color: RgbColor): number {
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function formatRgb(color: RgbColor): string {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}

export function parseColorList(colors: readonly string[]): RgbColor[] {
  return colors.flatMap((color) => {
    const parsed = parseCssColor(color);
    return parsed ? [parsed] : [];
  });
}
