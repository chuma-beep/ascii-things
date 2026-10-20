/** Small, fast, seedable PRNG. Deterministic across runs and platforms. */
export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [lo, hi). */
  range(lo: number, hi: number): number;
  /** Integer in [lo, hi], inclusive. */
  int(lo: number, hi: number): number;
}

/**
 * mulberry32. The same seed produces the same world, which makes screenshots,
 * tests, and shareable links reproducible.
 */
export function createRng(seed?: number): Rng {
  let state = (seed ?? Math.floor(Math.random() * 0x100000000)) >>> 0;
  if (state === 0) state = 0x9e3779b9;

  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (lo, hi) => lo + next() * (hi - lo),
    int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)),
  };
}
