import { MovementPattern } from './MovementPattern.js';

/** Normalise any angle to [0, 360). */
export const norm360 = (a) => ((a % 360) + 360) % 360;

/**
 * Base class for appearance patterns (Strategy) — the visual counterpart of
 * MovementPattern. Where a MovementPattern answers "where is the sprite at
 * time t", an AppearancePattern answers "how does it LOOK at time t".
 *
 * `valueAt(t)` returns a partial appearance object (only the fields this
 * pattern controls), e.g. `{ rotation }` or `{ flipX, flipY }`. It depends
 * only on `t`, so extrapolating "what comes next" is just a larger `t` — same
 * contract as movement.
 */
export class AppearancePattern {
  get id() {
    throw new Error('AppearancePattern.id must be implemented');
  }

  /** @param {number} t @returns {object} partial appearance. */
  valueAt(t) {
    throw new Error('AppearancePattern.valueAt must be implemented');
  }

  describe() {
    return this.id;
  }
}

// Re-export so callers can `instanceof`-check the movement base from here too.
export { MovementPattern };
