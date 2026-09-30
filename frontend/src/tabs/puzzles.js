import rough from 'roughjs';
import { FigureSequenceEngine } from '@engine/figure-sequences/FigureSequenceEngine.js';
import { LinearSystemEngine } from '@engine/linear-systems/LinearSystemEngine.js';
import { LatinSquareEngine } from '@engine/latin-squares/LatinSquareEngine.js';
import { renderFigseqPuzzle } from '../renderers/figseq.js';
import { renderLinSysPuzzle } from '../renderers/linsys.js';
import { renderLatinSqPuzzle } from '../renderers/latinsq.js';
import { addSession } from '../store.js';
import { startSpitting, spitInElement } from '../components/spitAnimation.js';

const TYPES = {
  figseq: {
    label: 'Figure Sequences',
    tagline: "Patterns don't lie. Can you?",
    desc: 'Study how boards change across three frames, then predict the next two. Each puzzle hides a rule — movement, rotation, flip, or size. Spot it before the sequence does.',
    engine: new FigureSequenceEngine(),
    generate: (engine, seed, level, dimension) => engine.generate({ seed, level, dimension }),
    // Pokémon data
    monName: 'PATTERNIX',
    monType: ['PSYCHIC', 'VISUAL'],
    monFlavour: 'A rare puzzle-mon that hides rules inside shifting boards. Trainers who catch its pattern prove true perception.',
    monStats: { SPD: 72, INT: 95, VIS: 88, STR: 44 },
    monColor: '#3a7d44',
  },
  linsys: {
    label: 'Linear Systems',
    tagline: 'X marks the spot. Find it.',
    desc: 'Solve simultaneous equations to find every unknown. No calculators — just pattern recognition and algebraic reasoning. Each variable is a whole number.',
    engine: new LinearSystemEngine(),
    generate: (engine, seed, level) => engine.generate({ seed, level }),
    monName: 'ALGEBRAON',
    monType: ['MATH', 'LOGIC'],
    monFlavour: 'Forged in the furnace of simultaneous equations. Its unknown variables are said to hold the answer to everything.',
    monStats: { SPD: 55, INT: 99, VIS: 40, STR: 78 },
    monColor: '#8b4513',
  },
  latinsq: {
    label: 'Latin Squares',
    monName: 'GRIDURA',
    tagline: 'Every row, every column. No repeat.',
    desc: 'Fill the missing cell so each row and column holds every symbol exactly once. Simple rule. Devious execution.',
    engine: new LatinSquareEngine(),
    generate: (engine, seed, level) => engine.generate({ seed, level }),
    monType: ['GRID', 'LOGIC'],
    monFlavour: 'An ancient puzzle-mon whose body is a perfect 5×5 grid. No symbol ever repeats in its domain.',
    monStats: { SPD: 38, INT: 85, VIS: 62, STR: 91 },
    monColor: '#8b6914',
  },
};

