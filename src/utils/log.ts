
export function log(msg: string, error?: unknown) {
    if (error != null) {
        console.error(`[${new Date().toISOString()}] ${msg}:`, error)
    } else {
        console.log(`[${new Date().toISOString()}] ${msg}`)
    }
}