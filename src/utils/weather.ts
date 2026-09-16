import { setInterval } from "node:timers/promises";

type Sky = "clear" | "cloudy" | "rain" | "snow";

export let sky: Sky = "clear"

const HOME = [30.34368, 97.73773] as const

export async function startWeatherPolling() {
    sky = await getSky(HOME)
    for await (const _ of setInterval(15 * 60 * 1_000)) {
        sky = await getSky(HOME)
    }
}

export async function getSky([lat, lon]: readonly [number, number]): Promise<Sky> {
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

// Code	Description
// 0	Clear sky
// 1, 2, 3	Mainly clear, partly cloudy, and overcast
// 45, 48	Fog and depositing rime fog
// 51, 53, 55	Drizzle: Light, moderate, and dense intensity
// 56, 57	Freezing Drizzle: Light and dense intensity
// 61, 63, 65	Rain: Slight, moderate and heavy intensity
// 66, 67	Freezing Rain: Light and heavy intensity
// 71, 73, 75	Snow fall: Slight, moderate, and heavy intensity
// 77	Snow grains
// 80, 81, 82	Rain showers: Slight, moderate, and violent
// 85, 86	Snow showers slight and heavy
// 95 *	Thunderstorm: Slight or moderate
// 96, 99 *	Thunderstorm with slight and heavy hail