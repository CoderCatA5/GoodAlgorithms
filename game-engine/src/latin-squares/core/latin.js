/**
 * Core Latin-square algebra for the Latin Squares game.
 *
 * Symbols are represented internally as integers `0 .. n-1`; a blank cell is
 * `null`. The display layer maps `0 → 'A'`, `1 → 'B'`, … (see `symbolLetter`).
 * A grid is `(number|null)[][]`.
 *
 * The whole game hinges on one guarantee: the `?` cell has EXACTLY ONE symbol
 * that keeps the grid completable to a valid Latin square. `answerIsUnique`
 * below is the check the generator's fairness depends on, so it is written to
 * fail safe — if the bounded solver can't decide, it reports "not unique"
 * rather than risk shipping an ambiguous puzzle.
 */

/** Map a symbol index to its display letter: 0 → 'A', 1 → 'B', … */
export function symbolLetter(i) {
  return String.fromCharCode(65 + i);
}

/** The n display letters, in order: ['A','B',…]. */
export function symbolAlphabet(n) {
  return Array.from({ length: n }, (_, i) => symbolLetter(i));
}

/**
 * Build a random valid Latin square of order `n` using the injected RNG.
 *
 * Start from the cyclic square `base[i][j] = (i + j) % n` (always valid), then
 * shuffle rows, shuffle columns, and relabel the symbols — each of which
 * preserves the Latin property. The result is reproducible for a given RNG
 * seed. (Not perfectly uniform over all Latin squares, but plenty varied for
 * puzzle generation.)
 *
 * @param {number} n
 * @param {import('../../core/Rng.js').Rng} rng
 * @returns {number[][]}
 */
export function randomLatinSquare(n, rng) {
  const rowOrder = rng.shuffle(range(n));
  const colOrder = rng.shuffle(range(n));
  const relabel = rng.shuffle(range(n)); // relabel[symbol] = newSymbol

  const square = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const base = (rowOrder[i] + colOrder[j]) % n;
      row.push(relabel[base]);
    }
    square.push(row);
  }
  return square;
}

/** Deep copy of a grid. */
export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

/**
 * The symbols that could legally occupy cell `(r, c)` given current fills:
 * everything not already present in row `r` or column `c`. This is exactly the
 * set a player can NOT eliminate by scanning the cell's "cross".
 * @returns {number[]}
 */
export function possibleAt(grid, r, c, n) {
  const used = new Set();
  for (let j = 0; j < n; j++) if (grid[r][j] != null) used.add(grid[r][j]);
  for (let i = 0; i < n; i++) if (grid[i][c] != null) used.add(grid[i][c]);
  const out = [];
  for (let s = 0; s < n; s++) if (!used.has(s)) out.push(s);
  return out;
}

/**
 * Can the partial grid be completed to a full valid Latin square?
 *
 * Backtracking with the most-constrained-cell (MRV) heuristic: always fill the
 * empty cell with the fewest legal candidates next, which prunes hard. Bounded
 * by `cap` node visits; if the cap is hit the search is abandoned and
 * `{ complete: false, capped: true }` is returned so callers never treat an
 * undecided search as a definitive answer.
 *
 * @param {(number|null)[][]} grid  not mutated (works on a copy)
 * @param {number} n
 * @param {number} [cap=200000]
 * @returns {{ complete: boolean, capped: boolean }}
 */
export function hasCompletion(grid, n, cap = 200000) {
  const work = cloneGrid(grid);
  const state = { nodes: 0, capped: false };
  const complete = solve(work, n, cap, state);
  return { complete, capped: state.capped };
}

function solve(grid, n, cap, state) {
  if (++state.nodes > cap) {
    state.capped = true;
    return false;
  }

  // Find the empty cell with the fewest candidates (MRV).
  let best = null;
  let bestCandidates = null;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] != null) continue;
      const cands = possibleAt(grid, r, c, n);
      if (cands.length === 0) return false; // dead end
      if (bestCandidates === null || cands.length < bestCandidates.length) {
        best = { r, c };
        bestCandidates = cands;
        if (cands.length === 1) break; // can't do better than forced
      }
    }
    if (bestCandidates && bestCandidates.length === 1) break;
  }

  if (best === null) return true; // no empty cells left → solved

  for (const s of bestCandidates) {
    grid[best.r][best.c] = s;
    if (solve(grid, n, cap, state)) return true;
    grid[best.r][best.c] = null;
    if (state.capped) return false;
  }
  return false;
}

/**
 * Is `answer` the ONLY symbol that can occupy `(qr, qc)` and still leave the
 * grid completable? Assumes `grid[qr][qc]` is currently blank and that `answer`
 * is known to be completable (it came from a real full square).
 *
 * Every other candidate in the cross is tried; if any of them completes, the
 * puzzle is ambiguous. A capped (undecided) search counts as "not unique" so
 * the generator errs toward rejecting rather than shipping a bad puzzle.
 *
 * @returns {{ unique: boolean, capped: boolean }}
 */
export function answerIsUnique(grid, qr, qc, answer, n) {
  const candidates = possibleAt(grid, qr, qc, n);
  const trial = cloneGrid(grid);
  for (const s of candidates) {
    if (s === answer) continue;
    trial[qr][qc] = s;
    const { complete, capped } = hasCompletion(trial, n);
    trial[qr][qc] = null;
    if (capped) return { unique: false, capped: true };
    if (complete) return { unique: false, capped: false }; // another answer works
  }
  return { unique: true, capped: false };
}

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}
