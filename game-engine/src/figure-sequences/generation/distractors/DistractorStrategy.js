/**
 * Base class for distractor (wrong-answer) strategies (Strategy pattern).
 *
 * Each board (answer step) is its own multiple-choice sub-question, so a
 * strategy produces ONE alternative BOARD — an array of real-sprite placements
 * for a single step — or `null` if it doesn't apply. The generator collects
 * unique boards from a pool of strategies until each sub-question is full.
 *
 * A puzzle may layer several dimensions on each sprite, so the context exposes
 * the active dimensions and helpers that compose a sprite's layers into fields.
 *
 * Context shape (see PuzzleGenerator):
 *   board, rng, closeness          geometry, RNG, 0..1 near-miss dial
 *   reals                          the real sprite objects (never touch decoys)
 *   step                           the frame index this sub-question is for
 *   config                         the LevelConfig (pattern complexity, etc.)
 *   dims                           the active DimensionSpecs (vary/nudge/alt)
 *   correctFields(sprite)          ground-truth composed fields at this step
 *   fieldsAtStep(sprite, step)     ground-truth composed fields at ANY step
 *                                  (e.g. to hold the board at an earlier frame)
 *   fieldsWithAlt(sprite, dimId, altPattern)
 *                                  composed fields with one dimension's pattern
 *                                  swapped for an alternate rule
 *   buildFrame(resolveFn)          (sprite) => fields  ->  a full board of reals
 */
export class DistractorStrategy {
  get id() {
    throw new Error('DistractorStrategy.id must be implemented');
  }

  /** @returns {Array|null} a board (array of placements), or null if N/A. */
  generate(ctx) {
    throw new Error('DistractorStrategy.generate must be implemented');
  }
}
