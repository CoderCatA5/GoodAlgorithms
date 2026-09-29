import { DistractorStrategy } from './DistractorStrategy.js';
import { timeWarpPattern, sameFields } from './warp.js';

/**
 * "Freeze or double" distractor: take ONE dimension of ONE real sprite and run
 * its real rule off by a beat —
 *
 *   freeze  (shift -1) → the effect holds at the previous step: the piece that
 *                        should have moved/turned/toggled stays as it was.
 *   double  (shift +1) → the effect advances an extra step: the piece moves
 *                        twice as far, over-rotates, flips back, etc.
 *
 * Both are tempting because they apply the *right* rule, just mistimed — a very
 * common way a solver miscounts. Only one dimension of one sprite is disturbed,
 * so the board stays a near-miss and the correct answer stays unique.
 *
 * Implemented without any new machinery: we wrap the sprite's real pattern in a
 * time-shift proxy and hand it to `fieldsWithAlt`, which composes it at the
 * answer step exactly like a wrong-rule swap. The proxy samples the inner
 * pattern at `t + shift`, so freeze/double works for movement, rotation, flip,
 * and every style dimension alike.
 */
export class FreezeOrDoubleDistractor extends DistractorStrategy {
  get id() {
    return 'freeze-or-double';
  }

  generate(ctx) {
    const { rng, reals, dims } = ctx;
    const sprite = rng.pick(reals);

    for (const dim of rng.shuffle(dims)) {
      const layer = sprite.layers.find((l) => l.dimId === dim.id);
      if (!layer) continue;
      const correct = ctx.correctFields(sprite);

      // Try freeze and double in random order; take the first that actually
      // changes this sprite (a shift is a no-op when the effect happens to
      // read the same at t-1 or t+1, e.g. a paused every-Nth frame).
      for (const shift of rng.shuffle([-1, 1])) {
        const warped = timeWarpPattern(layer.pattern, (t) => t + shift, shift >= 0 ? `+${shift}` : `${shift}`);
        const altFields = ctx.fieldsWithAlt(sprite, dim.id, warped);
        if (sameFields(altFields, correct)) continue;
        return ctx.buildFrame((s) =>
          s.id === sprite.id ? altFields : ctx.correctFields(s),
        );
      }
    }
    return null;
  }
}
