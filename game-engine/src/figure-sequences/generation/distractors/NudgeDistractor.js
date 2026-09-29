import { DistractorStrategy } from './DistractorStrategy.js';

/**
 * "Nudge" distractor: take the correct board and perturb ONE dimension of ONE
 * real sprite — a step too far, the wrong rotation, an extra flip, a border
 * that shouldn't be there. Near-misses (small nudges) are dialled up by
 * `closeness`.
 *
 * Operates on a SINGLE board (one answer step). The chosen dimension's own
 * `nudge(...)` decides what "a bit wrong" means, so this one strategy works
 * across every dimension and every layered combination.
 */
export class NudgeDistractor extends DistractorStrategy {
  get id() {
    return 'nudge';
  }

  generate(ctx) {
    const { rng, reals, dims, closeness, board } = ctx;
    const sprite = rng.pick(reals);
    const dim = rng.pick(dims);
    const frame = ctx.buildFrame(ctx.correctFields);
    return frame.map((p) =>
      p.spriteId === sprite.id ? dim.nudge(p, rng, closeness, board) : p,
    );
  }
}
