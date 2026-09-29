import {
  randomLatinSquare,
  cloneGrid,
  possibleAt,
  answerIsUnique,
  symbolLetter,
  symbolAlphabet,
} from '../core/latin.js';
import { LatinSquarePuzzle } from '../Puzzle.js';

/**
 * Builds a Latin Squares puzzle from a LevelConfig.
 *
 * The design (why the `?` is always fair):
 *   1. Generate a COMPLETE valid Latin square — the ground truth.
 *   2. Pick the `?` cell; its true value is the answer.
 *   3. Hide `candidatesTarget - 1` non-answer symbols from the `?` cell's cross
 *      (its row + column) by blanking their occurrences there. That leaves
 *      exactly `candidatesTarget` symbols a player can't eliminate by scanning —
 *      the difficulty lever.
 *   4. Verify the answer is still the UNIQUE symbol that keeps the grid
 *      completable (core/latin.js `answerIsUnique`). Hiding symbols can make the
 *      cell genuinely ambiguous for some squares, so this attempt is rejected
 *      and retried when it does.
 *   5. Greedily blank the remaining (non-cross) cells for as long as the answer
 *      stays unique — sparse boards (even fully blank rows) are fine because the
 *      only invariant is that the `?` has one possible value.
 *
 * Every step moves between verified-unique states, so a bug can never silently
 * ship an ambiguous puzzle. If `candidatesTarget` proves infeasible within the
 * retry budget the generator degrades it toward 1 (always achievable) and
 * records the difficulty it actually reached.
 *
 * The RNG is injected so a given seed always reproduces the same puzzle.
 */
export class PuzzleGenerator {
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
    const { n, level } = config;

    // Try the requested difficulty; degrade toward 1 candidate if unreachable.
    for (let target = config.candidatesTarget; target >= 1; target--) {
      // Repeats duplicate a still-visible symbol, so they're bounded by how many
      // symbols remain visible at this candidate count.
      const repeats = Math.min(config.repeatsTarget ?? 0, n - target);
      const built = this._tryTarget(config, target, repeats);
      if (built) return this._toPuzzle(built, config, seed);
    }
    // Unreachable: target === 1 always succeeds (see _tryTarget).
    throw new Error(
      `internal: could not build a ${n}×${n} latin-square puzzle at level ${level}`,
    );
  }

  /**
   * Attempt to build a grid whose `?` cell has exactly `target` candidates and a
   * unique answer, with `repeats` visible symbols duplicated across the cross.
   * Returns the built state or `null` if every attempt failed.
   */
  _tryTarget(config, target, repeats) {
    const { n, concentrateInRow } = config;
    const maxAttempts = 300;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const full = randomLatinSquare(n, this.rng);
      const qr = this.rng.int(0, n - 1);
      const qc = this.rng.int(0, n - 1);
      const answer = full[qr][qc];

      const grid = cloneGrid(full);
      grid[qr][qc] = null;

      // Non-answer symbols, shuffled: the first `target - 1` are hidden from the
      // cross, the rest stay visible. Of the visible ones, the first `repeats`
      // keep BOTH occurrences (row + column); the others keep just one.
      const others = this.rng.shuffle(
        Array.from({ length: n }, (_, s) => s).filter((s) => s !== answer),
      );
      const hide = new Set(others.slice(0, target - 1));
      const visible = others.slice(target - 1);
      const repeat = new Set(concentrateInRow ? [] : visible.slice(0, repeats));

      for (const s of others) {
        const rowCol = full[qr].indexOf(s); // s's cell in the ? row
        const colRow = full.findIndex((row) => row[qc] === s); // s's cell in the ? column

        if (hide.has(s)) {
          // Remove from the cross entirely: blank both occurrences.
          grid[qr][rowCol] = null;
          grid[colRow][qc] = null;
        } else if (repeat.has(s)) {
          // Duplicate across the cross: keep both occurrences (a "repeat").
          // Nothing to blank.
        } else if (concentrateInRow) {
          // Easiest layout: keep every clue in the row, empty the column.
          grid[colRow][qc] = null;
        } else {
          // Spread: keep one occurrence at random, blank the other.
          if (this.rng.next() < 0.5) grid[colRow][qc] = null;
          else grid[qr][rowCol] = null;
        }
      }

      // Construction should yield exactly `target` cross candidates; guard it.
      const candidates = possibleAt(grid, qr, qc, n);
      if (candidates.length !== target) continue;
      if (this._crossRepeats(grid, qr, qc, n) !== repeats) continue;

      const { unique } = answerIsUnique(grid, qr, qc, answer, n);
      if (!unique) continue;

      this._sparsify(grid, qr, qc, answer, n);

      return { full, grid, qr, qc, answer };
    }
    return null;
  }

  /** Count symbols that appear in BOTH the `?` row and the `?` column. */
  _crossRepeats(grid, qr, qc, n) {
    let count = 0;
    for (let s = 0; s < n; s++) {
      const inRow = grid[qr].some((v, c) => v === s && c !== qc);
      const inCol = grid.some((row, r) => row[qc] === s && r !== qr);
      if (inRow && inCol) count++;
    }
    return count;
  }

  /**
   * Blank every non-cross cell we can while the answer stays unique, in random
   * order — producing a sparse board without ever risking ambiguity. Cross
   * cells are left untouched: they define the difficulty (candidate count).
   */
  _sparsify(grid, qr, qc, answer, n) {
    const cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r === qr || c === qc) continue; // skip the cross
        if (grid[r][c] == null) continue;
        cells.push([r, c]);
      }
    }

    for (const [r, c] of this.rng.shuffle(cells)) {
      const saved = grid[r][c];
      grid[r][c] = null;
      const { unique } = answerIsUnique(grid, qr, qc, answer, n);
      if (!unique) grid[r][c] = saved; // revert: this clue was load-bearing
    }
  }

  _toPuzzle({ full, grid, qr, qc, answer }, config, seed) {
    const { n, level, concentrateInRow } = config;
    const letters = symbolAlphabet(n);

    const candidateIdx = possibleAt(grid, qr, qc, n);
    const crossVisible = letters.filter((_, s) => !candidateIdx.includes(s));
    const repeats = this._crossRepeats(grid, qr, qc, n);

    return new LatinSquarePuzzle({
      id: `latinsq-L${level}-${n}x${n}-${seed}`,
      seed,
      level,
      n,
      symbols: letters,
      grid: grid.map((row) => row.map((v) => (v == null ? null : symbolLetter(v)))),
      question: { row: qr, col: qc },
      options: letters,
      difficulty: {
        candidatesTarget: config.candidatesTarget,
        candidates: candidateIdx.map(symbolLetter),
        toSolve: candidateIdx.length - 1,
        crossVisible,
        repeatsTarget: config.repeatsTarget ?? 0,
        repeats,
        concentrateInRow,
      },
      solution: {
        row: qr,
        col: qc,
        value: symbolLetter(answer),
        full: full.map((row) => row.map(symbolLetter)),
      },
    });
  }
}
