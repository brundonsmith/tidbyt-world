/**
 * Least-significant-bit-first bit writer, matching the VP8L bitstream
 * convention: plain values are written LSB-first, prefix codes are written
 * MSB-of-code-first (see `writeCode`).
 */
export class BitWriter {
  private bytes: Uint8Array = new Uint8Array(1024);
  private length = 0;
  private partial = 0;
  private partialBits = 0;

  /** Writes the low `count` bits of `value`, least significant bit first. */
  writeBits(value: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.writeBit((value >>> i) & 1);
    }
  }

  /** Writes a canonical prefix code, most significant bit of the code first. */
  writeCode(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.writeBit((code >>> i) & 1);
    }
  }

  private writeBit(bit: number): void {
    this.partial |= bit << this.partialBits;
    this.partialBits++;
    if (this.partialBits === 8) {
      this.pushByte(this.partial);
      this.partial = 0;
      this.partialBits = 0;
    }
  }

  private pushByte(byte: number): void {
    if (this.length === this.bytes.length) {
      const grown = new Uint8Array(this.bytes.length * 2);
      grown.set(this.bytes);
      this.bytes = grown;
    }
    this.bytes[this.length++] = byte;
  }

  /** Flushes any partial byte and returns the written bytes. */
  finish(): Uint8Array {
    if (this.partialBits > 0) {
      this.pushByte(this.partial);
      this.partial = 0;
      this.partialBits = 0;
    }
    return this.bytes.slice(0, this.length);
  }
}