function drawMonSprite(svg, type) {
  const rc = rough.svg(svg);
  svg.innerHTML = '';
  const a = (...args) => svg.appendChild(rc.rectangle(...args));
  const l = (...args) => svg.appendChild(rc.line(...args));
  const e = (...args) => svg.appendChild(rc.ellipse(...args));

  if (type === 'figseq') {
    a(8, 20, 26, 26, { roughness: 2.5, stroke: '#3a7d44', strokeWidth: 2, fill: '#e8f5e9', fillStyle: 'hachure', hachureGap: 5 });
    a(42, 20, 26, 26, { roughness: 2.5, stroke: '#3a7d44', strokeWidth: 2, fill: '#c8e6c9', fillStyle: 'hachure', hachureGap: 4 });
    l(36, 33, 41, 33, { roughness: 1.2, stroke: '#2d2d2d', strokeWidth: 2 });
    l(38, 29, 41, 33, { roughness: 1, stroke: '#2d2d2d', strokeWidth: 2 });
    l(38, 37, 41, 33, { roughness: 1, stroke: '#2d2d2d', strokeWidth: 2 });
    e(52, 29, 5, 5, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    e(62, 29, 5, 5, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    l(52, 46, 48, 60, { roughness: 2, stroke: '#3a7d44', strokeWidth: 2 });
    l(64, 46, 68, 60, { roughness: 2, stroke: '#3a7d44', strokeWidth: 2 });
    a(18, 62, 40, 6, { roughness: 1.5, stroke: '#9a9490', strokeWidth: 1 });
    a(18, 62, 28, 6, { roughness: 1, stroke: '#3a7d44', strokeWidth: 1, fill: '#3a7d44', fillStyle: 'solid' });
  } else if (type === 'linsys') {
    e(40, 36, 44, 38, { roughness: 2.5, stroke: '#8b4513', strokeWidth: 2, fill: '#fff3e0', fillStyle: 'hachure', hachureGap: 5 });
    l(18, 30, 38, 30, { roughness: 1.5, stroke: '#2d2d2d', strokeWidth: 1.5 });
    l(18, 38, 38, 38, { roughness: 1.5, stroke: '#2d2d2d', strokeWidth: 1.5 });
    l(42, 30, 50, 30, { roughness: 1.2, stroke: '#8b4513', strokeWidth: 2 });
    l(42, 36, 50, 36, { roughness: 1.2, stroke: '#8b4513', strokeWidth: 2 });
    e(30, 26, 6, 6, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    e(50, 26, 6, 6, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    l(28, 55, 22, 68, { roughness: 2, stroke: '#8b4513', strokeWidth: 2 });
    l(52, 55, 58, 68, { roughness: 2, stroke: '#8b4513', strokeWidth: 2 });
    a(18, 72, 40, 6, { roughness: 1.5, stroke: '#9a9490', strokeWidth: 1 });
    a(18, 72, 36, 6, { roughness: 1, stroke: '#8b4513', strokeWidth: 1, fill: '#8b4513', fillStyle: 'solid' });
  } else {
    const s = 12, ox = 14, oy = 10;
    for (let i = 0; i <= 4; i++) {
      l(ox + i * s, oy, ox + i * s, oy + 4 * s, { roughness: 1.8, stroke: '#8b6914', strokeWidth: 1.5 });
      l(ox, oy + i * s, ox + 4 * s, oy + i * s, { roughness: 1.8, stroke: '#8b6914', strokeWidth: 1.5 });
    }
    e(ox + s * 0.5, oy + s * 0.5, 7, 7, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    e(ox + s * 1.5, oy + s * 0.5, 7, 7, { roughness: 1.5, stroke: '#1a1a1a', strokeWidth: 1.5, fill: '#1a1a1a', fillStyle: 'solid' });
    a(ox + s * 1.5, oy + s * 1.5, s, s, { roughness: 1.5, stroke: '#8b6914', strokeWidth: 2, fill: '#fff9e6', fillStyle: 'solid' });
    l(ox + s, oy + 4 * s, ox + s - 6, oy + 4 * s + 14, { roughness: 2, stroke: '#8b6914', strokeWidth: 2 });
    l(ox + 3 * s, oy + 4 * s, ox + 3 * s + 6, oy + 4 * s + 14, { roughness: 2, stroke: '#8b6914', strokeWidth: 2 });
    a(18, 73, 40, 5, { roughness: 1.5, stroke: '#9a9490', strokeWidth: 1 });
    a(18, 73, 20, 5, { roughness: 1, stroke: '#8b6914', strokeWidth: 1, fill: '#8b6914', fillStyle: 'solid' });
  }
}

// ── Pokémon type badge (rough.js SVG rectangle + text) ───────────────────────
const TYPE_BADGE_COLORS = {
  PSYCHIC: '#b05090', VISUAL: '#3a7d44', MATH: '#8b4513',
  LOGIC: '#4a6fa5', GRID: '#8b6914',
};

function makeTypeBadge(typeName) {
  const color = TYPE_BADGE_COLORS[typeName] || '#555';
  const W = typeName.length * 7.2 + 14; // rough width estimate
  const H = 18;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.style.cssText = `display:inline-block;vertical-align:middle;margin-right:4px;overflow:visible;`;
  const rc = rough.svg(svg);
  svg.appendChild(rc.rectangle(1, 1, W - 2, H - 2, {
    roughness: 2.2,
    stroke: color,
    strokeWidth: 1.5,
    fill: color,
    fillStyle: 'solid',
  }));
  const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', W / 2);
  txt.setAttribute('y', H / 2 + 1);
  txt.setAttribute('text-anchor', 'middle');
  txt.setAttribute('dominant-baseline', 'middle');
  txt.style.cssText = `font-size:8px;font-family:var(--font);fill:#fff;letter-spacing:0.08em;pointer-events:none;`;
  txt.textContent = typeName;
  svg.appendChild(txt);
  return svg;
}

// ── Stat bar (rough.js SVG track + fill) ─────────────────────────────────────
function makeStatBar(label, value, color) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';

  const lbl = document.createElement('span');
  lbl.textContent = label;
  lbl.style.cssText = `font-size:0.55rem;width:28px;color:var(--ink-faint);font-family:var(--font);flex-shrink:0;`;

  // SVG bar: track + fill drawn with rough.js
  const TH = 9; // track height
  const wrap = document.createElement('div');
  wrap.style.cssText = 'flex:1;position:relative;height:' + TH + 'px;min-width:40px;';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;';
  svg.setAttribute('preserveAspectRatio', 'none');

  // We defer drawing until the element is in the DOM so we can read its width
  requestAnimationFrame(() => {
    const tw = wrap.offsetWidth || 100;
    svg.setAttribute('viewBox', `0 0 ${tw} ${TH}`);
    const rc = rough.svg(svg);
    // Track (background)
    svg.appendChild(rc.rectangle(0, 1, tw, TH - 2, {
      roughness: 1.6, stroke: '#9a9490', strokeWidth: 1,
      fill: '#d4cfc9', fillStyle: 'solid',
    }));
    // Fill
    const fw = Math.max(2, (value / 100) * tw);
    svg.appendChild(rc.rectangle(0, 1, fw, TH - 2, {
      roughness: 1.8, stroke: color, strokeWidth: 1.2,
      fill: color, fillStyle: 'hachure', hachureGap: 3,
    }));
  });

  wrap.appendChild(svg);

  const val = document.createElement('span');
  val.textContent = value;
  val.style.cssText = `font-size:0.55rem;width:22px;text-align:right;color:var(--ink-dim);font-family:var(--font);flex-shrink:0;`;

  row.appendChild(lbl);
  row.appendChild(wrap);
  row.appendChild(val);
  return row;
}

// ── Step 1: Pokémon selector ──────────────────────────────────────────────────
function showTiles(container, onSelect) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center;margin-bottom:24px;max-width:720px;margin-left:auto;margin-right:auto;';
  const htitle = document.createElement('div');
  htitle.style.cssText = 'font-size:1.3rem;font-weight:700;color:var(--accent);margin-bottom:4px;';
  htitle.textContent = 'Choose your puzzle!';
  const hsub = document.createElement('div');
  hsub.style.cssText = 'font-size:0.75rem;color:var(--ink-faint);';
  hsub.textContent = 'Three puzzle-mon await. Only one can be your focus.';
  header.appendChild(htitle);
  header.appendChild(hsub);
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.id = 'puzzle-tiles';
  container.appendChild(grid);

  Object.entries(TYPES).forEach(([key, info]) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';

    const card = document.createElement('wired-card');
    card.setAttribute('elevation', '1');
    card.style.cssText = 'padding:10px 12px 12px;display:block;width:100%;';

    // Mon name + types
    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
    const monName = document.createElement('div');
    monName.style.cssText = 'font-size:0.72rem;font-weight:700;color:var(--ink);letter-spacing:0.05em;';
    monName.textContent = info.monName;
    const typeBadges = document.createElement('div');
    info.monType.forEach(t => typeBadges.appendChild(makeTypeBadge(t)));
    nameRow.appendChild(monName);
    nameRow.appendChild(typeBadges);
    card.appendChild(nameRow);

    // Sprite SVG — draw BEFORE appending card to DOM so wired-card upgrade doesn't wipe it
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', '0 0 80 80');
    svgEl.setAttribute('width', '80');
    svgEl.setAttribute('height', '80');
    svgEl.style.cssText = 'display:block;margin:4px auto 6px;';
    drawMonSprite(svgEl, key);  // draw now, before connectedCallback
    card.appendChild(svgEl);

    // Puzzle label
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:0.65rem;color:var(--ink-dim);text-align:center;margin-bottom:8px;';
    labelEl.textContent = info.label;
    card.appendChild(labelEl);

    // Stats
    const statsEl = document.createElement('div');
    Object.entries(info.monStats).forEach(([stat, val]) => {
      statsEl.appendChild(makeStatBar(stat, val, info.monColor));
    });
    card.appendChild(statsEl);

    tile.appendChild(card);
    grid.appendChild(tile);  // wired-card upgrades here — SVG already has content

    // Hover spit: make tile a positioned container, emit one bubble on mouseenter
    tile.style.position = 'relative';
    tile.style.overflow = 'hidden';
    let stopHoverSpit = null;
    tile.addEventListener('mouseenter', () => {
      if (stopHoverSpit) return;
      stopHoverSpit = startSpitting(tile, svgEl, key, info, {
        continuous: false,
        singleShot: true,
        max: 3,
        color: info.monColor,
      });
    });
    tile.addEventListener('mouseleave', () => {
      if (stopHoverSpit) { stopHoverSpit(); stopHoverSpit = null; }
    });

    tile.addEventListener('click', () => onSelect(key));
  });
}

// ── Step 2: Intro (Pokémon info card style) ───────────────────────────────────
function showIntro(container, typeKey, onStart, onBack) {
  container.innerHTML = '';
  const info = TYPES[typeKey];

  const wrap = document.createElement('div');
  wrap.id = 'puzzle-intro';
  wrap.style.position = 'relative';  // needed for absolute-positioned bubbles

  const backBtn = document.createElement('wired-button');
  backBtn.textContent = '← Back';
  backBtn.style.marginBottom = '16px';
  // listener added below after stopBrownian is defined
  wrap.appendChild(backBtn);

  // Sprite above the dex card — draw before appending to DOM
  const svgWrap = document.createElement('div');
  svgWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:-10px;z-index:1;position:relative;';
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', '0 0 80 80');
  svgEl.setAttribute('width', '110');
  svgEl.setAttribute('height', '110');
  drawMonSprite(svgEl, typeKey);
  svgWrap.appendChild(svgEl);
  wrap.appendChild(svgWrap);

  // Dex card
  const dexWrap = document.createElement('div');
  dexWrap.style.cssText = 'max-width:420px;margin:0 auto 16px;';

  const dexCard = document.createElement('wired-card');
  dexCard.setAttribute('elevation', '2');
  dexCard.style.cssText = 'padding:20px;display:block;';

  // Top row: just info (sprite is above the card now)
  const infoCol = document.createElement('div');

  const monNameEl = document.createElement('div');
  monNameEl.style.cssText = 'font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:4px;';
  monNameEl.textContent = info.monName;

  const typeRow = document.createElement('div');
  typeRow.style.marginBottom = '8px';
  info.monType.forEach(t => typeRow.appendChild(makeTypeBadge(t)));

  const puzzleLabelEl = document.createElement('div');
  puzzleLabelEl.style.cssText = 'font-size:0.7rem;color:var(--ink-faint);margin-bottom:6px;';
  puzzleLabelEl.textContent = info.label;

  const statsEl = document.createElement('div');
  Object.entries(info.monStats).forEach(([stat, val]) => {
    statsEl.appendChild(makeStatBar(stat, val, info.monColor));
  });

  infoCol.appendChild(monNameEl);
  infoCol.appendChild(typeRow);
  infoCol.appendChild(puzzleLabelEl);
  infoCol.appendChild(statsEl);
  dexCard.appendChild(infoCol);

  // Flavour text (Pokédex entry style)
  const divider = document.createElement('wired-divider');
  divider.style.margin = '10px 0';
  dexCard.appendChild(divider);

  const flavour = document.createElement('div');
  flavour.style.cssText = 'font-size:0.72rem;color:var(--ink-dim);line-height:1.6;margin-bottom:14px;';
  flavour.textContent = `Pokédex: ${info.monFlavour}`;
  dexCard.appendChild(flavour);

  const taglineEl = document.createElement('div');
  taglineEl.style.cssText = 'font-size:0.8rem;color:var(--accent);font-weight:700;margin-bottom:4px;';
  taglineEl.textContent = `"${info.tagline}"`;
  dexCard.appendChild(taglineEl);

  dexWrap.appendChild(dexCard);
  wrap.appendChild(dexWrap);

  const startBtn = document.createElement('wired-button');
  startBtn.textContent = 'Choose this puzzle! →';
  startBtn.style.cssText = 'display:block;margin:0 auto;';
  startBtn.addEventListener('click', () => { stopBrownian(); onStart(); });
  wrap.appendChild(startBtn);

  container.appendChild(wrap);

  // Start continuous Brownian spit from the intro sprite
  const stopBrownian = startSpitting(wrap, svgEl, typeKey, info, {
    continuous: true,
    max: 10,
    interval: 850,
    color: info.monColor,
  });

  // Clean up if back is pressed
  backBtn.addEventListener('click', () => { stopBrownian(); onBack(); });
}

// ── Step 3: Config ────────────────────────────────────────────────────────────
function showConfig(container, typeKey, onBegin, onBack) {
  container.innerHTML = '';
  const info = TYPES[typeKey];

  const wrap = document.createElement('div');
  wrap.id = 'test-config';

  const backBtn = document.createElement('wired-button');
  backBtn.textContent = '← Back';
  backBtn.style.marginBottom = '16px';
  backBtn.addEventListener('click', onBack);
  wrap.appendChild(backBtn);

  const h3 = document.createElement('h3');
  h3.textContent = `Configure: ${info.label}`;
  wrap.appendChild(h3);

  const LEVEL_DESCS = {
    figseq: [
      '',
      'L1 — 1 sprite, movement only',
      'L2 — 2 sprites + 1 decoy, rotation added',
      'L3 — 3 sprites + 1 decoy, flip added',
      'L4 — 4 sprites + 2 decoys, all dimensions',
      'L5 — 5 sprites + 2 decoys, high complexity',
      'L6 — 5 sprites + 3 decoys, maximum difficulty',
    ],
    linsys: [
      '',
      'L1 — 2 variables, small values',
      'L2 — 2 variables, larger values',
      'L3 — 3 variables',
      'L4 — 3 variables, harder coefficients',
      'L5 — 4 variables',
      'L6 — 4 variables, maximum difficulty',
    ],
    latinsq: [
      '',
      'L1 — 5×5, 1 candidate (easy elimination)',
      'L2 — 5×5, 1 candidate (harder grid)',
      'L3 — 5×5, 2 candidates',
      'L4 — 5×5, 3 candidates',
      'L5 — 5×5, 4 candidates',
      'L6 — 5×5, 5 candidates (all symbols possible)',
    ],
  };

  // Level — wired-radio-group
  let selectedLevel = 1;
  const levelRow = document.createElement('div');
  levelRow.className = 'config-row';
  const levelLabel = document.createElement('div');
  levelLabel.className = 'config-label';
  levelLabel.textContent = 'Level';
  levelRow.appendChild(levelLabel);

  const radioGroup = document.createElement('wired-radio-group');
  radioGroup.setAttribute('selected', '1');
  for (let l = 1; l <= 6; l++) {
    const radio = document.createElement('wired-radio');
    radio.setAttribute('name', String(l));
    radio.textContent = `  ${l}`;
    radioGroup.appendChild(radio);
  }
  const levelDesc = document.createElement('div');
  levelDesc.style.cssText = 'font-size:0.78rem;color:var(--ink-faint);margin-top:4px;';
  levelDesc.textContent = LEVEL_DESCS[typeKey][1];

  radioGroup.addEventListener('selected', (e) => {
    selectedLevel = Number(e.detail?.selected ?? radioGroup.selected ?? 1);
    levelDesc.textContent = LEVEL_DESCS[typeKey][selectedLevel] || '';
  });
  radioGroup.addEventListener('change', (e) => {
    selectedLevel = Number(e.detail?.selected ?? radioGroup.selected ?? 1);
    levelDesc.textContent = LEVEL_DESCS[typeKey][selectedLevel] || '';
  });
  levelRow.appendChild(radioGroup);
  wrap.appendChild(levelRow);
  wrap.appendChild(levelDesc);

  // Dimension selector for figseq only
  let selectedDimension = undefined;
  if (typeKey === 'figseq') {
    const dimRow = document.createElement('div');
    dimRow.className = 'config-row';
    const dimLabel = document.createElement('div');
    dimLabel.className = 'config-label';
    dimLabel.textContent = 'Focus';
    dimRow.appendChild(dimLabel);

    const dimGroup = document.createElement('wired-radio-group');
    dimGroup.setAttribute('selected', 'auto');
    const dimOptions = [
      { name: 'auto',     label: 'Auto' },
      { name: 'movement', label: 'Movement' },
      { name: 'rotation', label: 'Rotation' },
      { name: 'flip',     label: 'Flip' },
      { name: 'size',     label: 'Size' },
    ];
    dimOptions.forEach(({ name, label }) => {
      const radio = document.createElement('wired-radio');
      radio.setAttribute('name', name);
      radio.textContent = `  ${label}`;
      dimGroup.appendChild(radio);
    });
    const updateDim = (e) => {
      const val = e.detail?.selected ?? dimGroup.selected ?? 'auto';
      selectedDimension = val === 'auto' ? undefined : val;
    };
    dimGroup.addEventListener('selected', updateDim);
    dimGroup.addEventListener('change', updateDim);
    dimRow.appendChild(dimGroup);
    wrap.appendChild(dimRow);
  }

  // Quiz mode selector
  let quizMode = 'instant'; // 'instant' | 'batch'
  const modeRow = document.createElement('div');
  modeRow.className = 'config-row';
  const modeLabel = document.createElement('div');
  modeLabel.className = 'config-label';
  modeLabel.textContent = 'Mode';
  modeRow.appendChild(modeLabel);

  const modeGroup = document.createElement('wired-radio-group');
  modeGroup.setAttribute('selected', 'instant');
  [
    { name: 'instant', label: 'Instant — answer one, see result, continue' },
    { name: 'batch',   label: 'Batch — answer all 20, then review' },
  ].forEach(({ name, label }) => {
    const r = document.createElement('wired-radio');
    r.setAttribute('name', name);
    r.textContent = `  ${label}`;
    modeGroup.appendChild(r);
  });
  modeGroup.addEventListener('selected', e => { quizMode = e.detail?.selected ?? modeGroup.selected ?? 'instant'; });
  modeGroup.addEventListener('change',   e => { quizMode = e.detail?.selected ?? modeGroup.selected ?? 'instant'; });
  modeRow.appendChild(modeGroup);
  wrap.appendChild(modeRow);

  // Questions count note
  const note = document.createElement('p');
  note.style.cssText = 'font-size:0.8rem;color:var(--ink-faint);margin-bottom:16px;';
  note.textContent = '20 questions will be generated from a fresh random seed array.';
  wrap.appendChild(note);

  // Divider
  const div = document.createElement('wired-divider');
  div.style.margin = '12px 0';
  wrap.appendChild(div);

  const startBtn = document.createElement('wired-button');
  startBtn.textContent = 'Start test →';
  startBtn.addEventListener('click', () => {
    const level = Number(radioGroup.selected) || selectedLevel || 1;
    const seeds = Array.from({ length: 20 }, () => (Math.random() * 2 ** 32) >>> 0);
    onBegin({ level, seeds, dimension: selectedDimension, quizMode });
  });
  wrap.appendChild(startBtn);
  container.appendChild(wrap);
}

// ── Step 4: Test session ──────────────────────────────────────────────────────
function showSession(container, typeKey, { level, seeds, dimension, quizMode = 'instant' }, onDone) {
  container.innerHTML = '';
  const info = TYPES[typeKey];
  const total = seeds.length;
  const puzzles = seeds.map(seed => info.generate(info.engine, seed, level, dimension));

  const sessionDiv = document.createElement('div');
  sessionDiv.id = 'test-session';

  // ── Shared header ─────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.id = 'session-header';

  const h3 = document.createElement('h3');
  h3.textContent = `${info.label} · Level ${level} · ${quizMode === 'batch' ? 'Batch' : 'Instant'}`;
  header.appendChild(h3);

  const progressWrap = document.createElement('div');
  progressWrap.id = 'session-progress-wrap';
  const progressBar = document.createElement('wired-progress');
  progressBar.setAttribute('max', total);
  progressBar.setAttribute('value', '0');
  progressBar.setAttribute('percentage', '');
  progressWrap.appendChild(progressBar);
  header.appendChild(progressWrap);
  requestAnimationFrame(() => {
    if (progressBar.shadowRoot) {
      const style = document.createElement('style');
      style.textContent = '.labelContainer { display: none !important; } .progressLabel { display: none !important; }';
      progressBar.shadowRoot.appendChild(style);
    }
  });

  const counter = document.createElement('div');
  counter.id = 'session-counter';
  header.appendChild(counter);

  sessionDiv.appendChild(header);

  const divider = document.createElement('wired-divider');
  divider.style.marginBottom = '16px';
  sessionDiv.appendChild(divider);

  const questionArea = document.createElement('div');
  sessionDiv.appendChild(questionArea);

  container.appendChild(sessionDiv);

  // ─────────────────────────────────────────────────────────────────────────
  // INSTANT MODE: one question at a time, result shown in-page immediately
  // ─────────────────────────────────────────────────────────────────────────
  if (quizMode === 'instant') {
    const results = [];
    let qi = 0;

    function renderInstant(index) {
      qi = index;
      questionArea.innerHTML = '';
      counter.textContent = `${qi + 1} / ${total}`;
      progressBar.setAttribute('value', qi + 1);

      const card = document.createElement('wired-card');
      card.setAttribute('elevation', '1');
      card.style.cssText = 'padding:16px;margin-bottom:8px;display:block;';
      spitInElement(card, { delay: 30 });

      const qnum = document.createElement('div');
      qnum.className = 'question-num';
      qnum.textContent = `Question ${qi + 1} of ${total}`;
      card.appendChild(qnum);

      const puzzleArea = document.createElement('div');
      card.appendChild(puzzleArea);
      questionArea.appendChild(card);

      // After the puzzle calls onAnswer, show explanation then Next
      renderPuzzle(typeKey, puzzles[qi], puzzleArea, (correct, explanation) => {
        results.push({ seed: seeds[qi], correct });

        // Explanation block
        const expBlock = document.createElement('div');
        expBlock.style.cssText = 'margin-top:14px;padding:12px;background:#faf7f2;border-left:3px solid ' +
          (correct ? 'var(--correct)' : 'var(--wrong)') + ';';

        const verdict = document.createElement('div');
        verdict.style.cssText = `font-weight:700;font-size:0.95rem;margin-bottom:6px;color:${correct ? 'var(--correct)' : 'var(--wrong)'};`;
        verdict.textContent = correct ? '✓ Correct!' : '✗ Wrong';
        expBlock.appendChild(verdict);

        if (explanation) {
          const expText = document.createElement('div');
          expText.style.cssText = 'font-size:0.82rem;color:var(--ink-dim);line-height:1.7;font-family:var(--mono);';
          expText.innerHTML = explanation;
          expBlock.appendChild(expText);
        }
        card.appendChild(expBlock);

        // Next / Finish button
        const navRow = document.createElement('div');
        navRow.style.cssText = 'margin-top:14px;display:flex;gap:10px;align-items:center;';
        const nextBtn = document.createElement('wired-button');
        nextBtn.textContent = qi < total - 1 ? 'Next →' : 'Finish ✓';
        nextBtn.addEventListener('click', () => {
          if (qi < total - 1) renderInstant(qi + 1);
          else onDone(results);
        });
        navRow.appendChild(nextBtn);
        card.appendChild(navRow);
      });
    }

    renderInstant(0);
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BATCH MODE: answer all 20, then review carousel
  // ─────────────────────────────────────────────────────────────────────────
  const answers = new Array(total).fill(null); // null = unanswered; stores user's raw answer data
  const results = new Array(total).fill(null); // boolean correct/wrong, filled after submit
  let qi = 0;

  const navBar = document.createElement('div');
  navBar.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap;';

  const backBtn  = document.createElement('wired-button');
  backBtn.textContent = '← Back';
  backBtn.setAttribute('disabled', '');

  const nextBtn  = document.createElement('wired-button');
  nextBtn.textContent = 'Next →';

  const skipBtn  = document.createElement('wired-button');
  skipBtn.textContent = 'Skip';
  skipBtn.style.cssText = '--wired-item-color:var(--ink-faint);';

  const qLabel = document.createElement('span');
  qLabel.style.cssText = 'font-size:0.85rem;color:var(--ink-faint);margin-left:auto;font-family:var(--mono);';

  navBar.appendChild(backBtn);
  navBar.appendChild(nextBtn);
  navBar.appendChild(skipBtn);
  navBar.appendChild(qLabel);
  sessionDiv.appendChild(navBar);

  function updateBatchNav() {
    backBtn.toggleAttribute('disabled', qi === 0);
    nextBtn.textContent = qi === total - 1 ? 'Submit all ✓' : 'Next →';
    counter.textContent = `${qi + 1} / ${total}`;
    progressBar.setAttribute('value', qi + 1);
    qLabel.textContent = answers[qi] !== null ? '✎ answered' : 'unanswered';
  }

  function renderBatchQuestion(index) {
    qi = index;
    questionArea.innerHTML = '';

    const card = document.createElement('wired-card');
    card.setAttribute('elevation', '1');
    card.style.cssText = 'padding:16px;margin-bottom:8px;display:block;';
    spitInElement(card, { delay: 30 });

    const qnum = document.createElement('div');
    qnum.className = 'question-num';
    qnum.textContent = `Question ${qi + 1} of ${total}`;
    card.appendChild(qnum);

    const puzzleArea = document.createElement('div');
    card.appendChild(puzzleArea);
    questionArea.appendChild(card);

    // Render puzzle in batch mode: onAnswer fires when user locks in, but NO explanation shown yet
    renderPuzzle(typeKey, puzzles[qi], puzzleArea, (correct, _explanation, rawAnswer) => {
      answers[qi] = rawAnswer ?? correct; // store raw answer for review
      results[qi] = correct;
      updateBatchNav();
    }, { batchMode: true });

    updateBatchNav();
  }

  backBtn.addEventListener('click', () => { if (qi > 0) renderBatchQuestion(qi - 1); });
  skipBtn.addEventListener('click', () => {
    if (answers[qi] === null) { answers[qi] = null; results[qi] = false; }
    if (qi < total - 1) renderBatchQuestion(qi + 1);
    else submitBatch();
  });
  nextBtn.addEventListener('click', () => {
    if (qi < total - 1) renderBatchQuestion(qi + 1);
    else submitBatch();
  });

  function submitBatch() {
    // Fill skipped with false
    results.forEach((r, i) => { if (r === null) results[i] = false; });
    // Show review carousel
    showBatchReview(container, typeKey, puzzles, seeds, results, answers, () => {
      onDone(results.map((correct, i) => ({ seed: seeds[i], correct })));
    });
  }

  renderBatchQuestion(0);
}

// ── Batch review carousel ─────────────────────────────────────────────────────
function showBatchReview(container, typeKey, puzzles, seeds, results, answers, onFinish) {
  container.innerHTML = '';
  const total = puzzles.length;
  const correct = results.filter(Boolean).length;
  const pct = Math.round((correct / total) * 100);

  const wrap = document.createElement('div');
  wrap.id = 'test-session';

  // Score header
  const scoreBar = document.createElement('div');
  scoreBar.style.cssText = 'text-align:center;padding:16px 0 10px;';
  const scoreNum = document.createElement('div');
  scoreNum.style.cssText = 'font-size:2rem;font-weight:700;color:var(--accent);';
  scoreNum.textContent = `${correct} / ${total}`;
  const scorePct = document.createElement('div');
  scorePct.style.cssText = 'font-size:0.9rem;color:var(--ink-dim);margin-top:2px;';
  scorePct.textContent = `${pct}% correct — review your answers below`;
  scoreBar.appendChild(scoreNum);
  scoreBar.appendChild(scorePct);
  wrap.appendChild(scoreBar);

  const divider = document.createElement('wired-divider');
  divider.style.marginBottom = '16px';
  wrap.appendChild(divider);

  // Carousel area
  const carouselArea = document.createElement('div');
  wrap.appendChild(carouselArea);

  // Nav
  const navBar = document.createElement('div');
  navBar.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap;';
  const prevBtn = document.createElement('wired-button');
  prevBtn.textContent = '← Prev';
  const nextBtn = document.createElement('wired-button');
  nextBtn.textContent = 'Next →';
  const doneBtn = document.createElement('wired-button');
  doneBtn.textContent = 'Done ✓';
  const rLabel = document.createElement('span');
  rLabel.style.cssText = 'font-size:0.85rem;color:var(--ink-faint);margin-left:auto;font-family:var(--mono);';
  navBar.appendChild(prevBtn);
  navBar.appendChild(nextBtn);
  navBar.appendChild(doneBtn);
  navBar.appendChild(rLabel);
  wrap.appendChild(navBar);

  container.appendChild(wrap);

  let ri = 0;

  function renderReview(index) {
    ri = index;
    carouselArea.innerHTML = '';
    prevBtn.toggleAttribute('disabled', ri === 0);
    nextBtn.toggleAttribute('disabled', ri === total - 1);
    rLabel.textContent = `${ri + 1} / ${total}`;

    const isCorrect = results[ri];
    const card = document.createElement('wired-card');
    card.setAttribute('elevation', '1');
    card.style.cssText = 'padding:16px;display:block;margin-bottom:8px;';
    spitInElement(card, { delay: 30 });

    const qnum = document.createElement('div');
    qnum.className = 'question-num';
    qnum.style.cssText += `;color:${isCorrect ? 'var(--correct)' : 'var(--wrong)'};font-weight:700;`;
    qnum.textContent = `Q${ri + 1} — ${isCorrect ? '✓ Correct' : '✗ Wrong'}`;
    card.appendChild(qnum);

    const puzzleArea = document.createElement('div');
    card.appendChild(puzzleArea);

    // Render read-only puzzle with explanation shown
    renderPuzzle(typeKey, puzzles[ri], puzzleArea, () => {}, { reviewMode: true, userAnswer: answers[ri] });

    carouselArea.appendChild(card);
  }

  prevBtn.addEventListener('click', () => { if (ri > 0) renderReview(ri - 1); });
  nextBtn.addEventListener('click', () => { if (ri < total - 1) renderReview(ri + 1); });
  doneBtn.addEventListener('click', onFinish);

  renderReview(0);
}


// ── Step 5: Summary ───────────────────────────────────────────────────────────
function showSummary(container, typeKey, level, results, onPlayAgain, onHome) {
  container.innerHTML = '';
  const info = TYPES[typeKey];
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);

  const wrap = document.createElement('div');
  wrap.id = 'session-summary';

  const card = document.createElement('wired-card');
  card.setAttribute('elevation', '2');

  const title = document.createElement('div');
  title.style.cssText = 'font-size:1rem;color:var(--ink-dim);margin-bottom:6px;';
  title.textContent = `${info.label} · Test complete`;

  const score = document.createElement('div');
  score.id = 'summary-score';
  score.textContent = `${correct} / ${total}`;

  const label = document.createElement('div');
  label.id = 'summary-label';
  label.textContent = `${pct}% correct`;

  const divider = document.createElement('wired-divider');
  divider.style.margin = '16px 0';

  const actions = document.createElement('div');
  actions.id = 'summary-actions';

  const againBtn = document.createElement('wired-button');
  againBtn.textContent = 'Play again';
  againBtn.addEventListener('click', onPlayAgain);

  const homeBtn = document.createElement('wired-button');
  homeBtn.textContent = 'Home';
  homeBtn.addEventListener('click', onHome);

  actions.appendChild(againBtn);
  actions.appendChild(homeBtn);

  card.appendChild(title);
  card.appendChild(score);
  card.appendChild(label);
  card.appendChild(divider);
  card.appendChild(actions);
  wrap.appendChild(card);
  container.appendChild(wrap);

  // Persist
  addSession({
    id: Date.now().toString(),
    type: typeKey,
    level,
    date: new Date().toISOString().split('T')[0],
    seeds: results.map(r => r.seed),
    results: results.map(r => ({ seed: r.seed, correct: r.correct })),
  });
}

function renderPuzzle(typeKey, puzzle, container, onAnswer, opts = {}) {
  if (typeKey === 'figseq') renderFigseqPuzzle(puzzle, container, onAnswer, opts);
  else if (typeKey === 'linsys') renderLinSysPuzzle(puzzle, container, onAnswer, opts);
  else renderLatinSqPuzzle(puzzle, container, onAnswer, opts);
}

// ── Public entry ──────────────────────────────────────────────────────────────
export function renderPuzzles(container, opts = {}) {
  let currentType = opts.practiceType || null;
  let practiceSeeds = opts.practiceSeeds || null;

  function goTiles() {
    currentType = null;
    showTiles(container, (typeKey) => { currentType = typeKey; goIntro(); });
  }

  function goIntro() {
    showIntro(container, currentType, goConfig, goTiles);
  }

  function goConfig() {
    showConfig(container, currentType, ({ level, seeds, dimension, quizMode }) => {
      const finalSeeds = practiceSeeds || seeds;
      practiceSeeds = null;
      goSession({ level, seeds: finalSeeds, dimension, quizMode });
    }, goIntro);
  }

  function goSession(cfg) {
    showSession(container, currentType, cfg, (results) => {
      showSummary(container, currentType, cfg.level, results, goConfig, () => {
        document.querySelector('#main-tabs')?.dispatchEvent(
          Object.assign(new MouseEvent('click', { bubbles: true }), { _tab: 'home' })
        );
        document.dispatchEvent(new CustomEvent('switchTab', { detail: 'home' }));
      });
    });
  }

  if (practiceSeeds && currentType) goConfig();
  else goTiles();
}
