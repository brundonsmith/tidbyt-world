import type { BitWriter } from "./bit-writer.ts";

/** VP8L caps prefix code lengths at 15 bits. */
const MAX_CODE_LENGTH = 15;

/** The order in which code-length-code lengths are stored in the bitstream. */
const CODE_LENGTH_ORDER = [
  17, 18, 0, 1, 2, 3, 4, 5, 16, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;

/** Every code-length symbol 0..15 is given this fixed length (a complete code). */
const CODE_LENGTH_CODE_BITS = 4;

export interface PrefixCode {
  /** Bit length per symbol; 0 means the symbol is unused. */
  readonly lengths: Int32Array;
  /** Canonical code per symbol (not bit-reversed). */
  readonly codes: Int32Array;
  readonly usedCount: number;
  readonly firstSymbol: number;
}

/**
 * Builds a canonical, depth-limited prefix code from symbol frequencies.
 *
 * Depth limiting uses libwebp's trick: rebuild the tree with every frequency
 * raised to a growing floor until the deepest code fits, which converges on a
 * flat (and therefore shallow) code in the worst case.
 */
export function buildPrefixCode(counts: Int32Array): PrefixCode {
  const size = counts.length;
  const lengths = new Int32Array(size);
  const codes = new Int32Array(size);

  let usedCount = 0;
  let firstSymbol = 0;
  for (let symbol = 0; symbol < size; symbol++) {
    if (counts[symbol]! > 0) {
      if (usedCount === 0) firstSymbol = symbol;
      usedCount++;
    }
  }

  // 0 or 1 distinct symbols are emitted as a "simple" code, which needs no
  // lengths at all: the decoder spends zero bits per symbol.
  if (usedCount <= 1) return { lengths, codes, usedCount, firstSymbol };

  for (let countFloor = 1; ; countFloor *= 2) {
    assignCodeLengths(counts, countFloor, lengths);
    let deepest = 0;
    for (let symbol = 0; symbol < size; symbol++) {
      if (lengths[symbol]! > deepest) deepest = lengths[symbol]!;
    }
    if (deepest <= MAX_CODE_LENGTH) break;
  }

  assignCanonicalCodes(lengths, codes);
  return { lengths, codes, usedCount, firstSymbol };
}

function assignCodeLengths(
  counts: Int32Array,
  countFloor: number,
  out: Int32Array,
): void {
  out.fill(0);

  const weights: number[] = [];
  const left: number[] = [];
  const right: number[] = [];
  const symbols: number[] = [];
  let live: number[] = [];

  for (let symbol = 0; symbol < counts.length; symbol++) {
    const count = counts[symbol]!;
    if (count === 0) continue;
    weights.push(Math.max(count, countFloor));
    left.push(-1);
    right.push(-1);
    symbols.push(symbol);
    live.push(weights.length - 1);
  }

  while (live.length > 1) {
    const a = takeLightest(live, weights);
    const b = takeLightest(live, weights);
    weights.push(weights[a]! + weights[b]!);
    left.push(a);
    right.push(b);
    symbols.push(-1);
    live.push(weights.length - 1);
  }

  const stack: Array<[node: number, depth: number]> = [[live[0]!, 0]];
  while (stack.length > 0) {
    const [node, depth] = stack.pop()!;
    const symbol = symbols[node]!;
    if (symbol >= 0) {
      out[symbol] = depth;
    } else {
      stack.push([left[node]!, depth + 1], [right[node]!, depth + 1]);
    }
  }
}

function takeLightest(live: number[], weights: number[]): number {
  let best = 0;
  for (let i = 1; i < live.length; i++) {
    if (weights[live[i]!]! < weights[live[best]!]!) best = i;
  }
  return live.splice(best, 1)[0]!;
}

function assignCanonicalCodes(lengths: Int32Array, codes: Int32Array): void {
  const lengthCounts = new Int32Array(MAX_CODE_LENGTH + 1);
  for (const length of lengths) if (length > 0) lengthCounts[length]!++;

  const nextCode = new Int32Array(MAX_CODE_LENGTH + 1);
  let code = 0;
  for (let length = 1; length <= MAX_CODE_LENGTH; length++) {
    code = (code + lengthCounts[length - 1]!) << 1;
    nextCode[length] = code;
  }
  for (let symbol = 0; symbol < lengths.length; symbol++) {
    const length = lengths[symbol]!;
    if (length > 0) codes[symbol] = nextCode[length]!++;
  }
}

/** Serializes a prefix code into the bitstream ahead of the data that uses it. */
export function writePrefixCode(writer: BitWriter, code: PrefixCode): void {
  if (code.usedCount <= 1) {
    const symbol = code.usedCount === 1 ? code.firstSymbol : 0;
    if (symbol > 255) {
      throw new Error(`Single-symbol prefix code out of range: ${symbol}`);
    }
    writer.writeBits(1, 1); // simple code
    writer.writeBits(0, 1); // one symbol
    if (symbol < 2) {
      writer.writeBits(0, 1); // symbol stored in 1 bit
      writer.writeBits(symbol, 1);
    } else {
      writer.writeBits(1, 1); // symbol stored in 8 bits
      writer.writeBits(symbol, 8);
    }
    return;
  }

  writer.writeBits(0, 1); // full code
  writer.writeBits(CODE_LENGTH_ORDER.length - 4, 4);
  for (const symbol of CODE_LENGTH_ORDER) {
    // Symbols 16..18 are the run-length escapes, which we never emit.
    writer.writeBits(symbol <= 15 ? CODE_LENGTH_CODE_BITS : 0, 3);
  }
  writer.writeBits(0, 1); // lengths are given for the whole alphabet

  // With all 16 length symbols at the same bit length, the canonical code for
  // length L is just L.
  for (const length of code.lengths) {
    writer.writeCode(length, CODE_LENGTH_CODE_BITS);
  }
}

export function writeSymbol(
  writer: BitWriter,
  code: PrefixCode,
  symbol: number,
): void {
  if (code.usedCount <= 1) return; // simple one-symbol code: nothing to write
  writer.writeCode(code.codes[symbol]!, code.lengths[symbol]!);
}
