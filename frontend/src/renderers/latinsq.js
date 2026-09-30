import rough from 'roughjs';
import { checkGuess } from '@engine/latin-squares/LatinSquareEngine.js';

export function renderLatinSqPuzzle(puzzle, container, onAnswer, opts = {}) {
  const { reviewMode = false, userAnswer = null } = opts;
  container.innerHTML = '';

  const { n, symbols, grid, question } = puzzle;

  const gridEl = document.createElement('div');
  gridEl.className = 'latin-grid';
  gridEl.style.gridTemplateColumns = `repeat(${n}, 36px)`;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement('div');
      cell.className = 'latin-cell';
      const isQuestion = r === question.row && c === question.col;
      if (isQuestion) {
        cell.className += ' question-cell';
        cell.textContent = '?';
      } else if (grid[r][c] != null) {
        cell.textContent = grid[r][c];
      } else {
        cell.style.color = 'var(--ink-faint)';
        cell.textContent = '·';
      }

      // Rough SVG border overlay
      const bsvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      bsvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
      bsvg.setAttribute('viewBox', '0 0 36 36');
      const rc = rough.svg(bsvg);
      bsvg.appendChild(rc.rectangle(1, 1, 34, 34, {
        roughness: 2.4,
        stroke: isQuestion ? '#8b4513' : '#9a9490',
        strokeWidth: isQuestion ? 2 : 1.2,
        fill: 'none',
      }));
      cell.appendChild(bsvg);

      gridEl.appendChild(cell);
    }
  }
  container.appendChild(gridEl);

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:0.8rem;color:var(--ink-faint);margin:8px 0 12px;';
  const visibleCount = grid.flat().filter(c => c !== null).length;
  hint.textContent = `Fill in the ? — every row and column holds ${symbols[0]}–${symbols[n - 1]} exactly once. (${visibleCount} of ${n * n} cells revealed)`;
  container.appendChild(hint);

  const optRow = document.createElement('div');
  optRow.className = 'latin-options';
  let selected = null;

  symbols.forEach(sym => {
    const btn = document.createElement('wired-button');
    btn.textContent = sym;
    btn.style.fontFamily = 'var(--mono)';
    btn.addEventListener('click', () => {
      selected = sym;
      // visual: dim others
      optRow.querySelectorAll('wired-button').forEach(b => {
        b.style.opacity = b.textContent === sym ? '1' : '0.45';
      });
    });
    optRow.appendChild(btn);
  });
  container.appendChild(optRow);

  const confirmBtn = document.createElement('wired-button');
  confirmBtn.textContent = 'Confirm';
  container.appendChild(confirmBtn);

  const feedback = document.createElement('div');
  feedback.style.cssText = 'margin-top:10px;font-size:0.9rem;min-height:1.4em;';
  container.appendChild(feedback);

  confirmBtn.addEventListener('click', () => {
    if (!selected) {
      feedback.style.color = 'var(--warn)';
      feedback.textContent = 'Pick a symbol first.';
      return;
    }
    const { correct } = checkGuess(puzzle, selected);
    confirmBtn.setAttribute('disabled', '');
    optRow.querySelectorAll('wired-button').forEach(b => b.setAttribute('disabled', ''));
    feedback.style.color = correct ? 'var(--correct)' : 'var(--wrong)';
    feedback.textContent = correct ? '✓ Correct!' : `✗ It was ${puzzle.solution.value}`;

    const expl = correct
      ? `The answer is <b>${puzzle.solution.value}</b> — each row and column must contain every symbol exactly once.`
      : `You chose <b>${selected}</b>, but the correct answer is <b>${puzzle.solution.value}</b>.<br>Check: row ${puzzle.question.row + 1} and column ${puzzle.question.col + 1} must each hold every symbol.`;

    onAnswer(correct, expl, selected);
  });
}
