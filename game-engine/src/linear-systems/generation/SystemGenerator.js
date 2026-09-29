import { determinant, multiply, solveUnique } from '../core/matrix.js';
import { LinearSystemPuzzle } from '../Puzzle.js';

/** Variable names in order: a, b, c, d, e, … (only `vars` of them are used). */
const NAME_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Builds a Linear System puzzle from a LevelConfig.
 *
 * The maths (why a unique integer solution is guaranteed):
 *   1. Pick the target solution vector `v` — each unknown a random integer in
 *      the level's value range.
 *   2. Build a random integer coefficient matrix `A`, forcing some entries to
 *      zero per `zeroChance` (the difficulty lever). Reject any `A` that is
 *      singular (det = 0) or that leaves a row/column all-zero (an all-zero
 *      column means that variable is unconstrained → not a unique solution).
 *   3. `det(A) ≠ 0` ⇒ `A · x = b` has exactly one real solution. Setting
 *      `b = A · v` makes that unique solution `v` itself; since `v` is integer,
 *      it is also the unique integer solution.
 *
 * The determinant test uses exact BigInt arithmetic (see core/matrix.js), and
 * we additionally solve the finished system back and assert we recover `v` — a
 * belt-and-braces guarantee that the stated answer really is THE answer.
 *
 * The RNG is injected so a given seed always reproduces the same puzzle.
 */
export class SystemGenerator {
  /**
   * @param {object} deps
   * @param {import('../../core/Rng.js').Rng} deps.rng
   */
  constructor({ rng }) {
    this.rng = rng;
  }

  /**
   * @param {ReturnType<import('./LevelConfig.js').levelConfig>} config
   * @param {number} seed  Recorded on the puzzle for reproducibility.
   */
  generate(config, seed) {
    const { vars, valueRange } = config;
    const names = NAME_ALPHABET.slice(0, vars).split('');

    // 1. Chosen solution.
    const v = Array.from({ length: vars }, () =>
      this.rng.int(valueRange.min, valueRange.max),
    );

    // 2. Non-singular coefficient matrix with no empty row/column.
    const matrix = this._buildMatrix(config);

    // 3. Constants that force `v` to be the unique solution.
    const constants = multiply(matrix, v);

    // Self-check: solve it back and confirm we recover exactly `v`.
    const solved = solveUnique(matrix, constants);
    if (!solved || solved.some((x, i) => x !== v[i])) {
      throw new Error(
        'internal: generated system did not solve back to the chosen solution',
      );
    }

    const det = Number(determinant(matrix));

    const equations = matrix.map((coeffs, i) => ({
      coeffs,
      rhs: constants[i],
      text: formatEquation(coeffs, names, constants[i]),
    }));

    const values = {};
    names.forEach((n, i) => {
      values[n] = v[i];
    });

    return new LinearSystemPuzzle({
      id: `linsys-L${config.level}-${vars}v-${seed}`,
      seed,
      level: config.level,
      variables: names,
      valueRange: { ...valueRange },
      equations,
      matrix,
      constants,
      solution: { values, vector: v, determinant: det },
    });
  }

  /** Retry random matrices until one is non-singular with no empty row/column. */
  _buildMatrix(config) {
    const maxAttempts = 500;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const A = this._randomMatrix(config);
      if (!this._structureOk(A)) continue;
      if (determinant(A) === 0n) continue;
      return A;
    }
    throw new Error(
      `could not build a non-singular ${config.vars}×${config.vars} system ` +
        `after ${maxAttempts} attempts (zeroChance too high?)`,
    );
  }

  _randomMatrix(config) {
    const { vars } = config;
    const A = [];
    for (let i = 0; i < vars; i++) {
      const row = [];
      for (let j = 0; j < vars; j++) row.push(this._coeff(config));
      A.push(row);
    }
    return A;
  }

  /** One coefficient: 0 with probability `zeroChance`, else a signed magnitude. */
  _coeff({ coeffRange, allowNegativeCoeffs, zeroChance }) {
    if (this.rng.next() < zeroChance) return 0;
    const mag = this.rng.int(coeffRange.min, coeffRange.max);
    if (allowNegativeCoeffs && this.rng.next() < 0.5) return -mag;
    return mag;
  }

  /** Reject a matrix with an all-zero row (degenerate) or column (free variable). */
  _structureOk(A) {
    const n = A.length;
    for (let i = 0; i < n; i++) if (A[i].every((x) => x === 0)) return false;
    for (let j = 0; j < n; j++) if (A.every((row) => row[j] === 0)) return false;
    return true;
  }
}

/**
 * Render one equation as readable text, e.g. `[3, 0, -1, 1], [a,b,c,d], 57`
 * → `"3a - c + d = 57"`. Zero terms are omitted, a coefficient of 1 is dropped
 * (`a`, not `1a`), and signs are laid out with spaces between terms.
 */
export function formatEquation(coeffs, names, rhs) {
  const terms = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const mag = Math.abs(c);
    const body = (mag === 1 ? '' : String(mag)) + names[i];
    terms.push({ negative: c < 0, body });
  });

  if (terms.length === 0) return `0 = ${rhs}`; // guarded against upstream

  let s = (terms[0].negative ? '-' : '') + terms[0].body;
  for (let i = 1; i < terms.length; i++) {
    s += (terms[i].negative ? ' - ' : ' + ') + terms[i].body;
  }
  return `${s} = ${rhs}`;
}
