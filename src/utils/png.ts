import { PNG } from "pngjs";
import type { Color } from "./color";

export async function loadSprite(
    path: string,
    frameCount = 1,
): Promise<Color[][][]> {
    const bytes = await Bun.file(path).arrayBuffer();
    const png = PNG.sync.read(Buffer.from(bytes));
    const { width, height, data } = png;

    if (width % frameCount !== 0) {
        throw new Error(
            `Sheet width ${width} is not divisible by ${frameCount} frames`,
        );
    }
    const frameWidth = width / frameCount;

    const frames: Color[][][] = Array.from({ length: frameCount }, () =>
        Array.from({ length: frameWidth }, () => new Array<Color>(height)),
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            frames[Math.floor(x / frameWidth)]![x % frameWidth]![y] = {
                r: data[i]!,
                g: data[i + 1]!,
                b: data[i + 2]!,
                a: data[i + 3]!,
            };
        }
    }

    return frames;
}