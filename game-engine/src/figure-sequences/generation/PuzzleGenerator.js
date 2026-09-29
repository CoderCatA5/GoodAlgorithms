import { Board } from '../core/Board.js';
import { Sprite } from '../core/Sprite.js';
import { weightedFactoriesUpTo } from '../patterns/registry.js';
import {
  dimensionSpec,
  composeFields,
  layerGlyphKind,
  layerConflict,
  makeVisual,
  chooseLayers,
  chooseDecoyLayers,
  fuzzDecoyLayers,
} from './dimensions.js';
import { Puzzle } from '../Puzzle.js';

/** Canonical key for a single board of placements (position AND appearance). */
function frameKey(frame) {
  return [...frame]
    .sort((a, b) => (a.spriteId < b.spriteId ? -1 : 1))
    .map(
      (p) =>
        `${p.spriteId}:${p.x},${p.y},${p.rotation},${p.flipX ? 1 : 0},` +
        `${p.flipY ? 1 : 0},${p.bordered ? 1 : 0},${p.bold ? 1 : 0},${p.size}`,
    )
    .join(';');
}

/**
 * Builds a Figure-Sequence puzzle from a LevelConfig.
 *
 * A puzzle varies one or more dimensions at once — chosen (and layered) by
 * `chooseLayers`, weighted by difficulty. Every sprite carries one pattern per
 * active dimension; `composeFields` stacks them into a placement, so the
 * generator never branches per dimension.
 *
 * Each hidden board is its own multiple-choice SUB-QUESTION: given boards 1-3,
 * "which is board 4?" (N options) and "which is board 5?" (N options). The
 * player must get both right — N² combinations, one fully correct.
 *
 * Generation is deliberately two-phase (the game's core fairness rule):
 *   1. Build every sub-question — the correct board and its distractors — as if
 *      ONLY the real sprites exist.
 *   2. Overlay the decoys, placed identically across the options of each
 *      sub-question. Because they're the same in every option, decoys can only
 *      distract during analysis; they can never turn a wrong option right.
 *
 * Collaborators (RNG, distractor strategies) are injected so behaviour is
 * reproducible and extensible without editing this class.
 */
export class PuzzleGenerator {
  /**
   * @param {object} deps
   * @param {import('../core/Rng.js').Rng} deps.rng
   * @param {import('./distractors/index.js').DistractorStrategy[]} deps.distractorStrategies
   */
  constructor({ rng, distractorStrategies }) {
    this.rng = rng;
    this.distractorStrategies = distractorStrategies;
  }

