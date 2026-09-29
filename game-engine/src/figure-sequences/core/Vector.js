/**
 * Grid coordinate helpers. A position is a plain `{ x, y }` object where
 * x is the column (0 = left) and y is the row (0 = top).
 */

/** True modulo that always returns a non-negative result (for wrap-around). */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

/** Structural equality of two positions. */
export function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

/** Stable string key for a position (useful for Set/Map de-duplication). */
export function posKey(p) {
  return `${p.x},${p.y}`;
}
