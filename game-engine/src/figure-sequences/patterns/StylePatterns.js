import { AppearancePattern } from './AppearancePattern.js';

/**
 * Style patterns — the sprite's *decoration* changes over time while it stays
 * put. Three small toggling patterns, one per style property:
 *
 *   BorderPattern → a border appears/disappears each step
 *   BoldPattern   → the glyph toggles bold/normal each step
 *   SizePattern   → the glyph alternates big/small each step
 *
 * They share the same "toggle each step" shape, so `next` is always the
 * opposite of the current frame. Combine with EveryNth for slower AABB rhythms.
 */

export class BorderPattern extends AppearancePattern {
  get id() {
    return 'border';
  }

  valueAt(t) {
    return { bordered: t % 2 === 1 };
  }

  describe() {
    return 'gains and loses a border each step';
  }
}

export class BoldPattern extends AppearancePattern {
  get id() {
    return 'bold';
  }

  valueAt(t) {
    return { bold: t % 2 === 1 };
  }

  describe() {
    return 'toggles bold on and off each step';
  }
}

export class SizePattern extends AppearancePattern {
  get id() {
    return 'size';
  }

  valueAt(t) {
    return { size: t % 2 === 0 ? 'big' : 'small' };
  }

  describe() {
    return 'alternates between big and small each step';
  }
}
