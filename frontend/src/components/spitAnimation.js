/**
 * Sprite spit animation.
 * Generates mini problem snippets / boards from a puzzle engine and floats them
 * around a host element using Brownian-ish motion.
 */

import rough from 'roughjs';

const MAX_BUBBLES = 10;

// chalk color name → CSS color (matches figseq renderer)
const COLOR_MAP = {
  white: '#e8e4de', red: '#8b2e2e', blue: '#1e3a6e',
  green: '#3a7d44', yellow: '#8b6914', cyan: '#1a6e6e',
  magenta: '#6e1a6e', gray: '#6a6a6a', grey: '#6a6a6a',
};
function cssColor(n) { return COLOR_MAP[n] || '#1a1a1a'; }

// ── mini board renderer for figseq bubbles ────────────────────────────────────
function drawMiniFigseqBoard(svg, placements, bw, bh, cs) {
  const rc = rough.svg(svg);
  svg.setAttribute('width',  bw * cs);
  svg.setAttribute('height', bh * cs);
  svg.innerHTML = '';
  for (let x = 0; x <= bw; x++)
    svg.appendChild(rc.line(x*cs, 0, x*cs, bh*cs, { roughness:1.2, stroke:'#9a9490', strokeWidth:0.8 }));
  for (let y = 0; y <= bh; y++)
    svg.appendChild(rc.line(0, y*cs, bw*cs, y*cs, { roughness:1.2, stroke:'#9a9490', strokeWidth:0.8 }));
  for (const p of placements) {
    const cx = p.x*cs + cs/2, cy = p.y*cs + cs/2;
    const color = cssColor(p.color);
    const opts = { roughness:1.6, stroke:color, strokeWidth:1, fill:'none' };
    if (p.shape === 'circle') {
      const r = p.size === 'small' ? cs*0.14 : cs*0.22;
      svg.appendChild(rc.circle(cx, cy, r*2, { ...opts, fill:color, fillStyle:'solid' }));
    } else if (p.shape === 'square') {
      const h = p.size === 'small' ? cs*0.12 : cs*0.2;
      svg.appendChild(rc.rectangle(cx-h, cy-h, h*2, h*2, { ...opts, fill:color, fillStyle:'solid' }));
    } else if (p.shape === 'triangle') {
      const r = p.size === 'small' ? cs*0.14 : cs*0.22;
      const pts = [[cx, cy-r],[cx+r*0.87,cy+r*0.5],[cx-r*0.87,cy+r*0.5]];
      svg.appendChild(rc.polygon(pts, { ...opts, fill:color, fillStyle:'solid' }));
    } else if (p.shape === 'arrow') {
      // simple dot for tiny size
      svg.appendChild(rc.circle(cx, cy, cs*0.18, { roughness:1, stroke:color, strokeWidth:0.8, fill:color, fillStyle:'solid' }));
    }
  }
}

// ── mini latin grid renderer ──────────────────────────────────────────────────
function drawMiniLatinGrid(svg, grid, n, question, symbols, cs) {
  const rc = rough.svg(svg);
  const W = n * cs, H = n * cs;
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.innerHTML = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c*cs, y = r*cs;
      const isQ = r === question.row && c === question.col;
      svg.appendChild(rc.rectangle(x+0.5, y+0.5, cs-1, cs-1, {
        roughness: 2.0,
        stroke: isQ ? '#8b4513' : '#9a9490',
        strokeWidth: isQ ? 1.4 : 0.8,
        fill: isQ ? '#fff9e6' : 'none',
        fillStyle: 'solid',
      }));
      const val = isQ ? '?' : (grid[r][c] ?? '');
      if (val !== '') {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', x + cs/2);
        txt.setAttribute('y', y + cs/2 + 1);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('font-size', cs * 0.55);
        txt.setAttribute('font-family', 'serif');
        txt.setAttribute('fill', isQ ? '#8b4513' : '#1a1a1a');
        txt.textContent = val;
        svg.appendChild(txt);
      }
    }
  }
}

