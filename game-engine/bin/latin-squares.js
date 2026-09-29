#!/usr/bin/env node
import { LatinSquareEngine, PrettyPrinter } from '../src/latin-squares/index.js';

/**
 * CLI for the Latin Squares generator.
 *
 *   node bin/latin-squares.js --level 3 --seed 42          pretty-print a puzzle
 *   node bin/latin-squares.js --level 3 --seed 42 --answer  reveal the solution
 *   node bin/latin-squares.js --level 3 --json              emit raw JSON instead
 */
function parseArgs(argv) {
  const args = {
    level: 1,
    seed: undefined,
    size: undefined,
    repeats: undefined,
    json: false,
    answer: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level' || a === '-l') args.level = Number(argv[++i]);
    else if (a === '--seed' || a === '-s') args.seed = Number(argv[++i]);
    else if (a === '--size') args.size = Number(argv[++i]);
    else if (a === '--repeats' || a === '-r') args.repeats = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--answer' || a === '-a') args.answer = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const HELP = `Latin Squares — puzzle generator

Generates an n×n grid (default 5, symbols A–E) that's a partly-filled Latin
square with one cell marked ?. Every row and column holds each symbol exactly
once; pick the symbol that belongs in the ?.

Usage: node bin/latin-squares.js [options]

  -l, --level <n>   difficulty level (default 1). Higher = more options survive
                    scanning the ?'s row and column, so you must reason further.
  -s, --seed <n>    seed for reproducible puzzles (default random)
      --size <n>    grid order, 2-8 (default 5 → symbols A–E)
  -r, --repeats <n> force n symbols to appear twice in the ?'s cross (once in
                    the row, once in the column) — harder elimination. Default
                    scales with level.
      --json        print the puzzle as JSON instead of pretty output
  -a, --answer      reveal the solution in pretty output
  -h, --help        show this help
`;

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(HELP);
  process.exit(0);
}

const overrides = {};

if (args.size !== undefined) {
  if (!Number.isInteger(args.size) || args.size < 2 || args.size > 8) {
    console.error('error: --size must be an integer between 2 and 8');
    process.exit(1);
  }
  overrides.n = args.size;
}

if (args.repeats !== undefined) {
  const n = overrides.n ?? 5;
  if (!Number.isInteger(args.repeats) || args.repeats < 0 || args.repeats > n - 1) {
    console.error(`error: --repeats must be an integer between 0 and ${n - 1}`);
    process.exit(1);
  }
  overrides.repeatsTarget = args.repeats;
}

const engine = new LatinSquareEngine();
let puzzle;
try {
  puzzle = engine.generate({ level: args.level, seed: args.seed, overrides });
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}

if (args.json) {
  console.log(JSON.stringify(puzzle.toJSON(), null, 2));
} else {
  new PrettyPrinter().print(puzzle, { revealAnswer: args.answer });
}
