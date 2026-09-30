import { log } from "node:console";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { setInterval } from "node:timers/promises";

const INITIAL_WORLD_STATE = {
    // x: 1,
    // y: 1,
    // direction: 'east' as 'north' | 'south' | 'west' | 'east',

    x: 29,
    destination: 50,
    state: 'idle' as 'idle' | 'walking-west' | 'walking-east'
}

// const pixels_per_second = 15
export const square_size = 10

export function updateWorld(currentWorldState: WorldState, delta_ms: number): WorldState {
    if (Math.abs(currentWorldState.destination - currentWorldState.x) < 0.45) {
        return { ...currentWorldState, x: Math.round(currentWorldState.x), destination: Math.round(Math.random() * (64 - 7)) } // guy width
    } else if (currentWorldState.destination > currentWorldState.x) {
        return { ...currentWorldState, x: currentWorldState.x + 4 * delta_ms / 1000 }
    } else if (currentWorldState.destination < currentWorldState.x) {
        return { ...currentWorldState, x: currentWorldState.x - 4 * delta_ms / 1000 }
    }

    return currentWorldState
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

        try {
            worldState = updateWorld(worldState, frameDurationMs);

            if (Date.now() % 5000 < 100) {
                try {
                    await writeFile(worldStatePath, JSON.stringify(worldState, null, 2))
                } catch (err) {
                    log('Writing world state to disk failed', err)
                }
            }
        } catch (err) {
            log('World update failed', err)
        }

        // last = now;
    }
}