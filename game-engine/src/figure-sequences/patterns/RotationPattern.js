import { AppearancePattern, norm360 } from './AppearancePattern.js';

/**
 * Constant rotation: the sprite turns by a fixed angle every step, either
 * clockwise (dir = +1) or anticlockwise (dir = -1). Angle is a multiple of 45°
 * so it maps cleanly onto the 8 directional glyphs.
 *
 *   RotationPattern({ deltaDeg: 90, dir: 1 })  →  0° 90° 180° 270° 0° ...
 */
export class RotationPattern extends AppearancePattern {
  constructor({ deltaDeg = 90, dir = 1 }) {
    super();
    this.deltaDeg = deltaDeg;
    this.dir = dir >= 0 ? 1 : -1;
  }

  get id() {
    return `rot(${this.dir * this.deltaDeg})`;
  }

  valueAt(t) {
    return { rotation: norm360(this.dir * this.deltaDeg * t) };
  }

  describe() {
    return `rotates ${this.deltaDeg}° ${this.dir > 0 ? 'clockwise' : 'anticlockwise'} each step`;
  }
}
