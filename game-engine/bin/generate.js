#!/usr/bin/env node
import { FigureSequenceEngine, PrettyPrinter } from '../src/figure-sequences/index.js';

/**
 * CLI for the Figure Sequences generator.
 *
 *   node bin/generate.js --level 3 --seed 42        pretty-print a puzzle
 *   node bin/generate.js --level 3 --seed 42 --answer   reveal the solution
 *   node bin/generate.js --level 3 --json           emit raw JSON instead
 */
function parseArgs(argv) {
  const args = {
    level: 1,
    seed: undefined,
    json: false,
    answer: false,
    dimension: undefined,
    options: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level' || a === '-l') args.level = Number(argv[++i]);
    else if (a === '--seed' || a === '-s') args.seed = Number(argv[++i]);
    else if (a === '--dim' || a === '-d') args.dimension = argv[++i];
    else if (a === '--options' || a === '-o') args.options = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--answer' || a === '-a') args.answer = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const HELP = `Figure Sequences — puzzle generator

Usage: node bin/generate.js [options]

  -l, --level <n>   difficulty level (default 1)
  -s, --seed <n>    seed for reproducible puzzles (default random)
  -d, --dim <names> force the varying dimension(s):
                      movement | rotation | flip | border | bold | size
                    comma-separate to layer, e.g. --dim movement,rotation
                    (default: chosen & layered from the level's unlocked set)
  -o, --options <n> number of answer choices per board, 2-8 (default 3);
                    e.g. --options 4 for an A/B/C/D multiple choice
      --json        print the puzzle as JSON instead of pretty output
  -a, --answer      reveal the solution in pretty output
  -h, --help        show this help
`;

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(HELP);
  process.exit(0);
}

// Answer choices per board default to the level's own setting; --options
// overrides it. Cap at 8 because option labels run A–H (see Puzzle.LABELS).
const overrides = {};
if (args.options !== undefined) {
  if (!Number.isInteger(args.options) || args.options < 2 || args.options > 8) {
    console.error('error: --options must be an integer between 2 and 8');
    process.exit(1);
  }
  overrides.optionsPerFrame = args.options;
}

const engine = new FigureSequenceEngine();
let puzzle;
try {
  puzzle = engine.generate({
    level: args.level,
    seed: args.seed,
    dimension: args.dimension,
    overrides,
  });
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}

if (args.json) {
  console.log(JSON.stringify(puzzle.toJSON(), null, 2));
} else {
  new PrettyPrinter().print(puzzle, { revealAnswer: args.answer });
}
