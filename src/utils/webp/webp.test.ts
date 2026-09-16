import { expect, test, describe } from "bun:test";
import { createFrame, type Frame } from "../frame.ts";
import { rgb, rgba, RED } from "../color.ts";
import { encodeWebP } from "./container.ts";
import { buildPrefixCode } from "./huffman.ts";

const fourCC = (bytes: Uint8Array, offset: number): string =>
  String.fromCharCode(...bytes.slice(offset, offset + 4));

const uint32 = (bytes: Uint8Array, offset: number): number =>
  bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) |
  (bytes[offset + 3]! * 0x1000000);

const uint24 = (bytes: Uint8Array, offset: number): number =>
  bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);

interface Chunk {
  fourCC: string;
  offset: number;
  size: number;
}

function parseChunks(file: Uint8Array): Chunk[] {
  expect(fourCC(file, 0)).toBe("RIFF");
  expect(uint32(file, 4)).toBe(file.length - 8);
  expect(fourCC(file, 8)).toBe("WEBP");

  const chunks: Chunk[] = [];
  let offset = 12;
  while (offset < file.length) {
    const size = uint32(file, offset + 4);
    chunks.push({ fourCC: fourCC(file, offset), offset: offset + 8, size });
    offset += 8 + size + (size % 2);
  }
  expect(offset).toBe(file.length);
  return chunks;
}

const noise = (): Frame => {
  const frame = createFrame();
  let seed = 1;
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 32; y++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      frame[x]![y] = rgb(seed & 0xff, (seed >> 8) & 0xff, (seed >> 16) & 0xff);
    }
  }
  return frame;
};

describe("encodeWebP", () => {
  test("a single frame becomes a still VP8L image", () => {
    const chunks = parseChunks(encodeWebP([createFrame(RED)]));
    expect(chunks.map((c) => c.fourCC)).toEqual(["VP8L"]);
  });

  test("multiple frames become an animation", () => {
    const file = encodeWebP([createFrame(RED), noise(), createFrame()], {
      frameDurationMs: [100, 250, 400],
      loopCount: 3,
    });
    const chunks = parseChunks(file);
    expect(chunks.map((c) => c.fourCC)).toEqual(["VP8X", "ANIM", "ANMF", "ANMF", "ANMF"]);

    const vp8x = chunks[0]!.offset;
    expect(file[vp8x]! & 0x02).toBe(0x02); // animation flag
    expect(file[vp8x]! & 0x10).toBe(0); // no alpha in these frames
    expect(uint24(file, vp8x + 4) + 1).toBe(64);
    expect(uint24(file, vp8x + 7) + 1).toBe(32);

    const anim = chunks[1]!.offset;
    expect(file[anim + 4]! | (file[anim + 5]! << 8)).toBe(3);

    const durations = chunks
      .filter((c) => c.fourCC === "ANMF")
      .map((c) => uint24(file, c.offset + 12));
    expect(durations).toEqual([100, 250, 400]);

    for (const anmf of chunks.filter((c) => c.fourCC === "ANMF")) {
      expect(uint24(file, anmf.offset + 6) + 1).toBe(64);
      expect(uint24(file, anmf.offset + 9) + 1).toBe(32);
      expect(fourCC(file, anmf.offset + 16)).toBe("VP8L");
    }
  });

  test("flags alpha when any frame is translucent", () => {
    const file = encodeWebP([createFrame(RED), createFrame(rgba(0, 0, 255, 128))]);
    const chunks = parseChunks(file);
    expect(file[chunks[0]!.offset]! & 0x10).toBe(0x10);
  });

  test("rejects empty and mismatched input", () => {
    expect(() => encodeWebP([])).toThrow();
    expect(() => encodeWebP([createFrame(), createFrame(RED, 32, 32)])).toThrow();
    expect(() => encodeWebP([createFrame(RED, 0, 0)])).toThrow();
    expect(() => encodeWebP([createFrame(), createFrame()], { frameDurationMs: [1] })).toThrow();
  });
});

describe("buildPrefixCode", () => {
  test("leaves a one-symbol alphabet to the simple code path", () => {
    const counts = new Int32Array(280);
    counts[42] = 99;
    const code = buildPrefixCode(counts);
    expect(code.usedCount).toBe(1);
    expect(code.firstSymbol).toBe(42);
  });

  test("produces a complete, depth-limited canonical code", () => {
    let seed = 7;
    for (let round = 0; round < 25; round++) {
      const counts = new Int32Array(280);
      for (let i = 0; i < counts.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        // Heavily skewed counts are what push Huffman trees past 15 levels.
        counts[i] = seed % 5 === 0 ? Math.floor(Math.pow(seed / 0x7fffffff, 12) * 1e6) : 0;
      }
      counts[0] = 1;
      counts[1] = 1;

      const code = buildPrefixCode(counts);
      let kraft = 0;
      const seen = new Set<string>();
      for (let symbol = 0; symbol < counts.length; symbol++) {
        const length = code.lengths[symbol]!;
        if (counts[symbol]! > 0) {
          expect(length).toBeGreaterThan(0);
          expect(length).toBeLessThanOrEqual(15);
          kraft += 2 ** -length;
          seen.add(`${length}:${code.codes[symbol]}`);
        } else {
          expect(length).toBe(0);
        }
      }
      expect(kraft).toBeCloseTo(1, 10);
      expect(seen.size).toBe(code.usedCount);
    }
  });
});
