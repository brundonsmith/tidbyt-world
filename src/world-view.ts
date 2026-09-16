import { hex } from "./utils/color.ts";
import {
    createFrame,
    fillRect,
    type Frame,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    blit,
} from "./utils/frame.ts";
import { loadSprite } from "./utils/png.ts";
import { sky } from "./utils/weather.ts";
// import { guy, guyHeight } from "./guy.ts";
import { type WorldState } from "./world-state.ts";
import { groundColor, groundHeight, sunHeight } from "./world.ts";

// const BACKGROUND = hex("#0b1021");
const BORDER = hex("#22305e");

const [guy, guyBlink] = await loadSprite(import.meta.dir + '/../sprites/guy.png', 2)
const guyHeight = guy![0]!.length

const [clouds, rain, sun1, sun2, moon] = await loadSprite(import.meta.dir + '/../sprites/weather.png', 5)

/**
 * Two frames of simple geometry that swap places, so the animation is
 * obviously moving when rendered.
 */
export function worldView(worldState: WorldState, now: number): Frame {
    const frame = createFrame();

    // fillRect(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, skyColor);

    // fillRect(frame, worldState.x, worldState.y, square_size, square_size, WHITE)

    fillRect(frame, 0, FRAME_HEIGHT - groundHeight, FRAME_WIDTH, groundHeight, groundColor)

    const blinking = (now % 1000) < 50
    blit(frame, blinking ? guyBlink! : guy!, worldState.x, FRAME_HEIGHT - groundHeight - guyHeight)

    switch (sky) {
        case "clear": blit(frame,
            sunHeight() <= 0
                ? moon!
                : (now % 2000 < 1000) ? sun1! : sun2!
            , 0, 0); break
        case "cloudy": blit(frame, clouds!, 0, 0); break
        case "rain": blit(frame, rain!, 0, 0); break
        case "snow": blit(frame, rain!, 0, 0); break
    }

    return frame;
}