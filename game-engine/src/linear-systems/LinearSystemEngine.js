import { Rng } from '../core/Rng.js';
import { levelConfig } from './generation/LevelConfig.js';
import { SystemGenerator } from './generation/SystemGenerator.js';

/**
 * Public entry point for the Linear System game (Facade). Hides wiring behind a
 * single `generate` call while keeping every collaborator swappable for testing
 * or new behaviour — mirrors FigureSequenceEngine.
 *
 *   const engine = new LinearSystemEngine();
 *   const puzzle = engine.generate({ level: 3, seed: 42 });
 *   console.log(JSON.stringify(puzzle.toJSON(), null, 2));
 */
export class LinearSystemEngine {
  constructor({ configResolver = levelConfig } = {}) {
    this.configResolver = configResolver;
  }

  /**
   * @param {object} [opts]
   * @param {number} [opts.level=1]
   * @param {number} [opts.seed]      Omit for a random seed.
   * @param {object} [opts.overrides] Partial LevelConfig overrides — e.g.
   *        `{ valueRange: { min: 1, max: 50 } }` to widen the answer range, or
   *        `{ vars: 3 }` for a smaller system.
   */
  generate({
    level = 1,
    seed = (Math.random() * 2 ** 32) >>> 0,
    overrides = {},
  } = {}) {
    const config = { ...this.configResolver(level), ...overrides };
    const rng = new Rng(seed);
    const generator = new SystemGenerator({ rng });
    return generator.generate(config, seed);
  }
}

/**
 * Validate a player's guess against a puzzle's ground truth without exposing the
 * solution. `guess` is an object keyed by variable name, e.g. `{a:3,b:7,...}`.
 * @param {import('./Puzzle.js').LinearSystemPuzzle} puzzle
 * @param {Record<string, number>} guess
 * @returns {{ correct: boolean, perVariable: Record<string, boolean> }}
 */
export function checkGuess(puzzle, guess) {
  const perVariable = {};
  let correct = true;
  for (const name of puzzle.variables) {
    const ok = Number(guess?.[name]) === puzzle.solution.values[name];
    perVariable[name] = ok;
    if (!ok) correct = false;
  }
  return { correct, perVariable };
}
