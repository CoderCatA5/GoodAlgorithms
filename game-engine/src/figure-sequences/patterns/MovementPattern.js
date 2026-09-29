/**
 * Base class / interface for movement patterns (Strategy).
 *
 * A pattern is a pure function of (origin, t): it returns the absolute board
 * position of a sprite at time-step `t`, given where it started at t = 0.
 * Because positions are computed from the origin (not iteratively mutated),
 * generating a whole trajectory and extrapolating "what comes next" are the
 * same operation — just call `positionAt` with a larger `t`.
 *
 * Subclasses must implement `id` and `positionAt`. `describe()` is a
 * human-readable explanation used by the pretty-printer's answer key.
 */
export class MovementPattern {
  /** @returns {string} stable identifier, e.g. "step(0,-1)". */
  get id() {
    throw new Error('MovementPattern.id must be implemented');
  }

  /**
   * @param {{x:number,y:number}} origin  Position at t = 0.
   * @param {number}              t       Time-step (0-based).
   * @param {import('../core/Board.js').Board} board
   * @returns {{x:number,y:number}}
   */
  positionAt(origin, t, board) {
    throw new Error('MovementPattern.positionAt must be implemented');
  }

  /** @returns {string} human-readable description for the answer key. */
  describe() {
    return this.id;
  }
}
