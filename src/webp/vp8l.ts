import { frameSize, type Frame } from "../frame.ts";
import { BitWriter } from "./bit-writer.ts";
import { buildPrefixCode, writePrefixCode, writeSymbol } from "./huffman.ts";

/** 256 literals + 24 length codes + color cache codes (we use no cache). */
const GREEN_ALPHABET_SIZE = 256 + 24;
const LITERAL_ALPHABET_SIZE = 256;
const DISTANCE_ALPHABET_SIZE = 40;

const VP8L_SIGNATURE = 0x2f;
const VP8L_VERSION = 0;
const MAX_DIMENSION = 1 << 14;

/**
 * Encodes one frame as a lossless VP8L bitstream.
 *
 * The encoding is deliberately simple: no transforms, no color cache and no
 * LZ77 back-references, just prefix-coded literals for each channel. That is
 * plenty for 64x32 frames, and leaves the obvious compression wins (palette
 * transform, color cache, back-references) as later additions that don't
 * change this module's interface.
 */
export function encodeVP8L(frame: Frame): Uint8Array {
  const { width, height } = frameSize(frame);
  if (width <= 0 || height <= 0) {
    throw new Error("Cannot encode an empty frame");
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Frame is larger than VP8L allows: ${width}x${height}`);
  }

  const greenCounts = new Int32Array(GREEN_ALPHABET_SIZE);
  const redCounts = new Int32Array(LITERAL_ALPHABET_SIZE);
  const blueCounts = new Int32Array(LITERAL_ALPHABET_SIZE);
  const alphaCounts = new Int32Array(LITERAL_ALPHABET_SIZE);
  let usesAlpha = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelAt(frame, x, y);
      greenCounts[pixel.g]!++;
      redCounts[pixel.r]!++;
      blueCounts[pixel.b]!++;
      alphaCounts[pixel.a]!++;
      if (pixel.a !== 255) usesAlpha = true;
    }
  }

  const green = buildPrefixCode(greenCounts);
  const red = buildPrefixCode(redCounts);
  const blue = buildPrefixCode(blueCounts);
  const alpha = buildPrefixCode(alphaCounts);

  // No back-references are emitted, but the distance code still has to be
  // present, so write the cheapest possible one.
  const distanceCounts = new Int32Array(DISTANCE_ALPHABET_SIZE);
  distanceCounts[0] = 1;
  const distance = buildPrefixCode(distanceCounts);

  const writer = new BitWriter();
  writer.writeBits(VP8L_SIGNATURE, 8);
  writer.writeBits(width - 1, 14);
  writer.writeBits(height - 1, 14);
  writer.writeBits(usesAlpha ? 1 : 0, 1);
  writer.writeBits(VP8L_VERSION, 3);

  writer.writeBits(0, 1); // no transforms
  writer.writeBits(0, 1); // no color cache
  writer.writeBits(0, 1); // no meta prefix codes (a single code group)

  for (const code of [green, red, blue, alpha, distance]) {
    writePrefixCode(writer, code);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelAt(frame, x, y);
      writeSymbol(writer, green, pixel.g);
      writeSymbol(writer, red, pixel.r);
      writeSymbol(writer, blue, pixel.b);
      writeSymbol(writer, alpha, pixel.a);
    }
  }

  return writer.finish();
}

export function frameUsesAlpha(frame: Frame): boolean {
  return frame.some((column) => column.some((pixel) => pixel.a !== 255));
}

function pixelAt(frame: Frame, x: number, y: number) {
  const pixel = frame[x]?.[y];
  if (!pixel) {
    throw new Error(`Frame is ragged: no pixel at (${x}, ${y})`);
  }
  return pixel;
}
