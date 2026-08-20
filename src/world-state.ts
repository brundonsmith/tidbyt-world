import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { setInterval } from "node:timers/promises";

const INITIAL_WORLD_STATE = {
    x: 1,
    y: 1,
    direction: 'east' as 'north' | 'south' | 'west' | 'east'
}

const pixels_per_second = 15
export const square_size = 10

export function updateWorld(currentWorldState: WorldState, delta_ms: number): WorldState {
    const distance = pixels_per_second * delta_ms / 1000

    switch (currentWorldState.direction) {
        case 'east': {
            const bound = 64 - 1 - square_size
            if (currentWorldState.x < bound) {
                return { ...currentWorldState, x: Math.min(currentWorldState.x + distance, bound) }
            } else {
                return updateWorld({ ...currentWorldState, direction: 'south' }, delta_ms)
            }
        }
        case "south": {
            const bound = 32 - 1 - square_size
            if (currentWorldState.y < bound) {
                return { ...currentWorldState, y: Math.min(currentWorldState.y + distance, bound) }
            } else {
                return updateWorld({ ...currentWorldState, direction: 'west' }, delta_ms)
            }
        }
        case "west": {
            const bound = 1
            if (currentWorldState.x > bound) {
                return { ...currentWorldState, x: Math.max(currentWorldState.x - distance, bound) }
            } else {
                return updateWorld({ ...currentWorldState, direction: 'north' }, delta_ms)
            }
        }
        case "north": {
            const bound = 1
            if (currentWorldState.y > bound) {
                return { ...currentWorldState, y: Math.max(currentWorldState.y - distance, bound) }
            } else {
                return updateWorld({ ...currentWorldState, direction: 'east' }, delta_ms)
            }
        }
    }
}

////////////////// Machinery

export const tronbytDwellMs = 1_000
export const subFrames = 10
export const frameDurationMs = tronbytDwellMs / subFrames

export type WorldState = typeof INITIAL_WORLD_STATE

const worldStatePath = import.meta.dir + '/world-state-last.json'
const tryLoad = () => {
    try {
        const parsed = JSON.parse(readFileSync(worldStatePath, 'utf-8'))
        return parsed as WorldState
    } catch {
        return undefined
    }
}

export let worldState = tryLoad() ?? INITIAL_WORLD_STATE

export async function start() {
    // let last = performance.now();
    for await (const _ of setInterval(frameDurationMs)) {
        // const now = performance.now();

        worldState = updateWorld(worldState, frameDurationMs);

        await writeFile(worldStatePath, JSON.stringify(worldState, null, 2))
        // last = now;
    }
}