  /**
   * @param {ReturnType<import('./LevelConfig.js').levelConfig>} config
   * @param {number} seed  Recorded on the puzzle for reproducibility.
   * @param {string|string[]} [forcedDimensions]  Override the level's choice
   *        with a specific dimension (or a comma-separated / array set to layer).
   */
  generate(config, seed, forcedDimensions) {
    const board = new Board(config.board.width, config.board.height);

    const cfg = {
      ...config,
      movementFactories: weightedFactoriesUpTo(config.maxPatternTier),
      appearanceComplexity: config.maxPatternTier,
    };

    // Resolve the varying dimension(s): honour an override, else pick + layer.
    const forced = normaliseForced(forcedDimensions);
    const dimIds = forced ?? chooseLayers(this.rng, cfg);
    dimIds.forEach(dimensionSpec); // validate ids up front (throws on unknown)
    if (forced) {
      const conflict = layerConflict(dimIds);
      if (conflict) throw new Error(conflict);
    }
    const dims = dimIds.map(dimensionSpec);

    const { reals, decoys } = this._createSprites(cfg, board, dimIds);
    const shownSteps = Array.from({ length: cfg.shownFrames }, (_, i) => i);
    const answerSteps = Array.from(
      { length: cfg.answerFrames },
      (_, i) => cfg.shownFrames + i,
    );

    const placement = (s, f) => ({
      spriteId: s.id,
      shape: s.shape,
      glyph: s.glyph,
      color: s.color,
      ...f,
    });
    const fieldsOf = (s, t) => composeFields(s.layers, s, t, board);
    const decoysAt = (t) => decoys.map((s) => placement(s, fieldsOf(s, t)));

    // Red herrings follow their clean rules through the shown boards, then BREAK
    // OFF in the hidden answer frames. `fuzzDecoyLayers` re-draws each decoy's
    // broken continuation on every call, so asking for the decoys of each option
    // separately lands them on different squares per option — which is fair
    // because a broken pattern has no single correct next state to give away.
    // The break sits at the last shown frame, so boards 1-3 stay clean.
    const decoyCfg = { ...cfg, allowEveryNth: false };
    const breakAt = cfg.shownFrames - 1;
    const fuzzyDecoysAt = (t) =>
      decoys.map((s) =>
        placement(s, composeFields(fuzzDecoyLayers(this.rng, decoyCfg, s.layers, breakAt), s, t, board)),
      );

    // --- Shown frames (boards 1-3): reals + decoys, ground truth ---------
    const shownFrames = shownSteps.map((t) => ({
      index: t,
      placements: [...reals.map((s) => placement(s, fieldsOf(s, t))), ...decoysAt(t)],
    }));

    // --- One sub-question per hidden board -------------------------------
    const subquestions = answerSteps.map((t) => {
      const correctBoard = reals.map((s) => placement(s, fieldsOf(s, t)));

      const ctx = {
        board,
        rng: this.rng,
        closeness: cfg.distractorCloseness,
        reals,
        step: t,
        config: cfg,
        dims,
        correctFields: (s) => fieldsOf(s, t),
        fieldsAtStep: (s, step) => fieldsOf(s, step),
        fieldsWithAlt: (s, dimId, alt) =>
          composeFields(
            s.layers.map((l) => (l.dimId === dimId ? { dimId, pattern: alt } : l)),
            s,
            t,
            board,
          ),
        buildFrame: (resolve) => reals.map((s) => placement(s, resolve(s))),
      };
      const boards = this._collectBoards(correctBoard, ctx, cfg.optionsPerFrame);

      const shuffled = this.rng.shuffle(boards);
      const correctKey = frameKey(correctBoard);
      const correctIndex = shuffled.findIndex((b) => frameKey(b) === correctKey);

      // Phase 2: overlay decoys. Each option gets its OWN broken-off decoy
      // states (see fuzzyDecoysAt), so herrings sit on different squares across
      // A/B/C. This can't turn a wrong option right: the correct option was
      // already fixed above by the reals alone, before any decoy is drawn.
      const options = shuffled.map((realsFrame, i) => ({
        label: Puzzle.labelFor(i),
        placements: [...realsFrame, ...fuzzyDecoysAt(t)],
      }));

      return {
        index: t,
        prompt: `board ${t + 1}`,
        options,
        correctIndex,
        correctLabel: Puzzle.labelFor(correctIndex),
      };
    });

    return new Puzzle({
      id: `figseq-L${cfg.level}-${dimIds.join('+')}-${seed}`,
      seed,
      level: cfg.level,
      dimensions: dimIds,
      dimensionLabels: dims.map((d) => d.label),
      board: { width: board.width, height: board.height },
      // Full, self-describing sprite records so a consumer can restyle the
      // visual identity (shape/glyph/color) or re-simulate behaviour later.
      sprites: [...reals, ...decoys].map((s) => ({
        id: s.id,
        shape: s.shape,
        glyph: s.glyph,
        color: s.color,
        isDecoy: s.isDecoy,
        // Decoys follow the listed layer rules through the shown boards, then
        // break off unpredictably in the answer frames (see fuzzDecoyLayers).
        // The rules below therefore describe boards 1-3, not the hidden frames.
        fuzzy: s.isDecoy,
        origin: { x: s.origin.x, y: s.origin.y },
        // One entry per varied dimension: the machine id to re-instantiate the
        // rule, plus a human-readable description of it.
        layers: s.layers.map((l) => ({
          dimId: l.dimId,
          pattern: l.pattern.id,
          rule: l.pattern.describe(),
        })),
      })),
      shownFrames,
      subquestions,
      solution: {
        correctLabels: subquestions.map((q) => q.correctLabel),
        explanations: this._explain(reals, decoys),
      },
    });
  }

