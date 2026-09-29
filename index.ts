import type { Frame } from "./src/utils/frame.ts";
import { startWeatherPolling } from "./src/utils/weather.ts";
import { encodeWebP } from "./src/utils/webp/index.ts";
import { frameDurationMs, start, subFrames, tronbytDwellMs, updateWorld, worldState } from "./src/world-state.ts";
import { worldView } from "./src/world-view.ts";
import { sunHeight } from "./src/world.ts";

// `bun --hot` keeps the process alive after an uncaught error, which leaves the
// world loop dead while the server keeps serving a frozen frame. Exit instead so
// systemd restarts us. Guarded because hot reloads re-run this module.
const g = globalThis as { crashHandlersInstalled?: boolean };
if (!g.crashHandlersInstalled) {
  g.crashHandlersInstalled = true;
  const crash = (err: unknown) => {
    console.error(`[${new Date().toISOString()}] fatal:`, err);
    process.exit(1);
  };
  process.on("uncaughtException", crash);
  process.on("unhandledRejection", crash);
}

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
          frames.push(worldView(predictedState, Date.now() + i * frameDurationMs))
          predictedState = updateWorld(predictedState, frameDurationMs)
        }

        const webp = encodeWebP(frames, { frameDurationMs: frameDurationMs });
        return new Response(webp, {
          headers: {
            "content-type": "image/webp",
            "cache-control": "no-store",
            "Tronbyt-Dwell-Secs": String(tronbytDwellMs / 1_000),
            "Tronbyt-Brightness": String(sunHeight() * 20 + 10)
          },
        });
      },
    },
  },

  fetch: () => new Response("Not found", { status: 404 }),
});

console.log(`Listening on ${server.url}`);

void start()
void startWeatherPolling()

console.log('Started world!')