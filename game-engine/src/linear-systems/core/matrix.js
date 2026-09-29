/**
 * Exact integer linear algebra for the Linear System game.
 *
 * Every operation here is EXACT (BigInt) on purpose. A floating-point
 * determinant can misjudge a near-singular integer matrix — reporting a tiny
 * non-zero for a genuinely singular matrix, or a rounding-induced zero for a
 * good one — which would let the generator ship a system with zero or infinite
 * solutions. Since the whole game hinges on "exactly one solution", we never
 * trust floats for the uniqueness decision.
 *
 * Matrices are plain `number[][]` (small integers); vectors are `number[]`.
 */

/** Deep-copy a numeric matrix into BigInt. */
function toBig(A) {
  return A.map((row) => row.map((x) => BigInt(x)));
}

/**
 * Exact determinant via recursive cofactor (Laplace) expansion, in BigInt.
 * O(n!) — irrelevant here (n = 4, so 24 terms) and obviously correct, which
 * matters more than speed for the one check the game's fairness depends on.
 * @param {number[][]} A  square matrix
 * @returns {bigint}
 */
export function determinant(A) {
  return detBig(toBig(A));
}

function detBig(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];

  let det = 0n;
  for (let c = 0; c < n; c++) {
    // Minor: drop row 0 and column c.
    const minor = M.slice(1).map((row) => row.filter((_, j) => j !== c));
    const sign = c % 2 === 0 ? 1n : -1n;
    det += sign * M[0][c] * detBig(minor);
  }
  return det;
}

/**
 * Matrix × vector, exact integer result. Used to derive the constants
 * `b = A · v` from the chosen solution `v`.
 * @param {number[][]} A
 * @param {number[]} v
 * @returns {number[]}
 */
export function multiply(A, v) {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/**
 * Solve `A · x = b` exactly by Cramer's rule in BigInt. Returns the unique
 * solution as `number[]` when it exists and every component is an integer;
 * returns `null` if the matrix is singular (no unique solution) or the solution
 * is not integral.
 *
 * This is used purely as a SELF-CHECK: after building a puzzle we solve it back
 * and assert we recover the chosen `v`. It guarantees a bug can never silently
 * ship a puzzle whose stated answer isn't actually the unique solution.
 * @param {number[][]} A
 * @param {number[]} b
 * @returns {number[]|null}
 */
export function solveUnique(A, b) {
  const M = toBig(A);
  const bb = b.map((x) => BigInt(x));
  const det = detBig(M);
  if (det === 0n) return null;

  const n = M.length;
  const x = [];
  for (let i = 0; i < n; i++) {
    // Replace column i with the constants vector, then take the determinant.
    const Mi = M.map((row, r) => row.map((val, c) => (c === i ? bb[r] : val)));
    const di = detBig(Mi);
    if (di % det !== 0n) return null; // non-integer component
    x.push(Number(di / det));
  }
  return x;
}
