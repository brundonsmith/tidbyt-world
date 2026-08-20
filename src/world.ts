import { rgb } from "./color";

export function sunHeight(date = new Date()) {
    const h = date.getHours() + date.getMinutes() / 60;
    const DAWN = 5.5, DUSK = 19.5;
    const t = (h - DAWN) / (DUSK - DAWN);
    return t < 0 || t > 1 ? 0 : Math.sin(t * Math.PI);
}

export const groundHeight = 2

export const groundColor = rgb(55, 148, 110)

export const skyColor = rgb(91, 110, 225)