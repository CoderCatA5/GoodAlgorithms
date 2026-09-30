import rough from 'roughjs';

// chalk color name → CSS color (keeps the engine's color identifiers)
const COLOR_MAP = {
  white:   '#e8e4de',
  red:     '#8b2e2e',
  blue:    '#1e3a6e',
  green:   '#3a7d44',
  yellow:  '#8b6914',
  cyan:    '#1a6e6e',
  magenta: '#6e1a6e',
  gray:    '#6a6a6a',
  grey:    '#6a6a6a',
};

function cssColor(name) {
  return COLOR_MAP[name] || '#1a1a1a';
}

// Resolve arrow direction to dx/dy unit vector
function arrowVector(rotation, flipX, flipY) {
  let idx = ((Math.round((rotation ?? 0) / 45) % 8) + 8) % 8;
  if (flipY) idx = (8 - idx) % 8;
  if (flipX) idx = (4 - idx + 8) % 8;
  const angles = [270, 315, 0, 45, 90, 135, 180, 225]; // degrees, 0=right
  const deg = angles[idx];
  const rad = (deg * Math.PI) / 180;
  return { dx: Math.cos(rad), dy: Math.sin(rad) };
}

function drawBoard(svg, placements, boardW, boardH, cellSize) {
  const rc = rough.svg(svg);
  svg.setAttribute('width',  boardW * cellSize);
  svg.setAttribute('height', boardH * cellSize);
  svg.innerHTML = '';

  // Grid lines
  for (let x = 0; x <= boardW; x++) {
    const line = rc.line(x * cellSize, 0, x * cellSize, boardH * cellSize, {
      roughness: 1.2, stroke: '#9a9490', strokeWidth: 1,
    });
    svg.appendChild(line);
  }
  for (let y = 0; y <= boardH; y++) {
    const line = rc.line(0, y * cellSize, boardW * cellSize, y * cellSize, {
      roughness: 1.2, stroke: '#9a9490', strokeWidth: 1,
    });
    svg.appendChild(line);
  }

  for (const p of placements) {
    const cx = p.x * cellSize + cellSize / 2;
    const cy = p.y * cellSize + cellSize / 2;
    const color = cssColor(p.color);
    const sw = p.bold ? 2.5 : 1.5;
    const opts = { roughness: 1.8, stroke: color, strokeWidth: sw, fill: 'none' };

    if (p.shape === 'plain') {
      // Render glyph as text centered in cell
      const fontSize = p.size === 'small' ? cellSize * 0.38 : cellSize * 0.55;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy + fontSize * 0.35);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', fontSize);
      text.setAttribute('fill', color);
      text.setAttribute('font-family', 'serif');
      text.textContent = p.glyph || '●';
      svg.appendChild(text);
    } else if (p.shape === 'arrow') {
      const { dx, dy } = arrowVector(p.rotation, p.flipX, p.flipY);
      const len = cellSize * 0.34;
      const hx = cx + dx * len, hy = cy + dy * len;
      const tx = cx - dx * len, ty = cy - dy * len;
      // shaft
      svg.appendChild(rc.line(tx, ty, hx, hy, opts));
      // arrowhead (two lines)
      const perp = { dx: -dy, dy: dx };
      const hw = cellSize * 0.12;
      svg.appendChild(rc.line(hx, hy, hx - dx * hw * 1.4 + perp.dx * hw, hy - dy * hw * 1.4 + perp.dy * hw, opts));
      svg.appendChild(rc.line(hx, hy, hx - dx * hw * 1.4 - perp.dx * hw, hy - dy * hw * 1.4 - perp.dy * hw, opts));
    } else if (p.shape === 'circle') {
      const r = p.size === 'small' ? cellSize * 0.14 : cellSize * 0.22;
      svg.appendChild(rc.circle(cx, cy, r * 2, { ...opts, fill: color, fillStyle: 'solid', fillWeight: 1 }));
    } else if (p.shape === 'square') {
      const half = p.size === 'small' ? cellSize * 0.12 : cellSize * 0.2;
      svg.appendChild(rc.rectangle(cx - half, cy - half, half * 2, half * 2, { ...opts, fill: color, fillStyle: 'solid', fillWeight: 1 }));
    } else if (p.shape === 'triangle') {
      const r = p.size === 'small' ? cellSize * 0.14 : cellSize * 0.22;
      const pts = [
        [cx, cy - r],
        [cx + r * 0.87, cy + r * 0.5],
        [cx - r * 0.87, cy + r * 0.5],
      ];
      svg.appendChild(rc.polygon(pts, { ...opts, fill: color, fillStyle: 'solid', fillWeight: 1 }));
    }

    if (p.bordered) {
      const bOpts = { roughness: 1.4, stroke: color, strokeWidth: 1 };
      svg.appendChild(rc.rectangle(
        p.x * cellSize + 2, p.y * cellSize + 2,
        cellSize - 4, cellSize - 4, bOpts,
      ));
    }
  }
}

