import { AppearancePattern, norm360 } from './AppearancePattern.js';

/**
 * Rotation by a repeating *sequence* of deltas rather than a single constant
 * step. This produces the "45° then 90° then 135° then 180° ..." style clues,
 * as well as any other non-uniform turn pattern.
 *
 * The rotation at time t is the cumulative sum of the first t deltas (the
 * sequence repeats if t runs past its end), so extrapolating the next frame is
 * still just evaluating a larger t.
 *
 *   RotationSequencePattern({ deltas: [45, 90], dir: 1 })
 *     t: 0    1     2      3      4
 *     °: 0    45    135    180    270 ...
 */
export class RotationSequencePattern extends AppearancePattern {
  constructor({ deltas = [45, 90], dir = 1 }) {
    super();
    this.deltas = deltas;
    this.dir = dir >= 0 ? 1 : -1;
  }

  get id() {
    return `rotseq(${this.dir}:${this.deltas.join(',')})`;
  }

  valueAt(t) {
    let angle = 0;
    for (let i = 0; i < t; i++) {
      angle += this.dir * this.deltas[i % this.deltas.length];
    }
    return { rotation: norm360(angle) };
  }

  describe() {
    const dir = this.dir > 0 ? 'clockwise' : 'anticlockwise';
    return `rotates ${dir} by ${this.deltas.join('°, then ')}° (repeating)`;
  }
}
