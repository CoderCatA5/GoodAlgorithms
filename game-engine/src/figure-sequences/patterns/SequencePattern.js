import { MovementPattern } from './MovementPattern.js';

/**
 * Repeating sequence of offsets — e.g. an L-shaped knight move like in chess.
 * The position at time t is the origin plus the sum of the first t offsets,
 * cycling through the sequence. A single offset makes this behave like a
 * StepPattern; multiple offsets create a repeating multi-step cycle.
 */
export class SequencePattern extends MovementPattern {
  /**
   * @param {object} opts
   * @param {Array<{dx:number,dy:number}>} opts.offsets  Non-empty cycle.
   * @param {string} [opts.name]  Label for describe(), e.g. "knight".
   */
  constructor({ offsets, name = 'sequence' }) {
    super();
    if (!offsets?.length) throw new Error('SequencePattern needs at least one offset');
    this.offsets = offsets;
    this.name = name;
  }

  get id() {
    return `${this.name}[${this.offsets.map((o) => `${o.dx},${o.dy}`).join(';')}]`;
  }

  positionAt(origin, t, board) {
    let x = origin.x;
    let y = origin.y;
    for (let i = 0; i < t; i++) {
      const o = this.offsets[i % this.offsets.length];
      x += o.dx;
      y += o.dy;
    }
    return board.wrap({ x, y });
  }

  describe() {
    const seq = this.offsets.map((o) => `(${o.dx},${o.dy})`).join(' → ');
    return `moves like a ${this.name}, cycling offsets ${seq}`;
  }
}