// ── text bubble (linsys) ─────────────────────────────────────────────────────
function makeTextBubble(text, color) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.3s ease;z-index:50;will-change:transform;';
  const FONT_SIZE = 10;
  const PAD_H = 8, PAD_V = 4;
  const W = Math.min(text.length * FONT_SIZE * 0.58 + PAD_H * 2, 165);
  const H = FONT_SIZE + PAD_V * 2 + 2;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.cssText = 'display:block;overflow:visible;';
  const rc = rough.svg(svg);
  svg.appendChild(rc.rectangle(1, 1, W-2, H-2, { roughness:2.6, stroke:color, strokeWidth:1.5, fill:'#faf7f2', fillStyle:'solid' }));
  const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', PAD_H); txt.setAttribute('y', H/2+1);
  txt.setAttribute('dominant-baseline', 'middle');
  txt.style.cssText = `font-size:${FONT_SIZE}px;font-family:'Gloria Hallelujah',cursive;fill:${color};`;
  txt.textContent = text.length > 22 ? text.slice(0,22)+'…' : text;
  svg.appendChild(txt);
  wrap.appendChild(svg);
  return wrap;
}

// ── board bubble (figseq / latinsq) ─────────────────────────────────────────
function makeBoardBubble(puzzle, typeKey, color) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.3s ease;z-index:50;will-change:transform;';

  let boardSvg, W, H;
  const outerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  outerSvg.style.cssText = 'display:block;overflow:visible;';

  if (typeKey === 'figseq') {
    const cs = 7;
    const bw = puzzle.board.width, bh = puzzle.board.height;
    const innerW = bw * cs, innerH = bh * cs;
    const PAD = 5;
    W = innerW + PAD * 2;
    H = innerH + PAD * 2;
    outerSvg.setAttribute('width', W); outerSvg.setAttribute('height', H);
    const rc = rough.svg(outerSvg);
    outerSvg.appendChild(rc.rectangle(1, 1, W-2, H-2, { roughness:2.4, stroke:color, strokeWidth:1.5, fill:'#faf7f2', fillStyle:'solid' }));
    // draw board inside a nested svg via foreignObject isn't reliable — use a group with transform
    boardSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawMiniFigseqBoard(boardSvg, puzzle.shownFrames[0].placements, bw, bh, cs);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${PAD},${PAD})`);
    // copy children from boardSvg into g
    while (boardSvg.firstChild) g.appendChild(boardSvg.firstChild);
    outerSvg.appendChild(g);
  } else {
    // latinsq
    const cs = 9;
    const { n, grid, question, symbols } = puzzle;
    const innerW = n * cs, innerH = n * cs;
    const PAD = 5;
    W = innerW + PAD * 2;
    H = innerH + PAD * 2;
    outerSvg.setAttribute('width', W); outerSvg.setAttribute('height', H);
    const rc = rough.svg(outerSvg);
    outerSvg.appendChild(rc.rectangle(1, 1, W-2, H-2, { roughness:2.4, stroke:color, strokeWidth:1.5, fill:'#faf7f2', fillStyle:'solid' }));
    boardSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawMiniLatinGrid(boardSvg, grid, n, question, symbols, cs);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${PAD},${PAD})`);
    while (boardSvg.firstChild) g.appendChild(boardSvg.firstChild);
    outerSvg.appendChild(g);
  }

  wrap.appendChild(outerSvg);
  wrap._bubbleW = W;
  wrap._bubbleH = H;
  return wrap;
}

// Random int in [lo, hi)
function randInt(lo, hi, rng) { return lo + Math.floor(rng() * (hi - lo)); }

// Seeded RNG (xorshift32)
function makeRng(seed) {
  let s = (seed >>> 0) || 0xdeadbeef;
  return () => { s ^= s<<13; s ^= s>>>17; s ^= s<<5; return (s>>>0)/0xffffffff; };
}

