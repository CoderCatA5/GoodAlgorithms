/**
 * A sprite is a single game piece: a visual identity (shape + glyph + colour),
 * an origin cell, and the *layers* of behaviour it follows.
 *
 * `layers` is an array of `{ dimId, pattern }` — one entry per dimension the
 * puzzle varies. A puzzle may layer several dimensions at once (e.g. a sprite
 * that both moves AND rotates), so the sprite carries one pattern per active
 * dimension and the generator composes them into a placement at each step.
 *
 * `shape` tells the renderer how to draw it: 'plain' uses `glyph` directly,
 * 'arrow' resolves an arrow from the rotation/flip state, and 'circle' /
 * 'square' / 'triangle' pick a big or small variant from the size state.
 *
 * Decoys are ordinary sprites flagged `isDecoy`. They follow real patterns like
 * anyone else — what makes them red herrings is *how the generator uses them*:
 * decoys sit out answer/distractor generation and are then stamped identically
 * onto every option, so they can distract but never decide the answer.
 */
export class Sprite {
  /**
   * @param {object}  opts
   * @param {string}  opts.id
   * @param {string}  opts.shape   'plain' | 'arrow' | 'circle' | 'square' | 'triangle'
   * @param {string}  opts.glyph   Base character (used by 'plain').
   * @param {string}  opts.color   Chalk colour name.
   * @param {{x,y}}   opts.origin  Position at t = 0.
   * @param {Array<{dimId:string, pattern:object}>} opts.layers  One behaviour
   *        pattern per active dimension. Composed in order into a placement.
   * @param {boolean} [opts.isDecoy]
   */
  constructor({ id, shape, glyph, color, origin, layers, isDecoy = false }) {
    this.id = id;
    this.shape = shape;
    this.glyph = glyph;
    this.color = color;
    this.origin = origin;
    this.layers = layers;
    this.isDecoy = isDecoy;
  }
}
