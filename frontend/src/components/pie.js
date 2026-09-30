export function renderPie(container, { correct, wrong, unanswered }) {
  const total = correct + wrong + unanswered;
  container.innerHTML = '';

  if (total === 0) {
    container.innerHTML = '<p class="empty-state">No data yet. Complete a test to see your stats.</p>';
    return;
  }

  const size = 110;
  const r = 48;
  const cx = size / 2, cy = size / 2;

  const segments = [
    { value: correct,    color: '#3a7d44', label: 'Correct' },
    { value: wrong,      color: '#8b2e2e', label: 'Wrong' },
    { value: unanswered, color: '#9a9490', label: 'Unanswered' },
  ].filter(s => s.value > 0);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  let startAngle = -Math.PI / 2;
  segments.forEach(seg => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`);
    path.setAttribute('fill', seg.color);
    path.setAttribute('opacity', '0.85');
    svg.appendChild(path);
    startAngle = endAngle;
  });

  // Sketchy overlay circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', r);
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', '#1a1a1a');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('stroke-dasharray', '3 4');
  svg.appendChild(circle);

  const pieWrap = document.createElement('div');
  pieWrap.id = 'pie-wrap';

  pieWrap.appendChild(svg);

  const legend = document.createElement('div');
  legend.id = 'pie-legend';
  segments.forEach(seg => {
    const pct = Math.round((seg.value / total) * 100);
    const span = document.createElement('span');
    span.innerHTML = `<span class="legend-dot" style="background:${seg.color}"></span>${seg.label}: ${seg.value} (${pct}%)`;
    legend.appendChild(span);
  });

  pieWrap.appendChild(legend);
  container.appendChild(pieWrap);
}
