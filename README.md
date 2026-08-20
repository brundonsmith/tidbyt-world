# tidbyt-world

Bun + TypeScript server that renders 64x32 frames and serves them as WebP.

```sh
bun install
bun run dev        # http://localhost:3000
bun test
bun run typecheck
```

## Endpoints

| Route   | Response                                              |
| ------- | ----------------------------------------------------- |
| `/`     | `Hello, world!`                                        |
| `/look` | A WebP image built from the current scene (`image/webp`) |

## Drawing

A frame is `Color[][]`, addressed as `frame[x][y]`. Build one with
`createFrame()` and edit it with the helpers in `src/frame.ts`:

```ts
import { createFrame, fillRect, drawLine, setPixel } from "./src/frame.ts";
import { hex, RED } from "./src/color.ts";

const frame = createFrame(hex("#000"));
fillRect(frame, 4, 4, 10, 10, RED);
drawLine(frame, 0, 0, 63, 31, hex("#22305e"));
setPixel(frame, 32, 16, RED);
frame[10]![20] = RED; // direct indexing works too
```

Available helpers: `createFrame`, `cloneFrame`, `frameSize`, `inBounds`,
`setPixel`, `getPixel`, `fill`, `forEachPixel`, `fillRect`, `strokeRect`,
`drawLine`, `fillCircle`, `strokeCircle`, `blit`. Colors come from
`src/color.ts` (`rgb`, `rgba`, `hex`, `mix`, `scale`, `withAlpha`, plus named
constants).

## Encoding

```ts
import { encodeWebP } from "./src/webp/index.ts";

const file = encodeWebP(frames, { frameDurationMs: 500, loopCount: 0 });
```

One frame produces a still WebP; two or more produce an animated one
(`VP8X` + `ANIM` + one `ANMF` per frame). `frameDurationMs` also accepts an
array for per-frame timing, and `loopCount: 0` loops forever.

`src/webp/` is a self-contained lossless WebP encoder — no native
dependencies, which keeps it working anywhere Bun runs:

- `bit-writer.ts` — LSB-first bitstream writer
- `huffman.ts` — depth-limited canonical prefix codes
- `vp8l.ts` — the VP8L lossless bitstream
- `container.ts` — RIFF/WebP container and animation chunks

Frames are encoded as prefix-coded literals with no transforms, color cache or
LZ77 back-references. That is pixel-exact and small enough at this size (a few
KB per frame, 30 bytes for a flat one), and the obvious compression wins can be
added inside `vp8l.ts` without changing anything above it.
