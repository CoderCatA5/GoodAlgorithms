/**
 * "Every Nth frame" decorator (Decorator pattern). It wraps ANY appearance
 * pattern and slows it down: the underlying effect only advances once every N
 * frames, so it appears to change on every 2nd (or 3rd, ...) board and hold in
 * between.
 *
 * Implemented as a time-warp: sample the inner pattern at floor(t / n). e.g.
 * with n = 2 the inner pattern sees t = 0,0,1,1,2,2 as the real t goes
 * 0,1,2,3,4,5 — so a rotating sprite turns on frames 0, 2, 4 and pauses on the
 * odd ones.
 */

/** Wraps an AppearancePattern so the sprite only changes every `n` frames. */
export class EveryNthAppearance {
  constructor(inner, n = 2) {
    this.inner = inner;
    this.n = n;
  }

  get id() {
    return `${this.inner.id}@every${this.n}`;
  }

  valueAt(t) {
    return this.inner.valueAt(Math.floor(t / this.n));
  }

  describe() {
    return `${this.inner.describe()} — but only every ${this.n} frames`;
  }
}
