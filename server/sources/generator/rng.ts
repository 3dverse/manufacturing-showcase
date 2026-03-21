// mulberry32 seeded PRNG

export type RNG = {
    next(): number;
    nextInt(min: number, max: number): number;
    nextFloat(min: number, max: number): number;
    pick<T>(arr: T[]): T;
    shuffle<T>(arr: T[]): T[];
    bool(probability?: number): boolean;
    gaussian(mean: number, std: number): number;
};

export function createRng(seed: number): RNG {
    let s = seed >>> 0;

    function next(): number {
        s += 0x6d2b79f5;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        t = (t ^ (t >>> 14)) >>> 0;
        return t / 4294967296;
    }

    return {
        next,
        nextInt(min: number, max: number): number {
            return Math.floor(next() * (max - min + 1)) + min;
        },
        nextFloat(min: number, max: number): number {
            return next() * (max - min) + min;
        },
        pick<T>(arr: T[]): T {
            return arr[Math.floor(next() * arr.length)];
        },
        shuffle<T>(arr: T[]): T[] {
            const result = [...arr];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },
        bool(probability = 0.5): boolean {
            return next() < probability;
        },
        gaussian(mean: number, std: number): number {
            // Box-Muller transform
            const u1 = next();
            const u2 = next();
            const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
            return mean + std * z;
        },
    };
}
