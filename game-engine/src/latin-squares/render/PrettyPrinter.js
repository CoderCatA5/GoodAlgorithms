import chalk from 'chalk';

/**
 * Renders a LatinSquarePuzzle to a colourful terminal string. This is the only
 * module that knows about presentation — the engine and generator are
 * display-agnostic (Single Responsibility). It reads the plain Puzzle data
 * shape, so it works equally on a live Puzzle or one rehydrated from JSON.
 */
export class PrettyPrinter {
  constructor({ chalkInstance = chalk } = {}) {
    this.c = chalkInstance;
  }

  /** @returns {string} the full rendered puzzle. */
  render(puzzle, { revealAnswer = false } = {}) {
    const { n, symbols, question } = puzzle;
    const out = [];

    out.push(
      this.c.bold('LATIN SQUARE') +
        this.c.dim(`   ·   Level ${puzzle.level}   ·   seed ${puzzle.seed}`),
    );
    out.push(
      this.c.dim(
        `Fill the ${this.c.reset.bold('?')}${this.c.dim(
          ` — every row and column holds ${symbols[0]}–${symbols[n - 1]} exactly once.`,
        )}`,
      ),
    );
    out.push('');
    out.push(this._grid(puzzle));
    out.push('');
    out.push(
      this.c.bold('Options:  ') +
        symbols.map((s) => this.c.cyan(s)).join('  '),
    );

    if (revealAnswer) {
      out.push('');
      out.push(
        this.c.green.bold('Answer:  ') +
          this.c.green(
            `${puzzle.solution.value}  (row ${question.row + 1}, col ${
              question.col + 1
            })`,
          ),
      );
      const { candidates, toSolve, repeats } = puzzle.difficulty;
      out.push(
        this.c.dim(
          `  cross leaves ${candidates.length} option${
            candidates.length === 1 ? '' : 's'
          } [${candidates.join(', ')}] → ${toSolve} to reason out` +
            (repeats > 0
              ? `; ${repeats} symbol${repeats === 1 ? '' : 's'} shown twice`
              : ''),
        ),
      );
      out.push('');
      out.push(this.c.dim('  Full solution:'));
      out.push(this._solutionGrid(puzzle));
    }

    return out.join('\n');
  }

  print(puzzle, opts) {
    console.log(this.render(puzzle, opts));
  }

  /** The puzzle grid: letters, a highlighted `?`, dim `·` for blanks. */
  _grid(puzzle) {
    const { grid, question } = puzzle;
    return grid
      .map((row, r) =>
        '   ' +
        row
          .map((cell, c) => {
            if (r === question.row && c === question.col) {
              return this.c.black.bgYellow.bold(' ? ');
            }
            if (cell == null) return this.c.dim(' · ');
            return this.c.bold(` ${cell} `);
          })
          .join(''),
      )
      .join('\n');
  }

  /** The fully solved grid, with the answer cell highlighted green. */
  _solutionGrid(puzzle) {
    const { solution, question } = puzzle;
    return solution.full
      .map((row, r) =>
        '   ' +
        row
          .map((cell, c) => {
            if (r === question.row && c === question.col) {
              return this.c.black.bgGreen.bold(` ${cell} `);
            }
            return this.c.dim(` ${cell} `);
          })
          .join(''),
      )
      .join('\n');
  }
}
