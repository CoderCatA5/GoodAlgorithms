import rough from 'roughjs';
import { renderCalendar } from '../components/calendar.js';
import { renderPie } from '../components/pie.js';
import { getStreakData, getAllSessions } from '../store.js';

function animateTagline(el, text) {
  el.innerHTML = '';
  let delay = 0;
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.animationDelay = `${delay}s`;
    delay += ch === ' ' ? 0.04 : 0.035;
    el.appendChild(span);
  }
}

function drawHeroSketch(canvas) {
  const rc = rough.canvas(canvas);

  function draw(jitter = 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const j = () => (Math.random() - 0.5) * jitter;
    const s = 18, ox = 10, oy = 10;
    for (let i = 0; i <= 3; i++) {
      rc.line(ox + i * s + j(), oy + j(), ox + i * s + j(), oy + 3 * s + j(), { roughness: 2, stroke: '#2d2d2d', strokeWidth: 1 });
      rc.line(ox + j(), oy + i * s + j(), ox + 3 * s + j(), oy + i * s + j(), { roughness: 2, stroke: '#2d2d2d', strokeWidth: 1 });
    }
    const ax = ox + s * 1.5, ay = oy + s * 1.5;
    rc.line(ax - 6 + j(), ay + j(), ax + 6 + j(), ay + j(), { roughness: 1.5, stroke: '#8b4513', strokeWidth: 1.5 });
    rc.line(ax + 3 + j(), ay - 4 + j(), ax + 6 + j(), ay + j(), { roughness: 1.5, stroke: '#8b4513', strokeWidth: 1.5 });
    rc.line(ax + 3 + j(), ay + 4 + j(), ax + 6 + j(), ay + j(), { roughness: 1.5, stroke: '#8b4513', strokeWidth: 1.5 });
  }

  draw(0);
  canvas.addEventListener('mouseenter', () => draw(2));
  canvas.addEventListener('mouseleave', () => draw(0));
}

export function renderHome(container) {
  container.innerHTML = '';

  // ── Hero ─────────────────────────────────────────────────────────────────────
  const hero = document.createElement('div');
  hero.id = 'hero';

  const heroCard = document.createElement('wired-card');
  heroCard.setAttribute('elevation', '2');

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-canvas';
  canvas.width = 80;
  canvas.height = 80;

  const tagline = document.createElement('div');
  tagline.id = 'hero-tagline';

  const sub = document.createElement('div');
  sub.id = 'hero-sub';
  sub.textContent = 'Three puzzle types. One mission: sharpen your mind.';

  heroCard.appendChild(canvas);
  heroCard.appendChild(tagline);
  heroCard.appendChild(sub);
  hero.appendChild(heroCard);
  container.appendChild(hero);

  requestAnimationFrame(() => drawHeroSketch(canvas));
  animateTagline(tagline, "Don't let the algorithms control you — let them train you.");

  // ── Calendar ──────────────────────────────────────────────────────────────────
  const calSection = document.createElement('div');
  calSection.id = 'calendar-section';

  const calHead = document.createElement('h2');
  calHead.textContent = 'Training streak — last 60 days';
  calSection.appendChild(calHead);

  const calLegend = document.createElement('div');
  calLegend.style.cssText = 'display:flex;gap:16px;margin-bottom:8px;font-size:0.78rem;color:var(--ink-dim);flex-wrap:wrap;';
  [
    { label: 'Figure Seq', color: '#3a7d44' },
    { label: 'Linear Sys', color: '#8b4513' },
    { label: 'Latin Sq',   color: '#8b6914' },
  ].forEach(({ label, color }) => {
    const sp = document.createElement('span');
    sp.style.cssText = 'display:flex;align-items:center;gap:5px;';
    sp.innerHTML = `<svg width="18" height="10"><line x1="1" y1="5" x2="17" y2="5" stroke="${color}" stroke-width="2" stroke-dasharray="2 1"/></svg>${label}`;
    calLegend.appendChild(sp);
  });
  calSection.appendChild(calLegend);

  const calGrid = document.createElement('div');
  calGrid.id = 'calendar-container';
  calSection.appendChild(calGrid);
  container.appendChild(calSection);
  renderCalendar(calGrid, getStreakData());

  // ── Lower columns ─────────────────────────────────────────────────────────────
  const lower = document.createElement('div');
  lower.id = 'home-lower';
  container.appendChild(lower);

  // Review / Pie
  const reviewSection = document.createElement('div');
  reviewSection.id = 'review-section';

  const reviewHead = document.createElement('h2');
  reviewHead.textContent = 'Overall performance';
  reviewSection.appendChild(reviewHead);

  const pieContainer = document.createElement('div');
  reviewSection.appendChild(pieContainer);

  const sessions = getAllSessions();
  let correct = 0, wrong = 0;
  sessions.forEach(s => s.results.forEach(r => { r.correct ? correct++ : wrong++; }));
  renderPie(pieContainer, { correct, wrong, unanswered: 0 });

  if (wrong > 0) {
    const practiceBtn = document.createElement('wired-button');
    practiceBtn.style.marginTop = '14px';
    practiceBtn.textContent = 'Practice wrong answers';
    practiceBtn.addEventListener('click', () => document.dispatchEvent(new CustomEvent('practiceWrong')));
    reviewSection.appendChild(practiceBtn);
  } else if (sessions.length > 0) {
    const msg = document.createElement('p');
    msg.style.cssText = 'font-size:0.8rem;color:var(--correct);margin-top:10px;';
    msg.textContent = '✓ No wrong answers recorded — keep it up!';
    reviewSection.appendChild(msg);
  }
  lower.appendChild(reviewSection);

  // Quick stats
  const quickStats = document.createElement('div');
  const qHead = document.createElement('h2');
  qHead.style.cssText = 'font-size:1.1rem;color:var(--accent);margin-bottom:12px;';
  qHead.textContent = 'Quick stats';
  quickStats.appendChild(qHead);

  const typeNames = { figseq: 'Figure Seq', linsys: 'Linear Sys', latinsq: 'Latin Sq' };
  const statsCard = document.createElement('wired-card');
  statsCard.style.padding = '16px';

  ['figseq', 'linsys', 'latinsq'].forEach(type => {
    const relevant = sessions.filter(s => s.type === type);
    const total   = relevant.reduce((n, s) => n + s.results.length, 0);
    const corr    = relevant.reduce((n, s) => n + s.results.filter(r => r.correct).length, 0);
    const pct     = total > 0 ? Math.round((corr / total) * 100) : '—';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--ink-faint);font-size:0.88rem;';
    row.innerHTML = `<span>${typeNames[type]}</span><span style="font-family:var(--mono)">${corr}/${total} (${pct}%)</span>`;
    statsCard.appendChild(row);
  });

  quickStats.appendChild(statsCard);
  lower.appendChild(quickStats);
}
