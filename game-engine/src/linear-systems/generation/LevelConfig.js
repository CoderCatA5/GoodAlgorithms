/**
 * Difficulty knobs for the Linear System game, derived from a single `level`
 * number so any level works (no fixed table) — the same philosophy as the
 * Figure Sequences `LevelConfig`.
 *
 * The core difficulty lever the design calls for is `zeroChance`: how often a
 * coefficient is forced to 0. EASY levels are sparse (many zeros → the system
 * mostly decouples and solves by simple substitution); HARDER levels grow
 * denser, allow negative coefficients, and use larger magnitudes.
 */

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * @param {number} level  1 = easiest, grows unbounded.
 * @returns {{
 *   level:number, vars:number, valueRange:{min:number,max:number},
 *   coeffRange:{min:number,max:number}, allowNegativeCoeffs:boolean,
 *   zeroChance:number
 * }}
 */
export function levelConfig(level = 1) {
  const lvl = Math.max(1, Math.floor(level));

  // Nonzero coefficient magnitude grows with level: L1 → 1..3, then +1 each
  // level, capped at 9 so hand-arithmetic stays sane.
  const coeffMax = clamp(2 + lvl, 3, 9);

  // Zero-forcing: HIGH when easy, decaying as the level rises. Capped at 0.6 so
  // a non-singular matrix with no empty row/column is still reliably reachable
  // within the generator's bounded retry budget (a denser floor guarantees
  // enough live coefficients to avoid an unconstrained variable).
  const zeroChance = clamp(0.6 - 0.1 * (lvl - 1), 0.05, 0.6);

  return {
    level: lvl,

    // Always four unknowns (a, b, c, d). Kept in config so a host CAN override
    // it, but the game's default and intent is a 4×4 system.
    vars: 4,

    // Each unknown is an integer in this inclusive range — the "1..n" spec.
    valueRange: { min: 1, max: 20 },

    // Magnitude of a nonzero coefficient (sign applied separately).
    coeffRange: { min: 1, max: coeffMax },

    // Negatives only from level 2 up — level 1 stays all-positive and gentle.
    allowNegativeCoeffs: lvl >= 2,

    zeroChance,
  };
}
