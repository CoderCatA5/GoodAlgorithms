import { Rng } from '../core/Rng.js';
import { levelConfig } from './generation/LevelConfig.js';
import { PuzzleGenerator } from './generation/PuzzleGenerator.js';

/**
 * Public entry point for the Latin Squares game (Facade). Hides wiring behind a
 * single `generate` call while keeping every collaborator swappable for testing
 * or new behaviour — mirrors LinearSystemEngine.
 *
 *   const engine = new LatinSquareEngine();
 *   const puzzle = engine.generate({ level: 3, seed: 42 });
 *   console.log(JSON.stringify(puzzle.toJSON(), null, 2));
 */
export class LatinSquareEngine {
  constructor({ configResolver = levelConfig } = {}) {
    this.configResolver = configResolver;
  }

  /**
   * @param {object} [opts]
   * @param {number} [opts.level=1]
   * @param {number} [opts.seed]      Omit for a random seed.
   * @param {object} [opts.overrides] Partial LevelConfig overrides — e.g.
   *        `{ n: 6 }` for a 6×6 grid, or `{ candidatesTarget: 3 }` to force how
   *        many options survive the cross.
   */
  generate({
    level = 1,
    seed = (Math.random() * 2 ** 32) >>> 0,
    overrides = {},
  } = {}) {
    const n = overrides.n ?? this.configResolver(level).n;
    const config = { ...this.configResolver(level, n), ...overrides };
    const rng = new Rng(seed);
    const generator = new PuzzleGenerator({ rng });
    return generator.generate(config, seed);
  }
}

/**
 * Validate a player's guess against a puzzle's ground truth without exposing the
 * solution. `guess` is the chosen symbol letter (case-insensitive), e.g. `'D'`.
 * @param {import('./Puzzle.js').LatinSquarePuzzle} puzzle
 * @param {string} guess
 * @returns {{ correct: boolean }}
 */
export function checkGuess(puzzle, guess) {
  const normalized = String(guess ?? '').trim().toUpperCase();
  return { correct: normalized === puzzle.solution.value };
}