export function startSpitting(containerEl, spriteEl, typeKey, engineInfo, opts = {}) {
  const {
    continuous = false,
    max = MAX_BUBBLES,
    interval = 900,
    color = '#8b4513',
  } = opts;

  const bubbles = [];
  let stopped = false;
  let timerId = null;
  let seedCounter = (Date.now() & 0xffffffff) >>> 0;

  function nextSeed() { return (seedCounter = (seedCounter * 1664525 + 1013904223) >>> 0); }

  function spriteCenterInContainer() {
    const cr = containerEl.getBoundingClientRect();
    const sr = spriteEl.getBoundingClientRect();
    return {
      x: (sr.left + sr.right) / 2 - cr.left,
      y: (sr.top  + sr.bottom) / 2 - cr.top,
    };
  }

  function emitBubble() {
    if (stopped) return;
    if (bubbles.length >= max) return;

    const seed = nextSeed();
    const rng = makeRng(seed);
    // Random level 1–3 for variety
    const level = 1 + Math.floor(rng() * 3);

    let el;
    try {
      const puzzle = engineInfo.generate(engineInfo.engine, seed, level, undefined);
      if (typeKey === 'linsys') {
        const text = puzzle.equations?.[0]?.text ?? '?';
        el = makeTextBubble(text, color);
      } else {
        el = makeBoardBubble(puzzle, typeKey, color);
      }
    } catch (_) {
      el = makeTextBubble('?', color);
    }

    containerEl.appendChild(el);

    const origin = spriteCenterInContainer();
    let x = origin.x + randInt(-10, 10, rng);
    let y = origin.y + randInt(-10, 10, rng);
    let vx = (rng() - 0.5) * 1.6;
    let vy = -(rng() * 1.2 + 0.4);

    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;

    const cw = containerEl.offsetWidth  || 300;
    const ch = containerEl.offsetHeight || 200;

    requestAnimationFrame(() => { el.style.opacity = '0.92'; });

    let age = 0;
    const LIFETIME = 3200 + rng() * 1800;
    const STEP = 40;
    const bubbleObj = { el, timeoutId: null };

    function tick() {
      if (stopped) { cleanup(); return; }
      age += STEP;

      vx += (rng() - 0.5) * 0.3;
      vy += (rng() - 0.5) * 0.3 - 0.05;

      const spd = Math.sqrt(vx*vx + vy*vy);
      if (spd > 2.2) { vx *= 2.2/spd; vy *= 2.2/spd; }

      const bw = el._bubbleW ?? el.querySelector('svg')?.getAttribute('width') ?? 80;
      const bh = el._bubbleH ?? el.querySelector('svg')?.getAttribute('height') ?? 20;
      if (x < 4)           { x = 4;          vx =  Math.abs(vx); }
      if (x > cw-bw-4)    { x = cw-bw-4;    vx = -Math.abs(vx); }
      if (y < 4)           { y = 4;          vy =  Math.abs(vy); }
      if (y > ch-bh-4)    { y = ch-bh-4;    vy = -Math.abs(vy); }

      x += vx; y += vy;
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;

      if (age >= LIFETIME - 400) el.style.opacity = '0';

      if (age < LIFETIME) {
        bubbleObj.timeoutId = setTimeout(tick, STEP);
      } else {
        cleanup();
      }
    }

    function cleanup() {
      clearTimeout(bubbleObj.timeoutId);
      if (el.parentNode) el.parentNode.removeChild(el);
      const idx = bubbles.indexOf(bubbleObj);
      if (idx >= 0) bubbles.splice(idx, 1);
    }

    bubbles.push(bubbleObj);
    bubbleObj.timeoutId = setTimeout(tick, STEP);
  }

  emitBubble();

  if (continuous) {
    timerId = setInterval(() => { if (!stopped) emitBubble(); }, interval);
  }

  return function stop() {
    stopped = true;
    if (timerId) clearInterval(timerId);
    bubbles.forEach(b => {
      clearTimeout(b.timeoutId);
      if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
    });
    bubbles.length = 0;
  };
}

export function spitInElement(el, opts = {}) {
  const { delay = 0 } = opts;
  el.style.opacity = '0';
  el.style.transform = 'translateY(-22px) scale(0.95)';
  el.style.transition = 'none';
  setTimeout(() => {
    el.style.transition = 'opacity 0.2s ease, transform 0.32s cubic-bezier(0.22, 1.4, 0.36, 1)';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0) scale(1)';
  }, delay);
}

