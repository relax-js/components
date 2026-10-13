/** A repeatable random sequence, so mock data looks the same on every reload. */
export function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function round(value: number, decimals = 0): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
