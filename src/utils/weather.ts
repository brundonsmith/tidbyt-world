import { setInterval } from "node:timers/promises";

type Sky = "clear" | "cloudy" | "rain" | "snow";

export let sky: Sky = "clear"

export async function start() {
    for await (const _ of setInterval(15 * 60 * 1_000)) {
        sky = await getSky(30.26426, 97.74750)
    }
}

export async function getSky(lat: number, lon: number): Promise<Sky> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`;
    const res = await fetch(url);
    const { current } = await res.json() as any;
    const code: number = current.weather_code;

    if (code === 0 || code === 1) return "clear";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 85 && code <= 86) return "snow";
    if (code >= 95) return "rain";
    return "cloudy";
}
