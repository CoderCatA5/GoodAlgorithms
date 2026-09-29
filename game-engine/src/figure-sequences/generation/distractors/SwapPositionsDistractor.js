import { DistractorStrategy } from './DistractorStrategy.js';
import { sameFields } from './warp.js';

/**
 * "Swap positions" distractor: take TWO real sprites and put each in the other's
 * correct state (position AND appearance) — a transposition error. Every figure
 * that belongs on the board is present and each obeys a real rule; they're just
 * assigned to the wrong pieces. This lures a solver who tracked the rules but
 * mixed up which piece follows which.
 *
 * Operates on a SINGLE board. Needs at least two reals whose correct states
 * differ (otherwise the swap is invisible); returns null if it can't find such
 * a pair, letting other strategies fill in.
 */
export class SwapPositionsDistractor extends DistractorStrategy {
  get id() {
    return 'swap-positions';
  }

  generate(ctx) {
    const { rng, reals } = ctx;
    if (reals.length < 2) return null;

    const order = rng.shuffle(reals);
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const a = order[i];
        const b = order[j];
        const fa = ctx.correctFields(a);
        const fb = ctx.correctFields(b);
        if (sameFields(fa, fb)) continue; // identical states — swap invisible
        return ctx.buildFrame((s) => {
          if (s.id === a.id) return fb;
          if (s.id === b.id) return fa;
          return ctx.correctFields(s);
        });
      }
    }
    return null;
  }
}
