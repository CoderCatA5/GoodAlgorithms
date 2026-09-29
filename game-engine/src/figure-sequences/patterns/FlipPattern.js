import { AppearancePattern } from './AppearancePattern.js';

/**
 * Mirror-flip: the sprite reflects across the X axis (top↔bottom), the Y axis
 * (left↔right), or both. The flip toggles on and off each step — flipped on odd
 * frames, back to normal on even ones — so the "next" state is always the
 * opposite of the current one.
 *
 *   axis 'x'    → flipX toggles
 *   axis 'y'    → flipY toggles
 *   axis 'both' → both toggle together
 */
export class FlipPattern extends AppearancePattern {
  constructor({ axis = 'x' }) {
    super();
    this.axis = axis; // 'x' | 'y' | 'both'
  }

  get id() {
    return `flip(${this.axis})`;
  }

  valueAt(t) {
    const on = t % 2 === 1;
    return {
      flipX: this.axis !== 'y' && on,
      flipY: this.axis !== 'x' && on,
    };
  }

  describe() {
    const axis = this.axis === 'both' ? 'both the x and y axes' : `the ${this.axis} axis`;
    return `mirror-flips across ${axis} every step`;
  }
}
