import { hex, CYAN, WHITE } from "./color.ts";
import {
    createFrame,
    fillRect,
    strokeRect,
    type Frame,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    blit,
} from "./frame.ts";
import { guy, guyHeight } from "./guy.ts";
import { square_size, type WorldState } from "./world-state.ts";
import { groundColor, groundHeight, skyColor } from "./world.ts";

// const BACKGROUND = hex("#0b1021");
const BORDER = hex("#22305e");

/**
 * Two frames of simple geometry that swap places, so the animation is
 * obviously moving when rendered.
 */
export function worldView(worldState: WorldState, now: number): Frame {
    const frame = createFrame();

    // fillRect(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, skyColor);

    // fillRect(frame, worldState.x, worldState.y, square_size, square_size, WHITE)

    fillRect(frame, 0, FRAME_HEIGHT - groundHeight, FRAME_WIDTH, groundHeight, groundColor)

    const [base, blink] = guy
    const blinking = (now % 1000) < 50
    blit(frame, blinking ? blink! : base!, worldState.x, FRAME_HEIGHT - groundHeight - guyHeight)

    return frame;
}