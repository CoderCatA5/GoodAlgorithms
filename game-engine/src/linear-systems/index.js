/**
 * Linear System — public surface for this puzzle type.
 *
 * Everything a host (CLI, web, tests) needs is re-exported here, so callers
 * depend on the game's package boundary rather than reaching into its
 * internals — the same convention as figure-sequences/index.js.
 */
export { LinearSystemEngine, checkGuess } from './LinearSystemEngine.js';
export { PrettyPrinter } from './render/PrettyPrinter.js';
export { LinearSystemPuzzle } from './Puzzle.js';
export { levelConfig } from './generation/LevelConfig.js';
