import { StepPattern } from './StepPattern.js';
import { SequencePattern } from './SequencePattern.js';
import { SquarePattern } from './SquarePattern.js';

/**
 * Pattern registry, grouped by complexity tier. `LevelConfig` picks a maximum
 * tier and the generator draws random patterns from tiers up to that cap.
 *
 * Each entry is a *factory* (`() => MovementPattern`) so every sprite gets its
 * own instance. To add a new movement rule, drop a class in ./patterns and
 * register a factory here — no other file needs to change (Open/Closed).
 */
export const PATTERN_TIERS = {
  // Tier 1 — cardinal steps: "one up/down/left/right every time".
  1: [
    () => new StepPattern({ dx: 0, dy: -1 }),
    () => new StepPattern({ dx: 0, dy: 1 }),
    () => new StepPattern({ dx: -1, dy: 0 }),
    () => new StepPattern({ dx: 1, dy: 0 }),
  ],
  // Tier 2 — diagonals.
  2: [
    () => new StepPattern({ dx: 1, dy: -1 }),
    () => new StepPattern({ dx: -1, dy: -1 }),
    () => new StepPattern({ dx: 1, dy: 1 }),
    () => new StepPattern({ dx: -1, dy: 1 }),
  ],
  // Tier 3 — knight moves, repeating multi-step cycles, and square orbits.
  3: [
    () => new SequencePattern({ name: 'knight', offsets: [{ dx: 1, dy: -2 }] }),
    () => new SequencePattern({ name: 'knight', offsets: [{ dx: 2, dy: 1 }] }),
    () =>
      new SequencePattern({
        name: 'zigzag',
        offsets: [
          { dx: 1, dy: -1 },
          { dx: 1, dy: 1 },
        ],
      }),
    () => new SquarePattern({ dir: 1 }), // clockwise 2×2 orbit
    () => new SquarePattern({ dir: -1 }), // anticlockwise 2×2 orbit
  ],
};

/**
 * Relative frequency of each movement tier. Lower (simpler) tiers are weighted
 * more heavily so plain lateral/vertical moves stay common even once diagonals
 * and knight moves unlock — otherwise the fancy patterns crowd them out.
 */
export const TIER_WEIGHTS = { 1: 3, 2: 2, 3: 1 };

/**
 * All factories from tier 1 up to and including `maxTier`, with each tier's
 * factories repeated according to `TIER_WEIGHTS`. A uniform `rng.pick` over the
 * returned pool therefore favours simpler moves. (Repetition keeps the "pick a
 * factory" call site trivial and leaves `altPattern`'s shuffle/filter working
 * unchanged.)
 */
export function weightedFactoriesUpTo(maxTier) {
  const out = [];
  for (let tier = 1; tier <= maxTier; tier++) {
    const factories = PATTERN_TIERS[tier];
    if (!factories) continue;
    const reps = TIER_WEIGHTS[tier] ?? 1;
    for (let r = 0; r < reps; r++) out.push(...factories);
  }
  return out;
}
