import { CYAN, rgb, WHITE } from "./color";
import type { Frame } from "./frame";

const RED = rgb(217, 87, 99)
const BLUE = rgb(48, 96, 130)
const TAN = rgb(238, 195, 154)
const BROWN = rgb(102, 57, 49)
const ICY = WHITE // rgb(203, 219, 252)

const base = [
    [BROWN, BROWN, BROWN, BROWN, BROWN, BROWN, null],
    [null, BROWN, BROWN, BROWN, BROWN, BROWN, BROWN],
    [BROWN, TAN, TAN, TAN, TAN, TAN, BROWN],
    [BROWN, TAN, TAN, TAN, TAN, TAN, BROWN],
    [null, TAN, ICY, TAN, ICY, TAN, null],
    [null, TAN, TAN, TAN, TAN, TAN, null],
    [null, null, TAN, TAN, TAN, null, null],
    [RED, RED, RED, RED, RED, RED, RED],
    [RED, RED, RED, RED, RED, RED, RED],
    [null, RED, RED, RED, RED, RED, null],
    [null, BLUE, BLUE, BLUE, BLUE, BLUE, null],
    [null, BLUE, BLUE, null, BLUE, BLUE, null],
    [null, BLUE, BLUE, null, BLUE, BLUE, null],
    [null, BLUE, BLUE, null, BLUE, BLUE, null],
    [null, BLUE, BLUE, null, BLUE, BLUE, null],
]

const flipped: Frame = new Array(base[0]?.length ?? 0).fill(null).map(() => [])
for (let y = 0; y < base.length; y++) {
    for (let x = 0; x < base[y]!.length; x++) {
        flipped[x]![y] = base[y]![x]!
    }
}

const blink = JSON.parse(JSON.stringify(flipped)) as Frame
blink[2]![4] = TAN
blink[4]![4] = TAN

export const guy: Frame[] = [flipped, blink]
export const guyHeight = base.length
export const guyWidth = flipped.length