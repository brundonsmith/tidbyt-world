import { hex, CYAN, WHITE } from "./color.ts";
import {
    createFrame,
    fillRect,
    strokeRect,
    type Frame,
    FRAME_WIDTH,
    FRAME_HEIGHT,
} from "./frame.ts";
import { square_size, type WorldState } from "./world-state.ts";

// const BACKGROUND = hex("#0b1021");
const BORDER = hex("#22305e");

/**
 * Two frames of simple geometry that swap places, so the animation is
 * obviously moving when rendered.
 */
export function worldView(worldState: WorldState): Frame {
    const frame = createFrame();

    strokeRect(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, BORDER);

    fillRect(frame, worldState.x, worldState.y, square_size, square_size, WHITE)

    return frame;
}