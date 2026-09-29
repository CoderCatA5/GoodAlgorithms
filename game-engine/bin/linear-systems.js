#!/usr/bin/env node
import { LinearSystemEngine, PrettyPrinter } from '../src/linear-systems/index.js';

/**
 * CLI for the Linear System generator.
 *
 *   node bin/linear-systems.js --level 3 --seed 42          pretty-print a puzzle
 *   node bin/linear-systems.js --level 3 --seed 42 --answer  reveal the solution
 *   node bin/linear-systems.js --level 3 --json              emit raw JSON instead
 */
function parseArgs(argv) {
  const args = {
    level: 1,
    seed: undefined,
    json: false,
    answer: false,
    vars: undefined,
    max: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level' || a === '-l') args.level = Number(argv[++i]);
    else if (a === '--seed' || a === '-s') args.seed = Number(argv[++i]);
    else if (a === '--vars' || a === '-v') args.vars = Number(argv[++i]);
    else if (a === '--max' || a === '-m') args.max = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--answer' || a === '-a') args.answer = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const HELP = `Linear System — puzzle generator

Generates a system of linear equations with a unique whole-number solution.
Solve for the unknowns (a, b, c, d by default).

Usage: node bin/linear-systems.js [options]

  -l, --level <n>   difficulty level (default 1). Higher = denser equations,
                    larger coefficients, and negative coefficients.
  -s, --seed <n>    seed for reproducible puzzles (default random)
  -v, --vars <n>    number of unknowns, 2-6 (default 4 → a, b, c, d)
  -m, --max <n>     unknowns are integers from 1 to <n> (default 20)
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

if (args.vars !== undefined) {
  if (!Number.isInteger(args.vars) || args.vars < 2 || args.vars > 6) {
    console.error('error: --vars must be an integer between 2 and 6');
    process.exit(1);
  }
  overrides.vars = args.vars;
}

if (args.max !== undefined) {
  if (!Number.isInteger(args.max) || args.max < 2) {
    console.error('error: --max must be an integer of at least 2');
    process.exit(1);
  }
  overrides.valueRange = { min: 1, max: args.max };
}

const engine = new LinearSystemEngine();
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
