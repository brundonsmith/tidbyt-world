import { BLACK, type Color } from "../color.ts";
import { frameSize, type Frame } from "../frame.ts";
import { encodeVP8L, frameUsesAlpha } from "./vp8l.ts";

export interface WebPOptions {
  /** Milliseconds each frame is shown; pass an array for per-frame timing. */
  frameDurationMs?: number | number[];
  /** 0 (the default) loops forever. */
  loopCount?: number;
  /** Canvas background recorded in the ANIM chunk. */
  background?: Color;
}

const DEFAULT_FRAME_DURATION_MS = 100;

/**
 * Encodes one or more frames into a WebP file. A single frame produces a
 * still image; two or more produce an animation.
 */
export function encodeWebP(frames: Frame[], options: WebPOptions = {}): Uint8Array {
  if (frames.length === 0) {
    throw new Error("Need at least one frame to encode a WebP");
  }

  const { width, height } = frameSize(frames[0]!);
  for (const frame of frames) {
    const size = frameSize(frame);
    if (size.width !== width || size.height !== height) {
      throw new Error(
        `All frames must be the same size (expected ${width}x${height}, got ${size.width}x${size.height})`,
      );
    }
  }

  const bitstreams = frames.map(encodeVP8L);
  if (bitstreams.length === 1) {
    return riff([chunk("VP8L", bitstreams[0]!)]);
  }

  const durations = frameDurations(frames.length, options.frameDurationMs);
  const usesAlpha = frames.some(frameUsesAlpha);

  const chunks: Uint8Array[] = [
    chunk("VP8X", vp8xPayload(width, height, usesAlpha)),
    chunk("ANIM", animPayload(options.background ?? BLACK, options.loopCount ?? 0)),
  ];
  for (const [index, bitstream] of bitstreams.entries()) {
    chunks.push(
      chunk("ANMF", anmfPayload(width, height, durations[index]!, chunk("VP8L", bitstream))),
    );
  }
  return riff(chunks);
}

function frameDurations(
  frameCount: number,
  durationMs: number | number[] | undefined,
): number[] {
  if (Array.isArray(durationMs)) {
    if (durationMs.length !== frameCount) {
      throw new Error(
        `Expected ${frameCount} frame durations, got ${durationMs.length}`,
      );
    }
    return durationMs;
  }
  return new Array<number>(frameCount).fill(durationMs ?? DEFAULT_FRAME_DURATION_MS);
}

function vp8xPayload(width: number, height: number, usesAlpha: boolean): Uint8Array {
  const payload = new Uint8Array(10);
  const ALPHA_FLAG = 0x10;
  const ANIMATION_FLAG = 0x02;
  payload[0] = ANIMATION_FLAG | (usesAlpha ? ALPHA_FLAG : 0);
  writeUint24LE(payload, 4, width - 1);
  writeUint24LE(payload, 7, height - 1);
  return payload;
}

function animPayload(background: Color, loopCount: number): Uint8Array {
  const payload = new Uint8Array(6);
  payload[0] = background.b;
  payload[1] = background.g;
  payload[2] = background.r;
  payload[3] = background.a;
  writeUint16LE(payload, 4, loopCount);
  return payload;
}

function anmfPayload(
  width: number,
  height: number,
  durationMs: number,
  frameChunk: Uint8Array,
): Uint8Array {
  const DO_NOT_BLEND = 0x02;
  const payload = new Uint8Array(16 + frameChunk.length);
  writeUint24LE(payload, 0, 0); // frame x / 2
  writeUint24LE(payload, 3, 0); // frame y / 2
  writeUint24LE(payload, 6, width - 1);
  writeUint24LE(payload, 9, height - 1);
  writeUint24LE(payload, 12, Math.max(0, Math.round(durationMs)));
  payload[15] = DO_NOT_BLEND; // full-canvas frames replace what came before
  payload.set(frameChunk, 16);
  return payload;
}

function riff(chunks: Uint8Array[]): Uint8Array {
  const bodyLength = chunks.reduce((total, part) => total + part.length, 0);
  const file = new Uint8Array(12 + bodyLength);
  writeAscii(file, 0, "RIFF");
  writeUint32LE(file, 4, 4 + bodyLength);
  writeAscii(file, 8, "WEBP");
  let offset = 12;
  for (const part of chunks) {
    file.set(part, offset);
    offset += part.length;
  }
  return file;
}

function chunk(fourCC: string, payload: Uint8Array): Uint8Array {
  const padding = payload.length % 2;
  const out = new Uint8Array(8 + payload.length + padding);
  writeAscii(out, 0, fourCC);
  writeUint32LE(out, 4, payload.length);
  out.set(payload, 8);
  return out;
}

function writeAscii(target: Uint8Array, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) target[offset + i] = text.charCodeAt(i);
}

function writeUint16LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint24LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
}

function writeUint32LE(target: Uint8Array, offset: number, value: number): void {
  writeUint16LE(target, offset, value & 0xffff);
  writeUint16LE(target, offset + 2, (value >>> 16) & 0xffff);
}
