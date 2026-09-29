/**
 * Seedable pseudo-random number generator (mulberry32).
 *
 * Injected everywhere randomness is needed so that a given `seed` always
 * reproduces the same puzzle. This is the only source of randomness in the
 * engine — no direct `Math.random()` calls elsewhere (Dependency Inversion).
 */
export class Rng {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  /** Float in [0, 1). */
  next() {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick one element from a non-empty array. */
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  /**
   * Weighted pick: `weightFn(item)` returns a non-negative weight. Items with
   * larger weights are proportionally more likely. Used so difficulty can bias
   * which dimensions and patterns appear (e.g. favour movement) rather than
   * choosing uniformly.
   */
  weighted(items, weightFn) {
    const weights = items.map(weightFn);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return this.pick(items);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Return a shuffled copy (Fisher–Yates), leaving the input untouched. */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
