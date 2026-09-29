/**
 * "Fuzzy break" decorators (Decorator pattern, a cousin of EveryNth). They wrap
 * a clean pattern so it is followed faithfully up to and including frame
 * `breakAt`, and then "breaks off" — from that point on the sprite obeys a
 * DIFFERENT rule (`alt`) instead.
 *
 * These exist for red herrings. A decoy that follows one deducible rule has a
 * single predictable next position, so it must be pinned identically across a
 * question's options or it would leak the answer. A decoy that BREAKS its rule
 * has no single "correct" next state — so it can be re-sampled independently for
 * every option (landing on a different square each time) without leaking a
 * thing. The break is the distraction, and the freedom to vary is its payoff.
 *
 * Both axes share the "compute state from time" contract, so — exactly like
 * EveryNth — one thin wrapper per axis covers movement and appearance alike and
 * `composeFields` never has to know a pattern is fuzzy.
 */

/**
 * Wraps a MovementPattern. Up to `breakAt` the sprite follows `inner`; after
 * that it continues from the cell it had reached and moves by `alt` — a
 * believable change of direction, not a teleport.
 */
export class FuzzyMovement {
  constructor(inner, alt, breakAt) {
    this.inner = inner;
    this.alt = alt;
    this.breakAt = breakAt;
  }

  get id() {
    return `${this.inner.id}~break${this.breakAt}->${this.alt.id}`;
  }

  positionAt(origin, t, board) {
    if (t <= this.breakAt) return this.inner.positionAt(origin, t, board);
    const pivot = this.inner.positionAt(origin, this.breakAt, board);
    return this.alt.positionAt(pivot, t - this.breakAt, board);
  }

  describe() {
    return `${this.inner.describe()}, then breaks off and ${this.alt.describe()}`;
  }
}

/**
 * Wraps an AppearancePattern. Up to `breakAt` the sprite looks as `inner` says;
 * after that it switches to `alt`, read on its own clock and nudged by `phase`
 * so even a one-state toggle (border/bold/size) lands somewhere unpredictable
 * rather than staying in lockstep with the clean rule.
 */
export class FuzzyAppearance {
  constructor(inner, alt, breakAt, phase = 0) {
    this.inner = inner;
    this.alt = alt;
    this.breakAt = breakAt;
    this.phase = phase;
  }

  get id() {
    return `${this.inner.id}~break${this.breakAt}->${this.alt.id}+${this.phase}`;
  }

  valueAt(t) {
    if (t <= this.breakAt) return this.inner.valueAt(t);
    return this.alt.valueAt(t - this.breakAt + this.phase);
  }

  describe() {
    return `${this.inner.describe()}, then breaks off and ${this.alt.describe()}`;
  }
}
