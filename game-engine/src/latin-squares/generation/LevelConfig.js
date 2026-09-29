/**
 * Difficulty knobs for the Latin Squares game, derived from a single `level`
 * number so any level works (no fixed table) — the same philosophy as the
 * Linear System and Figure Sequences `LevelConfig`s.
 *
 * The core lever is `candidatesTarget`: how many symbols survive scanning the
 * `?` cell's row + column (its "cross"). At 1, the answer is the single symbol
 * missing from the cross — pure elimination, instant. Higher targets hide more
 * symbols from the cross, so the player must reason about the rest of the grid
 * to pin the answer down (it stays uniquely forced — see core/latin.js).
 *
 * A secondary lever, `concentrateInRow`, governs clue layout at the easiest
 * band: level 1 keeps every clue in the `?` row (a single-line scan like
 * `A B C ? E`); level 2+ spreads clues across the row and column.
 *
 * A third lever, `repeatsTarget`, makes the elimination step itself harder: it
 * shows some visible symbols TWICE in the cross — once in the row and once in
 * the column. A repeat fills more cells without eliminating any extra option
 * (it's still one distinct symbol), so naive cell-counting overstates what the
 * cross tells you; the player must notice the duplicate. Repeats climb with
 * level "on top of" the candidate ladder, bounded by how many symbols are still
 * visible in the cross (`n - candidatesTarget`) — so they naturally appear at
 * the low-candidate levels where there's room to duplicate. The easiest two
 * levels stay clean (no repeats).
 */

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * @param {number} level  1 = easiest, grows unbounded.
 * @param {number} [n=5]  grid order (symbols A..).
 * @returns {{ level:number, n:number, candidatesTarget:number,
 *            repeatsTarget:number, concentrateInRow:boolean }}
 */
export function levelConfig(level = 1, n = 5) {
  const lvl = Math.max(1, Math.floor(level));

  // L1 → 1, L2 → 1, L3 → 2, L4 → 3, … capped at n (cross reveals nothing).
  const candidatesTarget = clamp(lvl <= 2 ? 1 : lvl - 1, 1, n);

  // Only the very easiest level lines every clue up in the `?` row.
  const concentrateInRow = lvl === 1;

  // Duplicated symbols in the cross. Zero for L1/L2 (clean), then one more per
  // level, capped at the count of still-visible symbols. A row-concentrated
  // layout has no column clues to duplicate, so it stays at zero.
  const visibleSymbols = n - candidatesTarget;
  const repeatsTarget = concentrateInRow
    ? 0
    : clamp(lvl - 2, 0, visibleSymbols);

  return {
    level: lvl,
    n,
    candidatesTarget,
    repeatsTarget,
    concentrateInRow,
  };
}
