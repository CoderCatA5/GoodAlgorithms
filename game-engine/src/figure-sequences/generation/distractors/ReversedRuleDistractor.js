import { DistractorStrategy } from './DistractorStrategy.js';
import { timeWarpPattern, sameFields } from './warp.js';

/**
 * "Reversed rule" distractor: take ONE dimension of ONE real sprite and play its
 * rule BACKWARDS in time, reflected around the last shown board. Where the real
 * sequence marches on (board 3 → 4 → 5), the reversed one retraces its path
 * (board 3 → 2 → 1) — so at the answer step the piece is heading the wrong way,
 * unwinding a rotation, or bouncing back along its track.
 *
 * This is the strongest lure for multi-step movement (knight, zigzag, square
 * orbit) and directional rotation, where "which way does it go?" is the crux.
 * Only one dimension of one sprite is disturbed, keeping the board a near-miss.
 *
 * Reuses the time-warp proxy: at render time `t` it samples the real pattern at
 * `2·pivot − t`, the mirror-image step. Returns null before there's anything to
 * reverse (answer step at or before the pivot) or when the reflection is a
 * no-op for the chosen dimension.
 */
export class ReversedRuleDistractor extends DistractorStrategy {
  get id() {
    return 'reversed-rule';
  }

  generate(ctx) {
    const { rng, reals, dims, config, step } = ctx;
    const pivot = config.shownFrames - 1; // reflect around the last shown board
    if (step <= pivot) return null;

    const sprite = rng.pick(reals);
    const correct = ctx.correctFields(sprite);

    for (const dim of rng.shuffle(dims)) {
      const layer = sprite.layers.find((l) => l.dimId === dim.id);
      if (!layer) continue;
      const reversed = timeWarpPattern(layer.pattern, (t) => 2 * pivot - t, 'rev');
      const altFields = ctx.fieldsWithAlt(sprite, dim.id, reversed);
      if (sameFields(altFields, correct)) continue;
      return ctx.buildFrame((s) =>
        s.id === sprite.id ? altFields : ctx.correctFields(s),
      );
    }
    return null;
  }
}
