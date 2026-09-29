/**
 * A generated puzzle. Plain, JSON-serialisable data — no behaviour beyond
 * `toJSON()`. The `solution` block is included because this is a *generator*
 * that owns ground truth; a consumer that wants to hide the answer can simply
 * drop that key before showing the puzzle to a player.
 */
export class Puzzle {
  constructor(data) {
    Object.assign(this, data);
  }

  static LABELS = 'ABCDEFGH';

  static labelFor(index) {
    return Puzzle.LABELS[index] ?? `#${index}`;
  }

  toJSON() {
    return {
      schema: 'figure-sequence@2',
      id: this.id,
      seed: this.seed,
      level: this.level,
      dimensions: this.dimensions,
      dimensionLabels: this.dimensionLabels,
      board: this.board,
      sprites: this.sprites,
      shownFrames: this.shownFrames,
      subquestions: this.subquestions,
      solution: this.solution,
    };
  }
}
