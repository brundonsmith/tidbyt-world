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
import { guy } from "./guy.ts";
import { square_size, type WorldState } from "./world-state.ts";

// const BACKGROUND = hex("#0b1021");
const BORDER = hex("#22305e");

/**
 * Two frames of simple geometry that swap places, so the animation is
 * obviously moving when rendered.
 */
export function worldView(worldState: WorldState, now: number): Frame {
    const frame = createFrame();

    strokeRect(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, BORDER);

    fillRect(frame, worldState.x, worldState.y, square_size, square_size, WHITE)

    const blinking = (now % 1000) < 200
    blit(frame, blinking ? guy[1]! : guy[0]!, 29, 17)

    return frame;
}