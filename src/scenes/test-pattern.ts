import { hex, mix, ORANGE, CYAN, WHITE } from "../color.ts";
import {
  createFrame,
  drawLine,
  fillCircle,
  fillRect,
  strokeRect,
  setPixel,
  type Frame,
  FRAME_WIDTH,
  FRAME_HEIGHT,
} from "../frame.ts";

const BACKGROUND = hex("#0b1021");
const BORDER = hex("#22305e");

/**
 * Two frames of simple geometry that swap places, so the animation is
 * obviously moving when rendered.
 */
export function testPattern(): Frame[] {
  return [buildFrame(0), buildFrame(1)];
}

function buildFrame(phase: 0 | 1): Frame {
  const frame = createFrame(BACKGROUND);
  const flipped = phase === 1;

  strokeRect(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, BORDER);

  // A diagonal that swings between the two corners.
  drawLine(
    frame,
    2,
    flipped ? FRAME_HEIGHT - 3 : 2,
    FRAME_WIDTH - 3,
    flipped ? 2 : FRAME_HEIGHT - 3,
    mix(BORDER, WHITE, 0.35),
  );

  // Square and circle trade sides.
  const squareX = flipped ? FRAME_WIDTH - 16 : 6;
  const circleX = flipped ? 16 : FRAME_WIDTH - 16;
  fillRect(frame, squareX, 11, 10, 10, ORANGE);
  fillCircle(frame, circleX, 16, 5, CYAN);

  // Blinking corner markers.
  for (let i = 0; i < 4; i++) {
    const x = flipped ? FRAME_WIDTH - 3 - i : 2 + i;
    setPixel(frame, x, 3, WHITE);
    setPixel(frame, x, FRAME_HEIGHT - 4, WHITE);
  }

  return frame;
}
