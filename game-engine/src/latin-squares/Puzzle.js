/**
 * A generated Latin-square puzzle. Plain, JSON-serialisable data — no behaviour
 * beyond `toJSON()`. The `solution` block is included because this is a
 * *generator* that owns ground truth; a consumer that wants to hide the answer
 * can drop that key before showing the puzzle to a player (or use `checkGuess`
 * from the engine to validate without exposing it). Mirrors LinearSystemPuzzle.
 */
export class LatinSquarePuzzle {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      schema: 'latin-square@1',
      id: this.id,
      seed: this.seed,
      level: this.level,
      n: this.n,
      symbols: this.symbols,
      grid: this.grid,
      question: this.question,
      options: this.options,
      difficulty: this.difficulty,
      solution: this.solution,
    };
  }
}
