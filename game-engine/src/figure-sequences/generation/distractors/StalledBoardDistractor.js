import { DistractorStrategy } from './DistractorStrategy.js';

/**
 * "Stalled board" distractor: hold EVERY real sprite at the last board the
 * solver saw (the final shown frame) — the whole sequence appears to stop. This
 * is the classic "did anything change?" trap and, unlike the single-sprite
 * near-misses, it's wrong in a global way, so it varies the *kind* of wrong
 * answer on offer rather than just the degree.
 *
 * Operates on a SINGLE board. Because the answer step is always past the last
 * shown frame, the stalled board differs from the correct one whenever any
 * sprite would have changed — which it will in any real puzzle. On the vanishing
 * chance nothing changed, the generator's dedup simply drops it.
 */
export class StalledBoardDistractor extends DistractorStrategy {
  get id() {
    return 'stalled-board';
  }

  generate(ctx) {
    const stalledStep = ctx.config.shownFrames - 1; // the last board on show
    return ctx.buildFrame((s) => ctx.fieldsAtStep(s, stalledStep));
  }
}
