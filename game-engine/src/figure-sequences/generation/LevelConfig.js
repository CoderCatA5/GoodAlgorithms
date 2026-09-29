/**
 * Difficulty knobs, derived from a single `level` number so any level works
 * (not just a fixed table). Every dial the design calls for scales here: sprite
 * count, red-herring count, pattern complexity, distractor closeness, and — new
 * — how dimensions are chosen (weighted, not uniform) and how many layer at
 * once.
 */

import { IDENTITY_COUNT } from './dimensions.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * The palette provides this many visually distinct sprite identities (in arrow
 * puzzles colour is the *only* distinguishing mark since every piece is an ↑).
 * Total sprites — reals + decoys — must not exceed it, or two pieces would
 * share a colour and the colour-based answer key would become ambiguous.
 * Imported from the palette so widening `COLORS` lifts the cap automatically.
 */
const MAX_IDENTITIES = IDENTITY_COUNT;

/**
 * Which varying dimensions are *unlocked* at a level. New dimensions unlock as
 * the level rises; movement is always in play. Selection among the unlocked set
 * is weighted (see `DIMENSION_WEIGHTS`), not uniform.
 */
function dimensionsFor(lvl) {
  const dims = ['movement'];
  if (lvl >= 2) dims.push('rotation');
  if (lvl >= 3) dims.push('flip');
  if (lvl >= 4) dims.push('border', 'bold', 'size');
  return dims;
}

/**
 * Relative likelihood of each dimension being chosen. Movement is weighted
 * highest so it stays the backbone of the game even once flashier dimensions
 * unlock (uniform choice buried it at 1-in-6 by level 4). Style toggles are
 * rarest since they carry the least information.
 */
const DIMENSION_WEIGHTS = {
  movement: 5,
  rotation: 3,
  flip: 2,
  size: 2,
  border: 1,
  bold: 1,
};

/**
 * @param {number} level  1 = easiest, grows unbounded.
 * @returns {{
 *   level:number, board:{width:number,height:number},
 *   realSprites:number, decoys:number, maxPatternTier:number,
 *   optionsPerFrame:number, shownFrames:number, answerFrames:number,
 *   distractorCloseness:number, dimensions:string[],
 *   dimensionWeights:Record<string,number>, maxLayers:number,
 *   layerChance:number, decoyMaxLayers:number
 * }}
 */
export function levelConfig(level = 1) {
  const lvl = Math.max(1, Math.floor(level));

  // More pieces to track each level: 1 → 2 → 3 → 4 → 5 (capped so a 5×5 board
  // stays readable).
  const realSprites = clamp(lvl, 1, 5);
  // Red herrings grow with level. Reals still take priority for identities, but
  // the palette (IDENTITY_COUNT) is wide enough that decoys reach their natural
  // max (3) alongside the max reals (5) — so decoys are no longer squeezed by
  // the reals' budget. The min() is kept as a hard guard against colour reuse.
  const decoys = Math.min(clamp(Math.floor(lvl / 2), 0, 3), MAX_IDENTITIES - realSprites);

  return {
    level: lvl,
    board: { width: 5, height: 5 },

    realSprites,
    decoys,

    // Unlock diagonals at L2, knight/zigzag at L3+. Doubles as the appearance
    // complexity dial (45° turns and rotation sequences unlock the same way).
    maxPatternTier: clamp(lvl, 1, 3),

    // Each hidden board is its own sub-question. 3 options each → 3×3 = 9
    // combinations, one fully correct. Kept at 3 so both sub-questions fit
    // comfortably side by side; bump for harder levels if desired.
    optionsPerFrame: 3,

    shownFrames: 3,
    answerFrames: 2,

    // 0 = wrong options are obviously wrong; 1 = off-by-one near-misses.
    distractorCloseness: clamp((lvl - 1) / 4, 0, 1),

    // Which dimension(s) a puzzle at this level may vary, and how they're picked.
    dimensions: dimensionsFor(lvl),
    dimensionWeights: DIMENSION_WEIGHTS,

    // Layering: how many dimensions may stack on one sprite, and how eager we
    // are to add each extra layer. L1 never layers; the chance and cap both
    // climb so by L4 most puzzles combine two effects and some combine three.
    maxLayers: clamp(Math.floor(lvl / 2) + 1, 1, 3),
    layerChance: clamp(0.25 * (lvl - 1), 0, 0.85),

    // Red herrings are busier than reals by default: they carry every dimension
    // the reals do PLUS extra compatible effects, up to this cap (one above the
    // reals' cap). Actual extras are limited to what renders under the puzzle's
    // glyph kind and what the level has unlocked (see chooseDecoyLayers).
    decoyMaxLayers: clamp(Math.floor(lvl / 2) + 2, 1, 4),
  };
}
