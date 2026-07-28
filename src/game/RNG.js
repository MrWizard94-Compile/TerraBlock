/**
 * Seeded PRNG (Mulberry32). Deterministic sequences for tests and reproducible drops.
 */

/** @param {number} seed */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  /** @param {number} [seed] */
  constructor(seed = (Math.random() * 0xffffffff) >>> 0) {
    this.seed = seed >>> 0;
    this._next = mulberry32(this.seed);
  }

  /** @returns {number} [0,1) */
  next() {
    return this._next();
  }

  /** inclusive min, exclusive max */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /** inclusive integer bounds */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    if (!arr.length) return undefined;
    return arr[this.int(0, arr.length - 1)];
  }

  /** derive a child stream without mutating this one permanently */
  fork(salt = 0) {
    return new RNG((this.seed ^ (salt * 0x9e3779b9)) >>> 0);
  }
}
