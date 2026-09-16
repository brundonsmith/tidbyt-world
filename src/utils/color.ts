/** An 8-bit-per-channel, straight-alpha color. */
export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clamp255 = (n: number): number =>
  n < 0 ? 0 : n > 255 ? 255 : Math.round(n);

export function rgb(r: number, g: number, b: number): Color {
  return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: 255 };
}

export function rgba(r: number, g: number, b: number, a: number): Color {
  return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: clamp255(a) };
}

/** Parses `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (leading `#` optional). */
export function hex(value: string): Color {
  const s = value.startsWith("#") ? value.slice(1) : value;
  const expand = (c: string): number => parseInt(c + c, 16);

  if (s.length === 3 || s.length === 4) {
    return rgba(
      expand(s[0]!),
      expand(s[1]!),
      expand(s[2]!),
      s.length === 4 ? expand(s[3]!) : 255,
    );
  }
  if (s.length === 6 || s.length === 8) {
    return rgba(
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
      s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255,
    );
  }
  throw new Error(`Not a hex color: ${value}`);
}

/** Linear interpolation between two colors; `t` is clamped to [0, 1]. */
export function mix(a: Color, b: Color, t: number): Color {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return rgba(
    a.r + (b.r - a.r) * k,
    a.g + (b.g - a.g) * k,
    a.b + (b.b - a.b) * k,
    a.a + (b.a - a.a) * k,
  );
}

/** Multiplies the RGB channels by `factor`, keeping alpha. */
export function scale(color: Color, factor: number): Color {
  return rgba(color.r * factor, color.g * factor, color.b * factor, color.a);
}

export function withAlpha(color: Color, a: number): Color {
  return rgba(color.r, color.g, color.b, a);
}

export function equals(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export const TRANSPARENT: Color = rgba(0, 0, 0, 0);
export const BLACK: Color = rgb(0, 0, 0);
export const WHITE: Color = rgb(255, 255, 255);
export const RED: Color = rgb(255, 0, 0);
export const GREEN: Color = rgb(0, 255, 0);
export const BLUE: Color = rgb(0, 0, 255);
export const YELLOW: Color = rgb(255, 255, 0);
export const CYAN: Color = rgb(0, 255, 255);
export const MAGENTA: Color = rgb(255, 0, 255);
export const ORANGE: Color = rgb(255, 128, 0);
