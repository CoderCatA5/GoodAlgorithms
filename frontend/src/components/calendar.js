import rough from 'roughjs';

const TYPE_COLORS = {
  figseq:  '#3a7d44',
  linsys:  '#8b4513',
  latinsq: '#8b6914',
};

const TYPE_ROTATION = { figseq: 0, linsys: 45, latinsq: 90 };

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function gridDow(date) {
  return (date.getDay() + 6) % 7;
}

function renderMonth(container, year, month, streakData, today) {
  container.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = gridDow(firstDay);

  // Day-of-week header row
  const dowRow = document.createElement('div');
  dowRow.className = 'cal-dow-row';
  DAYS.forEach(d => {
    const lbl = document.createElement('div');
    lbl.className = 'cal-dow-label';
    lbl.textContent = d;
    dowRow.appendChild(lbl);
  });
  container.appendChild(dowRow);

  const grid = document.createElement('div');
  grid.className = 'cal-month-grid';
  container.appendChild(grid);

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell cal-cell-empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const key = isoDate(date);
    const isFuture = date > today;
    const isToday = date.getTime() === today.getTime();

    const cell = document.createElement('div');
    cell.className = 'cal-cell'
      + (isToday ? ' cal-cell-today' : '')
      + (isFuture ? ' cal-cell-out' : '');
    cell.title = key;

    const dayNum = document.createElement('span');
    dayNum.className = 'cal-day-num';
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // Rough border overlay SVG
    const borderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    borderSvg.setAttribute('class', 'scribble-svg');
    borderSvg.setAttribute('viewBox', '0 0 38 38');
    borderSvg.style.zIndex = '0';
    cell.appendChild(borderSvg);

    const borderColor = isToday ? '#8b4513' : '#9a9490';
    const borderWeight = isToday ? 2.2 : 1.2;
    const idx = grid.children.length;
    setTimeout(() => {
      const rc = rough.svg(borderSvg);
      borderSvg.appendChild(rc.rectangle(1, 1, 36, 36, {
        roughness: 2.8,
        stroke: borderColor,
        strokeWidth: borderWeight,
        fill: 'none',
      }));
    }, idx * 8);

    if (!isFuture) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'scribble-svg');
      svg.setAttribute('viewBox', '0 0 38 38');
      cell.appendChild(svg);

      const data = streakData[key] || { figseq: 0, linsys: 0, latinsq: 0 };
      setTimeout(() => drawScribbles(svg, data), idx * 10);
    }

    grid.appendChild(cell);
  }
}

export function renderCalendar(container, streakData) {
  container.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Current view state — start on current month
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  // Min navigable month: 2 months back
  const minDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  // ── Nav header ────────────────────────────────────────────────────────────────
  const nav = document.createElement('div');
  nav.className = 'cal-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'cal-nav-btn';
  prevBtn.textContent = '←';
  prevBtn.style.position = 'relative';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'cal-nav-btn';
  nextBtn.textContent = '→';
  nextBtn.style.position = 'relative';

  // Draw rough borders on nav buttons after mount
  [prevBtn, nextBtn].forEach(btn => {
    requestAnimationFrame(() => {
      const w = btn.offsetWidth || 36;
      const h = btn.offsetHeight || 28;
      const bsvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      bsvg.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;`;
      bsvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const rc = rough.svg(bsvg);
      bsvg.appendChild(rc.rectangle(1, 1, w - 2, h - 2, {
        roughness: 2.5, stroke: '#9a9490', strokeWidth: 1.4, fill: 'none',
      }));
      btn.appendChild(bsvg);
    });
  });

  const monthLabel = document.createElement('div');
  monthLabel.className = 'cal-nav-label';

  nav.appendChild(prevBtn);
  nav.appendChild(monthLabel);
  nav.appendChild(nextBtn);
  container.appendChild(nav);

  // ── Month body ────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'cal-body';
  container.appendChild(body);

  function update() {
    monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    prevBtn.disabled = new Date(viewYear, viewMonth, 1) <= minDate;
    nextBtn.disabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();

    // Slide animation
    body.style.opacity = '0';
    body.style.transform = 'translateX(8px)';
    requestAnimationFrame(() => {
      renderMonth(body, viewYear, viewMonth, streakData, today);
      body.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      body.style.opacity = '1';
      body.style.transform = 'translateX(0)';
    });
  }

  prevBtn.addEventListener('click', () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    if (d >= minDate) {
      viewYear = d.getFullYear();
      viewMonth = d.getMonth();
      body.style.transform = 'translateX(-8px)';
      update();
    }
  });

  nextBtn.addEventListener('click', () => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (!isCurrentMonth) {
      const d = new Date(viewYear, viewMonth + 1, 1);
      viewYear = d.getFullYear();
      viewMonth = d.getMonth();
      body.style.transform = 'translateX(8px)';
      update();
    }
  });

  update();
}

function drawScribbles(svg, data) {
  const rc = rough.svg(svg);
  svg.innerHTML = '';

  Object.entries(TYPE_COLORS).forEach(([type, color]) => {
    const count = Math.min(data[type] || 0, 30);
    if (count === 0) return;

    const opacity = count / 30;
    const rot = TYPE_ROTATION[type];
    const cx = 19, cy = 19;

    for (let l = 0; l < 3; l++) {
      const offset = (l - 1) * 7;
      let x1, y1, x2, y2;

      if (rot === 0) {
        x1 = 3; y1 = cy + offset; x2 = 35; y2 = cy + offset;
      } else if (rot === 90) {
        x1 = cx + offset; y1 = 3; x2 = cx + offset; y2 = 35;
      } else {
        x1 = 3 + offset * 0.5; y1 = 3; x2 = 35 + offset * 0.5; y2 = 35;
      }

      const line = rc.line(x1, y1, x2, y2, {
        roughness: 2.2, stroke: color, strokeWidth: 1.2,
      });
      line.style.opacity = opacity;
      svg.appendChild(line);
    }
  });
}