  _createSprites(cfg, board, dimIds) {
    // Unique origins for every sprite.
    const cells = [];
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) cells.push({ x, y });
    }
    const origins = this.rng.shuffle(cells);
    const glyphKind = layerGlyphKind(dimIds);

    // Red herrings never "freeze": their patterns are built with the every-Nth
    // hold disabled, so a decoy visibly changes on every frame (a static herring
    // is a weak one). They also carry more layered effects than reals — see
    // chooseDecoyLayers — to make them more tempting to track.
    const decoyCfg = { ...cfg, allowEveryNth: false };

    const make = (idx, isDecoy) => {
      const look = makeVisual(glyphKind, idx);
      const patternCfg = isDecoy ? decoyCfg : cfg;
      const ids = isDecoy ? chooseDecoyLayers(this.rng, cfg, dimIds, glyphKind) : dimIds;
      return new Sprite({
        id: `s${idx}`,
        shape: look.shape,
        glyph: look.glyph,
        color: look.color,
        origin: origins[idx],
        // One pattern per active dimension — this is the layering.
        layers: ids.map((id) => ({
          dimId: id,
          pattern: dimensionSpec(id).makePattern(this.rng, patternCfg),
        })),
        isDecoy,
      });
    };

    const reals = [];
    const decoys = [];
    let idx = 0;
    for (let i = 0; i < cfg.realSprites; i++, idx++) reals.push(make(idx, false));
    // A decoy follows real, clean patterns of the same dimensions — that's what
    // makes it tempting to track. It just never participates in the answer.
    for (let i = 0; i < cfg.decoys; i++, idx++) decoys.push(make(idx, true));

    return { reals, decoys };
  }

  /** Collect `count` distinct boards for one sub-question (correct + distractors). */
  _collectBoards(correctBoard, ctx, count) {
    const seen = new Set([frameKey(correctBoard)]);
    const distractors = [];
    const needed = count - 1;
    const maxAttempts = needed * 60;

    // Shuffle the strategy order per sub-question. With only a couple of slots to
    // fill, a fixed order would always exhaust the first one or two strategies and
    // never reach the rest; shuffling lets every strategy contribute across a run,
    // so the wrong answers vary in KIND from board to board (the point of having
    // many distractors), while staying deterministic under the seeded RNG.
    const order = ctx.rng.shuffle(this.distractorStrategies);

    for (let attempt = 0; attempt < maxAttempts && distractors.length < needed; attempt++) {
      const strat = order[attempt % order.length];
      const b = strat.generate(ctx);
      if (!b) continue;
      const key = frameKey(b);
      if (seen.has(key)) continue;
      seen.add(key);
      distractors.push(b);
    }

    // Deterministic fallback: nudge one sprite's one dimension until full.
    for (let guard = 0; distractors.length < needed && guard < needed * 40; guard++) {
      const target = ctx.reals[guard % ctx.reals.length];
      const dim = ctx.dims[guard % ctx.dims.length];
      const b = ctx
        .buildFrame(ctx.correctFields)
        .map((p) =>
          p.spriteId === target.id ? dim.nudge(p, ctx.rng, ctx.closeness, ctx.board) : p,
        );
      const key = frameKey(b);
      if (!seen.has(key)) {
        seen.add(key);
        distractors.push(b);
      }
    }

    return [correctBoard, ...distractors];
  }

  _explain(reals, decoys) {
    // Sprites in rotation/flip puzzles all share the ↑ glyph and size puzzles
    // have no glyph, so label by colour to keep the answer key unambiguous.
    const label = (s) => `the ${s.color} ${s.glyph || s.shape}`;
    // A layered sprite obeys several rules at once — describe them all.
    const rules = (s) => s.layers.map((l) => l.pattern.describe()).join(' and ');
    const out = reals.map((s) => `${label(s)} ${rules(s)}.`);
    for (const d of decoys) {
      out.push(
        `${label(d)} is a RED HERRING — through the shown boards it ${rules(d)}, but then it BREAKS its pattern and wanders unpredictably, landing on a different square in each option. It never has one "correct" next board, so it can't be the answer. Ignore it.`,
      );
    }
    return out;
  }
}

/** Normalise a forced-dimension override into a string[] or null. */
function normaliseForced(forced) {
  if (!forced) return null;
  const list = Array.isArray(forced)
    ? forced
    : String(forced).split(',');
  const cleaned = list.map((s) => s.trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
}
