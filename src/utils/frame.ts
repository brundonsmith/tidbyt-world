import { BLACK, type Color } from "./color.ts";

/** Tidbyt display dimensions. */
export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 32;

/**
 * A single frame of pixels, addressed as `frame[x][y]`.
 *
 * The outer array is one entry per column (x), the inner arrays are one entry
 * per row (y). Frames are plain arrays, so `frame[x][y] = someColor` works
 * directly; the helpers below are just conveniences on top of that.
 */
export type Frame = (Color | null)[][];

export interface FrameSize {
  readonly width: number;
  readonly height: number;
}

export function createFrame(
  fill: Color = BLACK,
  width: number = FRAME_WIDTH,
  height: number = FRAME_HEIGHT,
): Frame {
  const frame: Frame = new Array(width);
  for (let x = 0; x < width; x++) {
    frame[x] = new Array<Color>(height).fill(fill);
  }
  return frame;
}

export function cloneFrame(frame: Frame): Frame {
  return frame.map((column) => column.slice());
}

export function frameSize(frame: Frame): FrameSize {
  const width = frame.length;
  const height = width === 0 ? 0 : frame[0]!.length;
  return { width, height };
}

export function inBounds(frame: Frame, x: number, y: number): boolean {
  const { width, height } = frameSize(frame);
  return x >= 0 && y >= 0 && x < width && y < height;
}

/** Writes a pixel, ignoring coordinates outside the frame. */
export function setPixel(frame: Frame, x: number, y: number, color: Color): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (inBounds(frame, px, py)) frame[px]![py] = color;
}

export function getPixel(frame: Frame, x: number, y: number): Color | undefined {
  return frame[Math.round(x)]?.[Math.round(y)] ?? undefined;
}

export function fill(frame: Frame, color: Color): void {
  for (const column of frame) column.fill(color);
}

/** Calls `fn` for every pixel; a returned color replaces the pixel. */
export function forEachPixel(
  frame: Frame,
  fn: (x: number, y: number, color: Color) => Color | void,
): void {
  const { width, height } = frameSize(frame);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const next = fn(x, y, frame[x]![y]!);
      if (next) frame[x]![y] = next;
    }
  }
}

export function fillRect(
  frame: Frame,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  for (let px = x; px < x + width; px++) {
    for (let py = y; py < y + height; py++) {
      setPixel(frame, px, py, color);
    }
  }
}

export function strokeRect(
  frame: Frame,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  for (let px = x; px < x + width; px++) {
    setPixel(frame, px, y, color);
    setPixel(frame, px, y + height - 1, color);
  }
  for (let py = y; py < y + height; py++) {
    setPixel(frame, x, py, color);
    setPixel(frame, x + width - 1, py, color);
  }
}

/** Bresenham line from (x0, y0) to (x1, y1), inclusive of both endpoints. */
export function drawLine(
  frame: Frame,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Color,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const dy = -Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  let error = dx + dy;

  for (; ;) {
    setPixel(frame, x, y, color);
    if (x === endX && y === endY) break;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubled <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

export function fillCircle(
  frame: Frame,
  cx: number,
  cy: number,
  radius: number,
  color: Color,
): void {
  const r2 = radius * radius;
  for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(frame, x, y, color);
    }
  }
}

export function strokeCircle(
  frame: Frame,
  cx: number,
  cy: number,
  radius: number,
  color: Color,
): void {
  const steps = Math.max(8, Math.ceil(radius * 8));
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    setPixel(frame, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, color);
  }
}

/** Copies `source` onto `target` with its top-left corner at (x, y). */
export function blit(target: Frame, source: Frame, x: number, y: number): void {
  const { width, height } = frameSize(source);
  for (let sx = 0; sx < width; sx++) {
    for (let sy = 0; sy < height; sy++) {
      const sourcePixel = source[sx]?.[sy]
      if (sourcePixel != null) {
        setPixel(target, x + sx, y + sy, sourcePixel);
      }
    }
  }
}
