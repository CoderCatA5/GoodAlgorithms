import { WrongRuleDistractor } from './WrongRuleDistractor.js';
import { FreezeOrDoubleDistractor } from './FreezeOrDoubleDistractor.js';
import { ReversedRuleDistractor } from './ReversedRuleDistractor.js';
import { SwapPositionsDistractor } from './SwapPositionsDistractor.js';
import { StalledBoardDistractor } from './StalledBoardDistractor.js';
import { NudgeDistractor } from './NudgeDistractor.js';

export { DistractorStrategy } from './DistractorStrategy.js';
export {
  WrongRuleDistractor,
  FreezeOrDoubleDistractor,
  ReversedRuleDistractor,
  SwapPositionsDistractor,
  StalledBoardDistractor,
  NudgeDistractor,
};

/**
 * Default pool. Every strategy is dimension-agnostic: it asks the puzzle's
 * active DimensionSpec how to build an alternate rule, a mistimed rule, or a
 * plausible nudge, so the same set works for movement, rotation, flip, and
 * every style dimension.
 *
 * Ordered strongest/most-coherent lure first, ending with the catch-alls:
 *   WrongRule       a coherent alternate rule for one dimension
 *   FreezeOrDouble  the right rule, off by a beat (held or advanced one step)
 *   ReversedRule    the right rule played backwards in time
 *   SwapPositions   two pieces transposed into each other's state
 *   StalledBoard    the whole board held at the last shown frame
 *   Nudge           a small per-dimension perturbation (also covers dimensions
 *                   with no distinct alternate rule)
 *
 * Distractors only ever manipulate REAL sprites; decoys are overlaid
 * identically onto every option afterwards, so no strategy touches them.
 */
export function defaultDistractorStrategies() {
  return [
    new WrongRuleDistractor(),
    new FreezeOrDoubleDistractor(),
    new ReversedRuleDistractor(),
    new SwapPositionsDistractor(),
    new StalledBoardDistractor(),
    new NudgeDistractor(),
  ];
}
