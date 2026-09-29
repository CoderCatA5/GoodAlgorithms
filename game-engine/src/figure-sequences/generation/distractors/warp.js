/**
 * Shared helpers for time-based distractors.
 *
 * A "time warp" proxy wraps a real pattern so it reports the inner pattern's
 * state at a *different* time than the one being rendered — the basis for
 * mistimed lures (freeze, double, reverse). It proxies whichever axis the inner
 * pattern implements (movement patterns expose `positionAt`, appearance
 * patterns `valueAt`), so a dimension's `contribute` calls the same method it
 * always would and the warp works across every dimension.
 */

/**
 * @param {object}   inner     the real pattern to wrap
 * @param {(t:number)=>number} mapT  maps render time → the time to sample inner at
 * @param {string}   idSuffix  tag appended to the id (for dedup/debug)
 */
export function timeWarpPattern(inner, mapT, idSuffix) {
  const wrap = {
    id: `${inner.id}#${idSuffix}`,
    describe: () => inner.describe(),
  };
  if (typeof inner.positionAt === 'function') {
    wrap.positionAt = (origin, t, board) => inner.positionAt(origin, mapT(t), board);
  }
  if (typeof inner.valueAt === 'function') {
    wrap.valueAt = (t) => inner.valueAt(mapT(t));
  }
  return wrap;
}

/** Shallow-equal over the flat placement-field objects `composeFields` returns. */
export function sameFields(a, b) {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
}
