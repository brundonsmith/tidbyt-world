import { PNG } from "pngjs";
import type { Color } from "./color";

export async function loadSprite(path: string): Promise<Color[][]> {
    const bytes = await Bun.file(path).arrayBuffer();
    const png = PNG.sync.read(Buffer.from(bytes));
    const { width, height, data } = png;

    const sprite: Color[][] = Array.from(
        { length: width },
        () => new Array<Color>(height),
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            sprite[x]![y] = {
                r: data[i]!,
                g: data[i + 1]!,
                b: data[i + 2]!,
                a: data[i + 3]!,
            };
        }
    }

    return sprite;
}