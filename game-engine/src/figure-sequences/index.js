/**
 * Figure Sequences — public surface for this puzzle type.
 *
 * Everything a host (CLI, web, tests) needs is re-exported here, so callers
 * depend on the game's package boundary rather than reaching into its
 * internals. Future puzzle types get their own sibling folder + index.js.
 */
export { FigureSequenceEngine } from './FigureSequenceEngine.js';
export { PrettyPrinter } from './render/PrettyPrinter.js';
export { Puzzle } from './Puzzle.js';
export { levelConfig } from './generation/LevelConfig.js';
