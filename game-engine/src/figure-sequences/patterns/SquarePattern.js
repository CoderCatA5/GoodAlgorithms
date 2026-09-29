import { MovementPattern } from './MovementPattern.js';

/**
 * Orbits a small axis-aligned square, one corner per step. With the default
 * `side` of 2 the sprite walks a 2×2 block's four cells — right, down, left, up
 * for a clockwise loop (remember y increases downward) — returning home every
 * four steps.
 *
 * The square's top-left corner is derived from the sprite's origin but clamped
 * so the whole square stays on the board; that way the orbit always reads as a
 * square rather than wrapping around an edge. (Movement is the one place we
 * don't rely on the board's toroidal wrap, precisely so the shape stays intact.)
 */
export class SquarePattern extends MovementPattern {
  /**
   * @param {object}  opts
   * @param {number}  [opts.dir=1]   +1 clockwise, -1 anticlockwise.
   * @param {number}  [opts.side=2]  Corner spacing in cells (2 = a 2×2 block).
   */
  constructor({ dir = 1, side = 2 } = {}) {
    super();
    this.dir = dir >= 0 ? 1 : -1;
    this.side = side;
    const d = side - 1;
    // Corners in clockwise order from the top-left (y grows downward).
    this.corners = [
      { dx: 0, dy: 0 },
      { dx: d, dy: 0 },
      { dx: d, dy: d },
      { dx: 0, dy: d },
    ];
  }

  get id() {
    return `square(${this.dir === 1 ? 'cw' : 'ccw'},${this.side})`;
  }

  positionAt(origin, t, board) {
    // Clamp the top-left corner so the whole square fits on the board.
    const d = this.side - 1;
    const bx = Math.max(0, Math.min(origin.x, board.width - 1 - d));
    const by = Math.max(0, Math.min(origin.y, board.height - 1 - d));
    const n = this.corners.length;
    const idx = ((this.dir * t) % n + n) % n;
    const c = this.corners[idx];
    return { x: bx + c.dx, y: by + c.dy };
  }

  describe() {
    const way = this.dir === 1 ? 'clockwise' : 'anticlockwise';
    return `orbits a ${this.side}×${this.side} square ${way}`;
  }
}
