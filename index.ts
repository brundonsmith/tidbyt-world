import type { Frame } from "./src/frame.ts";
import { encodeWebP } from "./src/webp/index.ts";
import { start, subFrames, tronbytDwellMs, updateWorld, worldState } from "./src/world-state.ts";
import { worldView } from "./src/world-view.ts";

const PORT = Number(Bun.env.PORT ?? 3000);

const server = Bun.serve({
  port: PORT,
  routes: {
    "/": new Response("Hello, world!", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),

    "/look": {
      GET: () => {

        const frames: Frame[] = []
        let predictedState = worldState
        for (let i = 0; i < subFrames; i++) {
          frames.push(worldView(predictedState))
          predictedState = updateWorld(predictedState, tronbytDwellMs / subFrames)
        }

        const webp = encodeWebP(frames, { frameDurationMs: tronbytDwellMs / subFrames });
        return new Response(webp, {
          headers: {
            "content-type": "image/webp",
            "cache-control": "no-store",
            "Tronbyt-Dwell-Secs": String(tronbytDwellMs / 1_000),
            "Tronbyt-Brightness": "50"
          },
        });
      },
    },
  },

  fetch: () => new Response("Not found", { status: 404 }),
});

console.log(`Listening on ${server.url}`);

void start()

console.log('Started world!')