export function renderFigseqPuzzle(puzzle, container, onAnswer, opts = {}) {
  const { reviewMode = false } = opts;
  container.innerHTML = '';

  const isMobile = document.documentElement.dataset.mobile === 'true';
  const cellSize = isMobile ? 20 : 28;
  const bw = puzzle.board.width;
  const bh = puzzle.board.height;

  // Shown frames
  const seqDiv = document.createElement('div');
  seqDiv.className = 'figseq-sequence';
  puzzle.shownFrames.forEach((frame, i) => {
    if (i > 0) {
      const arr = document.createElement('span');
      arr.className = 'figseq-arrow';
      arr.textContent = '→';
      seqDiv.appendChild(arr);
    }
    const wrap = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'option-label';
    label.textContent = `board ${i + 1}`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawBoard(svg, frame.placements, bw, bh, cellSize);
    wrap.appendChild(svg);
    wrap.appendChild(label);
    seqDiv.appendChild(wrap);
  });
  container.appendChild(seqDiv);

  // Per sub-question answer state
  const answers = new Array(puzzle.subquestions.length).fill(null);

  puzzle.subquestions.forEach((sq, qi) => {
    const setDiv = document.createElement('div');
    setDiv.className = 'figseq-options-set';

    const qlabel = document.createElement('div');
    qlabel.className = 'figseq-options-label';
    qlabel.textContent = `Which is ${sq.prompt}?`;
    setDiv.appendChild(qlabel);

    const optRow = document.createElement('div');
    optRow.className = 'figseq-options';

    sq.options.forEach((opt, oi) => {
      const wrap = document.createElement('div');
      wrap.className = 'figseq-option';
      wrap.dataset.qi = qi;
      wrap.dataset.oi = oi;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      drawBoard(svg, opt.placements, bw, bh, cellSize);

      const label = document.createElement('div');
      label.className = 'option-label';
      label.textContent = opt.label;

      const wiredCard = document.createElement('wired-card');
      wiredCard.setAttribute('elevation', '1');
      wiredCard.style.cssText = 'padding:4px;display:inline-block;';
      wiredCard.appendChild(svg);
      wrap.appendChild(wiredCard);
      wrap.appendChild(label);
      optRow.appendChild(wrap);

      wrap.addEventListener('click', () => {
        // Deselect siblings — remove highlight SVGs and class
        optRow.querySelectorAll('.figseq-option').forEach(el => {
          el.classList.remove('selected');
          el.querySelector('.select-ring')?.remove();
        });
        wrap.classList.add('selected');
        // Draw a rough highlight ring around the wired-card
        const wc = wrap.querySelector('wired-card');
        if (wc) {
          const w = wc.offsetWidth || 80;
          const h = wc.offsetHeight || 80;
          const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          ring.classList.add('select-ring');
          ring.setAttribute('width', w + 8);
          ring.setAttribute('height', h + 8);
          ring.style.cssText = 'position:absolute;top:-4px;left:-4px;pointer-events:none;overflow:visible;z-index:10;';
          const rc = rough.svg(ring);
          ring.appendChild(rc.rectangle(2, 2, w + 4, h + 4, {
            roughness: 2.8, stroke: '#8b4513', strokeWidth: 2.5, fill: 'none',
          }));
          wrap.style.position = 'relative';
          wrap.appendChild(ring);
        }
        answers[qi] = oi;
        checkIfComplete();
      });
    });

    setDiv.appendChild(optRow);
    container.appendChild(setDiv);
  });

  function buildFigseqExplanation() {
    return puzzle.subquestions.map((sq, qi) => {
      const correct = sq.options[sq.correctIndex];
      return `${sq.prompt}: correct answer is <b>${correct.label}</b>`;
    }).join('<br>');
  }

  function checkIfComplete() {
    if (answers.every(a => a !== null)) {
      const correct = puzzle.subquestions.every((sq, qi) => answers[qi] === sq.correctIndex);
      const expl = buildFigseqExplanation();

      // Highlight correct/wrong options
      puzzle.subquestions.forEach((sq, qi) => {
        const setDiv = container.querySelectorAll('.figseq-options-set')[qi];
        if (!setDiv) return;
        setDiv.querySelectorAll('.figseq-option').forEach((el, oi) => {
          const isChosen = answers[qi] === oi;
          const isRight = oi === sq.correctIndex;
          if (isRight) {
            el.style.outline = '2.5px solid var(--correct)';
            el.querySelector('.option-label').style.color = 'var(--correct)';
          } else if (isChosen && !isRight) {
            el.style.outline = '2.5px solid var(--wrong)';
            el.querySelector('.option-label').style.color = 'var(--wrong)';
          }
          // Disable further clicks
          el.style.pointerEvents = 'none';
        });
      });

      onAnswer(correct, expl, answers.slice());
    }
  }
}
