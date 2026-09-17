// Seeded PRNG (mulberry32) with small helpers for deterministic mock data.
// Plain ES module, no dependencies. Works in the browser and in Node.

/**
 * Create a seeded pseudo-random generator.
 * @param {number} seed - 32-bit integer seed.
 * @returns {{
 *   next: () => number,
 *   normal: (mean?: number, sd?: number) => number,
 *   int: (min: number, max: number) => number,
 *   pick: <T>(arr: T[]) => T,
 *   shuffle: <T>(arr: T[]) => T[],
 *   uniform: (a: number, b: number) => number,
 *   lognormal: (median: number, sigma: number) => number
 * }}
 */
export function createRng(seed) {
  let a = seed >>> 0;

  // mulberry32: returns a function producing floats in [0, 1)
  function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Box-Muller transform for normal(mean, sd) draws.
  // Caches the second value from each pair of uniform draws.
  let spare = null;
  function normal(mean = 0, sd = 1) {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return mean + sd * v;
    }
    let u1 = next();
    let u2 = next();
    // avoid log(0)
    if (u1 < 1e-12) u1 = 1e-12;
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);
    spare = z1;
    return mean + sd * z0;
  }

  // Integer in [min, max] inclusive.
  function int(min, max) {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  // Random element of arr.
  function pick(arr) {
    return arr[int(0, arr.length - 1)];
  }

  // Fisher-Yates shuffle; returns a new array, does not mutate the input.
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // Uniform float in [a, b).
  function uniform(a2, b) {
    return a2 + (b - a2) * next();
  }

  // Lognormal draw with a given median and sigma (of the underlying normal).
  function lognormal(median, sigma) {
    const mu = Math.log(median);
    return Math.exp(mu + sigma * normal(0, 1));
  }

  return { next, normal, int, pick, shuffle, uniform, lognormal };
}
