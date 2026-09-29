import { mod } from '../core/Vector.js';
import { norm360 } from '../patterns/AppearancePattern.js';
import { RotationPattern } from '../patterns/RotationPattern.js';
import { RotationSequencePattern } from '../patterns/RotationSequencePattern.js';
import { FlipPattern } from '../patterns/FlipPattern.js';
import { BorderPattern, BoldPattern, SizePattern } from '../patterns/StylePatterns.js';
import { EveryNthAppearance } from '../patterns/EveryNth.js';
import { FuzzyMovement, FuzzyAppearance } from '../patterns/Fuzzy.js';

/**
 * A puzzle varies one or more dimensions at once (movement, rotation, flip, or
 * a style property) — a sprite may both move AND rotate, say. A DimensionSpec
 * packages everything the generator needs to handle a dimension without knowing
 * which one it is:
 *
 *   glyphKind                         'arrow' | 'sized' | 'any' — what glyph the
 *                                     dimension needs to be legible. Two hard
 *                                     kinds ('arrow' vs 'sized') can't share a
 *                                     puzzle; 'any' layers with anything.
 *   base                              static fields the dimension needs applied
 *                                     before patterns (e.g. flip tilts arrows to
 *                                     45° so a mirror is visible)
 *   makePattern(rng, config)          create a real sprite's varying pattern
 *   altPattern(rng, config, avoidId)  a *different* rule of the same kind (or
 *                                     null) — coherent wrong answers
 *   contribute(pattern, sprite, t, b) the PARTIAL placement fields this
 *                                     dimension owns at time t (position, or
 *                                     rotation, or flipX/Y, or one style key)
 *   nudge(correct, rng, closeness, b) a plausibly-wrong version of one frame's
 *                                     fields ("Nudge" distractor)
 *   label                             human name for the puzzle header
 *
 * Because each dimension contributes only its own fields, several stack cleanly
 * via `composeFields`. Adding a new dimension = adding one spec here; the
 * generator, distractors, and fairness logic never change (Open/Closed).
 */

export const DEFAULT_APPEARANCE = {
  rotation: 0,
  flipX: false,
  flipY: false,
  bordered: false,
  bold: false,
  size: 'big',
};

// The identity palette. In arrow puzzles (rotation/flip) every piece is an ↑, so
// colour is the ONLY thing telling sprites apart — which makes the number of
// colours the hard ceiling on how many distinct sprites a puzzle can show. Each
// name must be a valid chalk method (the renderer does `chalk[color]`) and read
// naturally in the answer key ("the gray ↑"). Add a colour here and the whole
// engine can show one more sprite; `IDENTITY_COUNT` and the level caps follow.
const COLORS = ['yellow', 'cyan', 'green', 'magenta', 'blue', 'red', 'white', 'gray'];
const GEO = ['★', '●', '▲', '■', '◆', '✦'];
const SIZED_KEYS = ['circle', 'square', 'triangle'];

/**
 * How many visually distinct sprite identities exist — the ceiling on total
 * sprites (reals + decoys) in any one puzzle. Bounded by the colour count
 * because arrow puzzles can only distinguish pieces by colour. Derived from the
 * palette so it can never drift out of sync with `COLORS`.
 */
