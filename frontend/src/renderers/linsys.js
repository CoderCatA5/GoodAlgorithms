import { checkGuess } from '@engine/linear-systems/LinearSystemEngine.js';

function buildExplanation(puzzle, guess) {
  const { variables, solution, equations } = puzzle;
  const lines = [];

  // Show the correct values
  const solLine = variables.map(v => `${v} = ${solution.values[v]}`).join(', &nbsp; ');
  lines.push(`<b>Solution:</b> ${solLine}`);

  // Show substitution check for each equation
  equations.forEach((eq, i) => {
    const lhsVal = variables.reduce((sum, v, vi) => sum + eq.coeffs[vi] * solution.values[v], 0);
    lines.push(`eq&nbsp;${i + 1}: &nbsp;${eq.text} &nbsp;✓&nbsp;(${lhsVal} = ${eq.rhs})`);
  });

  // If user was wrong, note what they guessed
  if (guess) {
    const wrongVars = variables.filter(v => Number(guess[v]) !== solution.values[v]);
    if (wrongVars.length) {
      const guessStr = wrongVars.map(v => `${v}: got ${guess[v] ?? '?'}, need ${solution.values[v]}`).join(' &nbsp;|&nbsp; ');
      lines.push(`<span style="color:var(--wrong)">Your guess: ${guessStr}</span>`);
    }
  }

  return lines.join('<br>');
}

/**
 * opts.batchMode  — user can answer but no explanation is shown; onAnswer(correct, expl, rawGuess)
 * opts.reviewMode — read-only, show explanation immediately with userAnswer
 * default         — instant mode: user answers, explanation appears in-page
 */
export function renderLinSysPuzzle(puzzle, container, onAnswer, opts = {}) {
  const { batchMode = false, reviewMode = false, userAnswer = null } = opts;
  container.innerHTML = '';

  const eqDiv = document.createElement('div');
  eqDiv.className = 'linsys-eqs';
  puzzle.equations.forEach((eq, i) => {
    const p = document.createElement('p');
    p.className = 'linsys-eq';
    p.innerHTML = `<span class="eq-num">(${i + 1})</span>${eq.text}`;
    eqDiv.appendChild(p);
  });
  container.appendChild(eqDiv);

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:0.8rem;color:var(--ink-faint);margin-bottom:12px;';
  hint.textContent = `Each variable is a positive whole number from ${puzzle.valueRange.min} to ${puzzle.valueRange.max}.`;
  container.appendChild(hint);

  // Review mode: show user's guess (or nothing) + full explanation
  if (reviewMode) {
    const guess = userAnswer ?? {};
    const result = checkGuess(puzzle, guess);

    const inputRow = document.createElement('div');
    inputRow.className = 'linsys-inputs';
    puzzle.variables.forEach(v => {
      const wrap = document.createElement('div');
      wrap.className = 'var-input-wrap';
      const label = document.createElement('div');
      label.className = 'var-label';
      label.textContent = `${v} =`;
      const val = document.createElement('div');
      val.style.cssText = `font-family:var(--mono);font-size:1rem;font-weight:700;min-width:40px;text-align:center;color:${result.perVariable[v] ? 'var(--correct)' : 'var(--wrong)'};`;
      val.textContent = guess[v] !== undefined ? String(guess[v]) : '—';
      wrap.appendChild(label);
      wrap.appendChild(val);
      inputRow.appendChild(wrap);
    });
    container.appendChild(inputRow);

    const expBlock = document.createElement('div');
    expBlock.style.cssText = 'margin-top:12px;padding:12px;background:#f5f1eb;font-size:0.82rem;color:var(--ink-dim);line-height:1.8;font-family:var(--mono);border-left:3px solid var(--ink-faint);';
    expBlock.innerHTML = buildExplanation(puzzle, guess);
    container.appendChild(expBlock);
    return;
  }

  // Interactive input row
  const inputRow = document.createElement('div');
  inputRow.className = 'linsys-inputs';
  const inputs = {};

  puzzle.variables.forEach(v => {
    const wrap = document.createElement('div');
    wrap.className = 'var-input-wrap';
    const label = document.createElement('div');
    label.className = 'var-label';
    label.textContent = `${v} =`;
    const input = document.createElement('wired-input');
    input.setAttribute('placeholder', '?');
    input.setAttribute('type', 'number');
    input.style.width = '72px';
    inputs[v] = input;
    wrap.appendChild(label);
    wrap.appendChild(input);
    inputRow.appendChild(wrap);
  });
  container.appendChild(inputRow);

  const btn = document.createElement('wired-button');
  btn.textContent = 'Check';
  container.appendChild(btn);

  const feedback = document.createElement('div');
  feedback.style.cssText = 'margin-top:10px;font-size:0.9rem;min-height:1.4em;';
  container.appendChild(feedback);

  let attempts = 0;
  let answered = false;

  btn.addEventListener('click', () => {
    if (answered) return;
    const guess = {};
    puzzle.variables.forEach(v => { guess[v] = Number(inputs[v].value); });
    const result = checkGuess(puzzle, guess);

    puzzle.variables.forEach(v => {
      inputs[v].classList.remove('correct', 'wrong');
      inputs[v].classList.add(result.perVariable[v] ? 'correct' : 'wrong');
    });

    attempts++;

    if (result.correct) {
      answered = true;
      feedback.style.color = 'var(--correct)';
      feedback.textContent = '✓ Correct!';
      btn.setAttribute('disabled', '');
      puzzle.variables.forEach(v => inputs[v].setAttribute('disabled', ''));
      const expl = buildExplanation(puzzle, guess);
      if (!batchMode) {
        // In instant mode the session layer adds the explanation block, so pass it up
        onAnswer(true, expl, guess);
      } else {
        onAnswer(true, expl, guess);
      }
    } else if (attempts >= 3) {
      answered = true;
      feedback.style.color = 'var(--wrong)';
      feedback.textContent = '✗ Moving on…';
      btn.setAttribute('disabled', '');
      puzzle.variables.forEach(v => inputs[v].setAttribute('disabled', ''));
      const expl = buildExplanation(puzzle, guess);
      if (batchMode) {
        // In batch mode don't show explanation yet — session shows it in review
        onAnswer(false, expl, guess);
      } else {
        // Instant mode: session layer adds the explanation block after onAnswer fires
        onAnswer(false, expl, guess);
      }
    } else {
      feedback.style.color = 'var(--warn)';
      feedback.textContent = `Try again (${3 - attempts} attempt${3 - attempts === 1 ? '' : 's'} left)`;
    }
  });
}
