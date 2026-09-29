import { Rng } from '../core/Rng.js';
import { levelConfig } from './generation/LevelConfig.js';
import { PuzzleGenerator } from './generation/PuzzleGenerator.js';
import { defaultDistractorStrategies } from './generation/distractors/index.js';

/**
 * Public entry point for the Figure Sequences game (Facade). Hides wiring
 * behind a single `generate` call while still allowing every collaborator to
 * be swapped for testing or new behaviour.
 *
 *   const engine = new FigureSequenceEngine();
 *   const puzzle = engine.generate({ level: 3, seed: 42 });
 *   console.log(JSON.stringify(puzzle.toJSON(), null, 2));
 */
export class FigureSequenceEngine {
  constructor({
    distractorStrategies = defaultDistractorStrategies(),
    configResolver = levelConfig,
  } = {}) {
    this.distractorStrategies = distractorStrategies;
    this.configResolver = configResolver;
  }

  /**
   * @param {object} [opts]
   * @param {number} [opts.level=1]
   * @param {number} [opts.seed]      Omit for a random seed.
   * @param {string|string[]} [opts.dimension] Force the varying dimension(s)
   *                                  (movement, rotation, flip, border, bold,
   *                                  size). A comma-separated string or array
   *                                  layers several. Omit to let the level pick.
   * @param {object} [opts.overrides] Partial LevelConfig overrides.
   */
  generate({
    level = 1,
    seed = (Math.random() * 2 ** 32) >>> 0,
    dimension,
    overrides = {},
  } = {}) {
    const config = { ...this.configResolver(level), ...overrides };
    const rng = new Rng(seed);
    const generator = new PuzzleGenerator({
      rng,
      distractorStrategies: this.distractorStrategies,
    });
    return generator.generate(config, seed, dimension);
  }
}