export const IDENTITY_COUNT = COLORS.length;
const DIRS8 = [
  { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
  { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 },
];

// --- movement -----------------------------------------------------------
const movement = {
  id: 'movement',
  label: 'MOVEMENT — the pieces move',
  glyphKind: 'any',
  base: {},
  makePattern(rng, config) {
    return rng.pick(config.movementFactories)();
  },
  altPattern(rng, config, avoidId) {
    const candidates = rng
      .shuffle(config.movementFactories)
      .map((f) => f())
      .filter((p) => p.id !== avoidId);
    return candidates[0] ?? null;
  },
  contribute(pattern, sprite, t, board) {
    return pattern.positionAt(sprite.origin, t, board);
  },
  nudge(correct, rng, closeness, board) {
    const near = rng.next() < closeness;
    const mag = near ? 1 : rng.int(2, 3);
    const dir = rng.pick(DIRS8);
    return {
      ...correct,
      x: mod(correct.x + dir.dx * mag, board.width),
      y: mod(correct.y + dir.dy * mag, board.height),
    };
  },
};

// --- rotation -----------------------------------------------------------
const rotation = {
  id: 'rotation',
  label: 'ROTATION — the pieces turn',
  glyphKind: 'arrow',
  base: {},
  makePattern(rng, config) {
    const tier = config.appearanceComplexity;
    if (tier >= 3 && rng.next() < 0.5) {
      const deltas = rng.shuffle([45, 90, 135]).slice(0, 2);
      return new RotationSequencePattern({ deltas, dir: rng.pick([1, -1]) });
    }
    const deltaDeg = tier >= 2 ? rng.pick([45, 90]) : 90;
    let p = new RotationPattern({ deltaDeg, dir: rng.pick([1, -1]) });
    if (tier >= 3 && config.allowEveryNth !== false && rng.next() < 0.3) {
      p = new EveryNthAppearance(p, 2);
    }
    return p;
  },
  altPattern(rng, config, avoidId) {
    for (let i = 0; i < 6; i++) {
      const p = this.makePattern(rng, config);
      if (p.id !== avoidId) return p;
    }
    return null;
  },
  contribute(pattern, sprite, t) {
    return { rotation: pattern.valueAt(t).rotation };
  },
  nudge(correct, rng) {
    const off = rng.pick([45, 90, 135, 180, -45, -90]);
    return { ...correct, rotation: norm360(correct.rotation + off) };
  },
};

// --- flip ---------------------------------------------------------------
const flip = {
  id: 'flip',
  label: 'FLIP — the pieces mirror',
  glyphKind: 'arrow',
  // Tilt the base arrow to a diagonal (↗) so that EVERY flip axis is visibly
  // distinct: x→↘, y→↖, both→↙. A vertical ↑ would look identical under a
  // left-right (y-axis) mirror, making the puzzle unsolvable. When rotation is
  // layered on top, its per-frame angle overrides this base (see composeFields).
  base: { rotation: 45 },
  makePattern(rng, config) {
    let p = new FlipPattern({ axis: rng.pick(['x', 'y', 'both']) });
    if (config.appearanceComplexity >= 3 && config.allowEveryNth !== false && rng.next() < 0.3) {
      p = new EveryNthAppearance(p, 2);
    }
    return p;
  },
  altPattern(rng, config, avoidId) {
    for (let i = 0; i < 6; i++) {
      const p = this.makePattern(rng, config);
      if (p.id !== avoidId) return p;
    }
    return null;
  },
  contribute(pattern, sprite, t) {
    const v = pattern.valueAt(t);
    return { flipX: v.flipX, flipY: v.flipY };
  },
  nudge(correct, rng) {
    const combos = [
      [false, false], [true, false], [false, true], [true, true],
    ].filter((c) => !(c[0] === correct.flipX && c[1] === correct.flipY));
    const [fx, fy] = rng.pick(combos);
    return { ...correct, flipX: fx, flipY: fy };
  },
};

/** Shared factory for the three style dimensions (border / bold / size). */
function styleDimension({ id, label, glyphKind, PatternClass, key }) {
  return {
    id,
    label,
    glyphKind,
    base: {},
    makePattern(rng, config) {
      let p = new PatternClass();
      if (config.appearanceComplexity >= 3 && config.allowEveryNth !== false && rng.next() < 0.3) {
        p = new EveryNthAppearance(p, 2);
      }
      return p;
    },
    // Each style property has essentially one rule, so there's no distinct
    // "alternate rule" to build — wrong answers come from the Nudge strategy.
    altPattern() {
      return null;
    },
    contribute(pattern, sprite, t) {
      return { [key]: pattern.valueAt(t)[key] };
    },
    nudge(correct, rng) {
      if (key === 'size') {
        return { ...correct, size: correct.size === 'big' ? 'small' : 'big' };
      }
      return { ...correct, [key]: !correct[key] };
    },
  };
}

const border = styleDimension({
  id: 'border',
  label: 'BORDER — the pieces gain/lose a border',
  glyphKind: 'any',
  PatternClass: BorderPattern,
  key: 'bordered',
});

const bold = styleDimension({
  id: 'bold',
  label: 'BOLD — the pieces bold and unbold',
  glyphKind: 'any',
  PatternClass: BoldPattern,
  key: 'bold',
});

const size = styleDimension({
  id: 'size',
  label: 'SIZE — the pieces grow and shrink',
  glyphKind: 'sized',
  PatternClass: SizePattern,
  key: 'size',
});

export const DIMENSIONS = { movement, rotation, flip, border, bold, size };

/** Look up a dimension spec by id, throwing on an unknown id. */
export function dimensionSpec(id) {
  const spec = DIMENSIONS[id];
  if (!spec) {
    throw new Error(`Unknown dimension "${id}". Known: ${Object.keys(DIMENSIONS).join(', ')}`);
  }
  return spec;
}

// --- layering: composition, visuals, and selection ----------------------

/**
 * Compose a sprite's layers into its full placement fields at time `t`.
 * Start from the origin + default appearance, apply each dimension's static
 * base, then each dimension's per-frame contribution. Contributions own
 * disjoint fields (movement→x,y; rotation→rotation; flip→flipX/Y; style→its
 * key), so they stack without clobbering each other; bases run first so a
 * later per-frame rotation can override flip's static tilt.
 */
export function composeFields(layers, sprite, t, board) {
  let f = { x: sprite.origin.x, y: sprite.origin.y, ...DEFAULT_APPEARANCE };
  for (const { dimId } of layers) f = { ...f, ...dimensionSpec(dimId).base };
  for (const { dimId, pattern } of layers) {
    f = { ...f, ...dimensionSpec(dimId).contribute(pattern, sprite, t, board) };
  }
  return f;
}

/**
 * The glyph a layer set must use to stay legible. Arrow-based dimensions
 * (rotation/flip) win over sized (size), which wins over plain — and a set
 * never mixes 'arrow' with 'sized' (see `chooseLayers`).
 */
export function layerGlyphKind(dimIds) {
  const kinds = dimIds.map((id) => dimensionSpec(id).glyphKind);
  if (kinds.includes('arrow')) return 'arrow';
  if (kinds.includes('sized')) return 'sized';
  return 'any';
}

/**
 * Which dimensions can't share a puzzle: 'arrow' dimensions (rotation, flip)
 * and 'sized' (size) each demand a specific glyph, so only one hard kind may be
 * present. Returns an error message describing the clash, or null if the set is
 * renderable. `chooseLayers` never produces a clash; this guards forced sets.
 */
export function layerConflict(dimIds) {
  const hard = [...new Set(dimIds.map((id) => dimensionSpec(id).glyphKind))].filter(
    (k) => k !== 'any',
  );
  if (hard.length <= 1) return null;
  const byKind = (kind) => dimIds.filter((id) => dimensionSpec(id).glyphKind === kind).join(', ');
  return (
    `Dimensions [${byKind('arrow')}] need an arrow glyph but [${byKind('sized')}] needs a ` +
    `sized shape — they can't be layered in one puzzle.`
  );
}

/** The static look (shape/glyph/colour) for sprite `i` given the layer glyph kind. */
export function makeVisual(glyphKind, i) {
  const color = COLORS[i % COLORS.length];
  if (glyphKind === 'arrow') return { shape: 'arrow', glyph: '↑', color };
  if (glyphKind === 'sized') return { shape: SIZED_KEYS[i % SIZED_KEYS.length], glyph: '', color };
  return { shape: 'plain', glyph: GEO[i % GEO.length], color };
}

/**
 * Choose which dimension(s) a puzzle varies. Picks a weighted primary, then
 * layers on further compatible dimensions with probability `layerChance`, up
 * to `maxLayers`. Two dimensions are incompatible when they need different
 * hard glyph kinds (an arrow can't also be a resizable circle), so e.g.
 * rotation+flip may stack but rotation+size may not.
 */
export function chooseLayers(rng, config) {
  const { dimensions, dimensionWeights = {}, maxLayers = 1, layerChance = 0 } = config;
  const weightOf = (d) => dimensionWeights[d] ?? 1;

  const chosen = [rng.weighted(dimensions, weightOf)];
  const compatible = (d) => {
    if (chosen.includes(d)) return false;
    const dk = dimensionSpec(d).glyphKind;
    if (dk === 'any') return true;
    const hard = chosen.map((c) => dimensionSpec(c).glyphKind).filter((k) => k !== 'any');
    return hard.length === 0 || hard.includes(dk);
  };

  let pool = dimensions.filter(compatible);
  while (chosen.length < maxLayers && pool.length && rng.next() < layerChance) {
    chosen.push(rng.weighted(pool, weightOf));
    pool = dimensions.filter(compatible);
  }
  return chosen;
}

/**
 * Choose the layer set for a DECOY (red herring). It always includes the
 * puzzle's own dimensions `baseDimIds` — so a herring exhibits the same kind of
 * change the reals do and stays tempting — then piles on extra effects up to
 * `config.decoyMaxLayers` (higher than the reals' cap by default, so herrings
 * are busier and harder to dismiss).
 *
 * Extras are drawn from the level's unlocked `dimensions`, but only those that
 * actually RENDER under the puzzle's glyph kind: a dimension shows up iff it's
 * glyph-agnostic ('any', e.g. border/bold) or it is the puzzle's own hard kind
 * (so a plain movement puzzle won't hand a decoy an invisible rotation, but an
 * arrow puzzle can). This keeps every decoy the same shape as its neighbours
 * while carrying more visible noise.
 */
export function chooseDecoyLayers(rng, config, baseDimIds, glyphKind) {
  const { dimensions = [], decoyMaxLayers = baseDimIds.length } = config;
  const chosen = [...baseDimIds];
  const renders = (id) => {
    const gk = dimensionSpec(id).glyphKind;
    return gk === 'any' || gk === glyphKind;
  };
  const extras = rng.shuffle(dimensions.filter((id) => renders(id) && !chosen.includes(id)));
  for (const id of extras) {
    if (chosen.length >= decoyMaxLayers) break;
    chosen.push(id);
  }
  return chosen;
}

/**
 * Turn a decoy's clean layers into FUZZY layers: each one is followed exactly
 * through `breakAt`, then "breaks off" onto a freshly-drawn alternate rule.
 * Every layer breaks — movement picks a new direction (continuing from the cell
 * it reached), rotation/flip switch to a different rule, and the style toggles
 * jump phase — so past the break the whole sprite is unpredictable.
 *
 * Alternates are drawn from `rng` on EVERY call, so invoking this once per
 * answer option gives each option a different decoy state. That is safe (it
 * can't leak the answer) precisely because a broken pattern has no single
 * "correct" continuation to match against — the whole point of the fuzzy decoy.
 * `config` should disable the every-Nth hold (a herring must never freeze), so
 * the alternates keep visibly changing.
 */
export function fuzzDecoyLayers(rng, config, layers, breakAt) {
  return layers.map(({ dimId, pattern }) => {
    const spec = dimensionSpec(dimId);
    const alt = spec.altPattern(rng, config, pattern.id) ?? pattern;
    // Movement patterns compute a position from an origin; appearance patterns
    // compute a value from time. Wrap on the matching axis.
    if (typeof pattern.positionAt === 'function') {
      return { dimId, pattern: new FuzzyMovement(pattern, alt, breakAt) };
    }
    // A phase nudge so single-state toggles (border/bold/size), whose altPattern
    // is just themselves, still vary from option to option after the break.
    return { dimId, pattern: new FuzzyAppearance(pattern, alt, breakAt, rng.int(0, 3)) };
  });
}
