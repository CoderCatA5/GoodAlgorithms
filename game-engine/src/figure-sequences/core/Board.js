import { mod } from './Vector.js';

/**
 * Immutable board geometry (default 5×5). Keeping the size configurable rather
 * than hard-coding 5 costs nothing and keeps rendering/generation decoupled
 * from a magic number.
 */
export class Board {
  constructor(width = 5, height = 5) {
    this.width = width;
    this.height = height;
  }

  contains(p) {
    return p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height;
  }

  /** Wrap a position onto the board (toroidal), so sprites never fall off. */
  wrap(p) {
    return { x: mod(p.x, this.width), y: mod(p.y, this.height) };
  }
}
