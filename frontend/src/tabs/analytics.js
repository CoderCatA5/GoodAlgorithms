import { getStats, getRecentAccuracy, getAllSessions, clearAll } from '../store.js';

const TYPE_LABELS = { figseq: 'Figure Sequences', linsys: 'Linear Systems', latinsq: 'Latin Squares' };
const TYPE_COLORS = { figseq: '#3a7d44', linsys: '#8b4513', latinsq: '#8b6914' };

function drawLineChart(container, data, color) {
  if (data.length < 2) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Need 2+ sessions.';
    container.appendChild(empty);
    return;
  }
  const w = 240, h = 90;
  const pad = { top: 10, right: 10, bottom: 22, left: 30 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Axes
  svg.innerHTML = `
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top+ih}" stroke="#9a9490" stroke-width="1"/>
    <line x1="${pad.left}" y1="${pad.top+ih}" x2="${pad.left+iw}" y2="${pad.top+ih}" stroke="#9a9490" stroke-width="1"/>
  `;

  [0, 0.5, 1].forEach(v => {
    const y = pad.top + ih - v * ih;
    svg.innerHTML += `
      <text x="${pad.left-4}" y="${y+4}" text-anchor="end" font-size="9" fill="#9a9490">${Math.round(v*100)}%</text>
      <line x1="${pad.left}" y1="${y}" x2="${pad.left+iw}" y2="${y}" stroke="#e8e4de" stroke-width="1"/>
    `;
  });

  const pts = data.map((v, i) => {
    const x = pad.left + (i / (data.length - 1)) * iw;
    const y = pad.top + ih - v * ih;
    return `${x},${y}`;
  });

  svg.innerHTML += `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" opacity="0.85"/>`;

  data.forEach((v, i) => {
    const x = pad.left + (i / (data.length - 1)) * iw;
    const y = pad.top + ih - v * ih;
    svg.innerHTML += `
      <circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.85"/>
      <text x="${x}" y="${pad.top+ih+13}" text-anchor="middle" font-size="8" fill="#9a9490">${i+1}</text>
    `;
  });

  container.appendChild(svg);
}

export function renderAnalytics(container) {
  container.innerHTML = '';

  const stats = getStats();

  // Stat cards
  const grid = document.createElement('div');
  grid.id = 'analytics-grid';

  Object.entries(stats).forEach(([type, s]) => {
    const card = document.createElement('wired-card');
    card.setAttribute('elevation', '1');
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
    card.innerHTML = s.total > 0 ? `
      <div class="stat-card">
        <div class="stat-type">${TYPE_LABELS[type]}</div>
        <div class="stat-num">${pct}%</div>
        <div class="stat-sub">${s.correct} / ${s.total} · ${s.sessions} sessions</div>
      </div>
    ` : `
      <div class="stat-card">
        <div class="stat-type">${TYPE_LABELS[type]}</div>
        <div class="empty-state" style="padding:12px 0;font-size:0.8rem;">No sessions yet</div>
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // Divider
  const div1 = document.createElement('wired-divider');
  div1.style.cssText = 'max-width:720px;margin:16px auto;display:block;';
  container.appendChild(div1);

  // Line charts
  const chartWrap = document.createElement('div');
  chartWrap.id = 'analytics-chart-wrap';
  const chartHead = document.createElement('h2');
  chartHead.textContent = 'Accuracy over last 10 sessions';
  chartWrap.appendChild(chartHead);

  const chartRow = document.createElement('div');
  chartRow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;';

  Object.keys(TYPE_LABELS).forEach(type => {
    const wrap = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = `font-size:0.8rem;color:${TYPE_COLORS[type]};margin-bottom:6px;`;
    lbl.textContent = TYPE_LABELS[type];
    wrap.appendChild(lbl);
    drawLineChart(wrap, getRecentAccuracy(type, 10), TYPE_COLORS[type]);
    chartRow.appendChild(wrap);
  });

  chartWrap.appendChild(chartRow);
  container.appendChild(chartWrap);

  // Recent sessions
  const sessions = getAllSessions().slice(-10).reverse();
  if (sessions.length > 0) {
    const div2 = document.createElement('wired-divider');
    div2.style.cssText = 'max-width:720px;margin:16px auto;display:block;';
    container.appendChild(div2);

    const recWrap = document.createElement('div');
    recWrap.style.maxWidth = '720px';
    recWrap.style.margin = '0 auto';

    const recHead = document.createElement('h2');
    recHead.className = 'section-head';
    recHead.textContent = 'Recent sessions';
    recWrap.appendChild(recHead);

    sessions.forEach(s => {
      const card = document.createElement('wired-card');
      card.style.cssText = 'margin-bottom:8px;padding:10px 14px;display:block;';
      const correct = s.results.filter(r => r.correct).length;
      const pct = Math.round((correct / s.results.length) * 100);
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;flex-wrap:wrap;gap:8px;">
          <span style="color:var(--ink-faint)">${s.date}</span>
          <span>${TYPE_LABELS[s.type]} · Lv${s.level}</span>
          <span style="font-family:var(--mono)">${correct}/${s.results.length} (${pct}%)</span>
        </div>
      `;
      recWrap.appendChild(card);
    });
    container.appendChild(recWrap);
  }

  // Clear data button
  const div3 = document.createElement('wired-divider');
  div3.style.cssText = 'max-width:720px;margin:16px auto;display:block;';
  container.appendChild(div3);

  const clearWrap = document.createElement('div');
  clearWrap.style.cssText = 'max-width:720px;margin:0 auto;text-align:center;';
  const clearBtn = document.createElement('wired-button');
  clearBtn.textContent = 'Clear all data';
  clearBtn.style.cssText = '--wired-item-color:var(--wrong);';
  clearBtn.addEventListener('click', () => {
    if (confirm('Delete all saved sessions and streak data?')) {
      clearAll();
      renderAnalytics(container);
    }
  });
  clearWrap.appendChild(clearBtn);
  container.appendChild(clearWrap);
}
