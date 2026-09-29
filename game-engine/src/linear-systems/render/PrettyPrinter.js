import chalk from 'chalk';

/**
 * Renders a LinearSystemPuzzle to a colourful terminal string. This is the only
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
    const { variables, valueRange } = puzzle;
    const out = [];

    out.push(
      this.c.bold('LINEAR SYSTEM') +
        this.c.dim(`   ·   Level ${puzzle.level}   ·   seed ${puzzle.seed}`),
    );
    out.push(
      this.c.dim(
        `Find ${variables.join(', ')} — each a whole number from ` +
          `${valueRange.min} to ${valueRange.max}.`,
      ),
    );
    out.push('');
    out.push('Solve the system:');
    out.push('');

    puzzle.equations.forEach((eq, i) => {
      out.push(`  ${this.c.dim(`(${i + 1})`)}  ${this._colorEquation(eq.text)}`);
    });
    out.push('');

    if (revealAnswer) {
      const sol = puzzle.solution.values;
      const line = variables.map((n) => `${n} = ${sol[n]}`).join(',   ');
      out.push(this.c.green.bold('Answer:  ') + this.c.green(line));
      out.push(
        this.c.dim(
          `  (exactly one solution — determinant = ${puzzle.solution.determinant})`,
        ),
      );
      out.push('');
    }

    return out.join('\n');
  }

  print(puzzle, opts) {
    console.log(this.render(puzzle, opts));
  }

  /** Dim the `=` and highlight the constant on the right-hand side. */
  _colorEquation(text) {
    const idx = text.lastIndexOf('=');
    if (idx < 0) return text;
    const lhs = text.slice(0, idx);
    const rhs = text.slice(idx + 1);
    return lhs + this.c.dim('=') + this.c.cyan(rhs);
  }
}
