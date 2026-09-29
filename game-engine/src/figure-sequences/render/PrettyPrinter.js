import chalk from 'chalk';
import { resolveGlyph } from './shapes.js';

/**
 * Renders a Puzzle to a colourful terminal string. This is the only module
 * that knows about presentation — the engine and generator are display-
 * agnostic (Single Responsibility). It reads the plain Puzzle data shape, so
 * it works equally on a live Puzzle object or one re-hydrated from JSON.
 */
export class PrettyPrinter {
  constructor({ chalkInstance = chalk } = {}) {
    this.c = chalkInstance;
  }

  /** @returns {string} the full rendered puzzle. */
  render(puzzle, { revealAnswer = false } = {}) {
    const { width, height } = puzzle.board;
    const out = [];

    out.push(
      this.c.bold(`FIGURE SEQUENCE`) +
        this.c.dim(`   ·   Level ${puzzle.level}   ·   seed ${puzzle.seed}`),
    );
    if (puzzle.dimensionLabels?.length) {
      const joined = puzzle.dimensionLabels.join('  +  ');
      const lead = puzzle.dimensionLabels.length > 1 ? 'These layer: ' : 'This puzzle: ';
      out.push(this.c.dim(lead) + this.c.italic(joined));
    }
    out.push('');
    out.push('Study how the pieces change across the first three boards:');
    out.push('');

    // Shown frames, left to right with arrows between.
    const shownBlocks = [];
    puzzle.shownFrames.forEach((frame, i) => {
      if (i > 0) shownBlocks.push(this._arrowBlock(height));
      shownBlocks.push(this._boardBlock(frame.placements, width, height, `board ${i + 1}`));
    });
    out.push(this._combine(shownBlocks, '  '));
    out.push('');
    out.push(
      this.c.bold('Each remaining board is its own question — pick the right board for both:'),
    );
    out.push('');

    // One sub-question per hidden board; its options laid out side by side.
    puzzle.subquestions.forEach((sq, qi) => {
      if (qi > 0) out.push('');
      out.push(this.c.bold.underline(`Which is ${sq.prompt}?`));
      out.push('');
      const blocks = sq.options.map((opt) =>
        this._boardBlock(opt.placements, width, height, `${opt.label}`),
      );
      out.push(this._combine(blocks, '   '));
      out.push('');
    });

    if (revealAnswer) {
      const answer = puzzle.subquestions
        .map((sq) => `${sq.prompt} → ${sq.correctLabel}`)
        .join('    ');
      out.push(this.c.green.bold(`Answer:  ${answer}`));
      for (const line of puzzle.solution.explanations) {
        out.push(this.c.dim('  • ') + line);
      }
      out.push('');
    }

    return out.join('\n');
  }

  print(puzzle, opts) {
    console.log(this.render(puzzle, opts));
  }

  // --- board rendering ------------------------------------------------

  _boardBlock(placements, width, height, title = '') {
    // Fill grid; on the rare overlap, the later placement wins.
    const grid = Array.from({ length: height }, () => Array(width).fill(null));
    for (const p of placements) {
      if (p.y >= 0 && p.y < height && p.x >= 0 && p.x < width) grid[p.y][p.x] = p;
    }

    const dash = '─'.repeat(width * 2 + 1);
    const lines = [this.c.dim(`┌${dash}┐`)];
    for (let y = 0; y < height; y++) {
      const cells = grid[y].map((p) => (p ? this._styleGlyph(p) : this.c.dim('·')));
      lines.push(this.c.dim('│ ') + cells.join(' ') + this.c.dim(' │'));
    }
    lines.push(this.c.dim(`└${dash}┘`));

    return { title, width: width * 2 + 3, lines };
  }

  /** Resolve a placement's glyph from its appearance, then colour and style it. */
  _styleGlyph(p) {
    const glyph = resolveGlyph(p);
    let style = this.c[p.color] ?? this.c.white;
    if (p.bold) style = style.bold;
    if (p.bordered) style = style.inverse; // reverse-video reads as a boxed tile
    return style(glyph);
  }

  _arrowBlock(height) {
    const total = height + 2;
    const mid = Math.floor(total / 2);
    const lines = Array.from({ length: total }, (_, i) =>
      i === mid ? this.c.dim(' → ') : '   ',
    );
    return { title: '', width: 3, lines };
  }

  /** Join blocks side by side, centring each block's title over its columns. */
  _combine(blocks, gap) {
    const pad = (s, w) => {
      const left = Math.floor((w - s.length) / 2);
      return ' '.repeat(Math.max(0, left)) + s + ' '.repeat(Math.max(0, w - s.length - left));
    };
    const rows = [];
    const hasTitle = blocks.some((b) => b.title);
    if (hasTitle) rows.push(blocks.map((b) => this.c.dim(pad(b.title, b.width))).join(gap));

    const lineCount = Math.max(...blocks.map((b) => b.lines.length));
    for (let i = 0; i < lineCount; i++) {
      rows.push(blocks.map((b) => b.lines[i] ?? ' '.repeat(b.width)).join(gap));
    }
    return rows.join('\n');
  }
}
