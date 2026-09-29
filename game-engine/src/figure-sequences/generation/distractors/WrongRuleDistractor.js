import { DistractorStrategy } from './DistractorStrategy.js';

/**
 * "Wrong rule" distractor: show ONE real sprite where it would be if ONE of its
 * dimensions followed a different-but-valid rule, leaving everything else
 * correct. A coherent alternate rule is the strongest lure — it looks like a
 * reasonable reading of the clue.
 *
 * Operates on a SINGLE board (one answer step). Tries the active dimensions in
 * random order and uses the first that has a meaningful alternate rule; returns
 * null if none do (e.g. a puzzle that only varies style toggles), in which case
 * Nudge supplies the wrong boards.
 */
export class WrongRuleDistractor extends DistractorStrategy {
  get id() {
    return 'wrong-rule';
  }

  generate(ctx) {
    const { rng, reals, dims, config } = ctx;
    const sprite = rng.pick(reals);

    for (const dim of rng.shuffle(dims)) {
      const current = sprite.layers.find((l) => l.dimId === dim.id);
      const alt = dim.altPattern(rng, config, current?.pattern.id);
      if (!alt) continue;
      return ctx.buildFrame((s) =>
        s.id === sprite.id ? ctx.fieldsWithAlt(s, dim.id, alt) : ctx.correctFields(s),
      );
    }
    return null;
  }
}
