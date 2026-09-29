/**
 * Grid coordinate helpers. A position is a plain `{ x, y }` object where
 * x is the column (0 = left) and y is the row (0 = top).
 */

/** True modulo that always returns a non-negative result (for wrap-around). */
export function mod(n, m) {
  return ((n % m) + m) % m;
}
