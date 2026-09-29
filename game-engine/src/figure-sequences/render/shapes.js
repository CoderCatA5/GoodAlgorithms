/**
 * Glyph resolution — turns a placement's shape + appearance state into the
 * single character to draw. Kept separate from the PrettyPrinter so the mapping
 * from "abstract appearance" to "concrete glyph" lives in one place and can be
 * reused by any renderer.
 *
 * Directional glyphs (arrows) are how rotation and flips are shown: the 8
 * arrows are exact 45° steps, and a mirror is just a different arrow in the
 * same family — so a solver reads orientation directly off the shape.
 */

// 8 arrows at 45° increments, clockwise starting from "up".
//   index: 0=↑ 1=↗ 2=→ 3=↘ 4=↓ 5=↙ 6=← 7=↖
const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];

// Shapes that come in a small and a big variant (for the size dimension).
// All single-width BMP characters, so grid columns stay aligned.
const SIZED = {
  circle: { small: '•', big: '●' },
  square: { small: '▪', big: '■' },
  triangle: { small: '▴', big: '▲' },
};

/**
 * @param {object} p  A placement: { shape, glyph, rotation, flipX, flipY, size }
 * @returns {string}  The character to render (before colour/style styling).
 */
export function resolveGlyph(p) {
  if (p.shape === 'arrow') {
    let idx = ((Math.round((p.rotation ?? 0) / 45) % 8) + 8) % 8;
    // Reflections: mirror across Y (left↔right) maps idx→(8-idx); mirror across
    // X (up↔down) maps idx→(4-idx). Applying both is a 180° rotation.
    if (p.flipY) idx = (8 - idx) % 8;
    if (p.flipX) idx = (4 - idx + 8) % 8;
    return ARROWS[idx];
  }
  if (SIZED[p.shape]) {
    return SIZED[p.shape][p.size === 'small' ? 'small' : 'big'];
  }
  return p.glyph; // plain shape: draw the base glyph as-is
}

export { ARROWS, SIZED };
