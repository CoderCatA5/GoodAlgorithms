import { MovementPattern } from './MovementPattern.js';

const DIR_NAMES = {
  '0,-1': 'up',
  '0,1': 'down',
  '-1,0': 'left',
  '1,0': 'right',
  '1,-1': 'up-right diagonal',
  '-1,-1': 'up-left diagonal',
  '1,1': 'down-right diagonal',
  '-1,1': 'down-left diagonal',
};

/**
 * Constant-velocity movement: each step adds (dx, dy). Covers the simple
 * cardinal moves ("one up every time") and the diagonals, since a diagonal is
 * just dx and dy both non-zero.
 */
export class StepPattern extends MovementPattern {
  constructor({ dx, dy, board }) {
    super();
    this.dx = dx;
    this.dy = dy;
    this.board = board; // used only for describe(); wrapping is applied by caller
  }

  get id() {
    return `step(${this.dx},${this.dy})`;
  }

  positionAt(origin, t, board) {
    return board.wrap({ x: origin.x + this.dx * t, y: origin.y + this.dy * t });
  }

  describe() {
    const name = DIR_NAMES[`${this.dx},${this.dy}`] ?? `by (${this.dx},${this.dy})`;
    return `moves ${name} each step`;
  }
}
