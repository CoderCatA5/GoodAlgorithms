/**
 * A generated linear-system puzzle. Plain, JSON-serialisable data — no
 * behaviour beyond `toJSON()`. The `solution` block is included because this is
 * a *generator* that owns ground truth; a consumer that wants to hide the
 * answer can drop that key before showing the puzzle to a player (or use
 * `checkGuess` from the engine to validate without exposing it).
 */
export class LinearSystemPuzzle {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      schema: 'linear-system@1',
      id: this.id,
      seed: this.seed,
      level: this.level,
      variables: this.variables,
      valueRange: this.valueRange,
      equations: this.equations,
      matrix: this.matrix,
      constants: this.constants,
      solution: this.solution,
    };
  }
}
