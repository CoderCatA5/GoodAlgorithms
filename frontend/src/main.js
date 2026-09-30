import 'wired-elements';
import './style.css';
import { renderHome } from './tabs/home.js';
import { renderPuzzles } from './tabs/puzzles.js';
import { renderAnalytics } from './tabs/analytics.js';
import { getWrongSeeds } from './store.js';

// ── Mobile detection ─────────────────────────────────────────────────────────
const isMobile = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
document.documentElement.dataset.mobile = isMobile;

// ── Tab routing ───────────────────────────────────────────────────────────────
const panels = {
  home:      document.getElementById('tab-home'),
  puzzles:   document.getElementById('tab-puzzles'),
  analytics: document.getElementById('tab-analytics'),
};

const navBtns = document.querySelectorAll('.nav-btn');
let activeTab = 'home';

function switchTab(name, opts = {}) {
  activeTab = name;

  Object.entries(panels).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });

  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });

  if (name === 'home')      renderHome(panels.home);
  if (name === 'puzzles')   renderPuzzles(panels.puzzles, opts);
  if (name === 'analytics') renderAnalytics(panels.analytics);
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab, { force: true }));
});

// ── switchTab event from puzzles summary ─────────────────────────────────────
document.addEventListener('switchTab', (e) => {
  switchTab(e.detail, { force: true });
});

// ── "Practice wrong answers" cross-tab event ─────────────────────────────────
document.addEventListener('practiceWrong', () => {
  const seeds = getWrongSeeds('figseq');
  if (seeds.length === 0) {
    alert('No wrong answers recorded yet!');
    return;
  }
  switchTab('puzzles', { practiceType: 'figseq', practiceSeeds: seeds.slice(0, 20), force: true });
});

// ── Initial render ────────────────────────────────────────────────────────────
switchTab('home', { force: true });

// ── Fix wired-button shadow DOM text-transform ────────────────────────────────
// wired-button's inner <button> has text-transform:uppercase hardcoded in its
// shadow stylesheet — we inject a style to override it for nav buttons.
requestAnimationFrame(() => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.shadowRoot) {
      const s = document.createElement('style');
      s.textContent = 'button, .btn { text-transform: none !important; letter-spacing: 0; }';
      btn.shadowRoot.appendChild(s);
    }
  });
});

// ── Logo sketch ───────────────────────────────────────────────────────────────
import rough from 'roughjs';
const logoSvg = document.getElementById('logo-sketch');
if (logoSvg) {
  const rc = rough.svg(logoSvg);
  logoSvg.appendChild(rc.rectangle(2, 2, 12, 12, { roughness: 2, stroke: '#8b4513', strokeWidth: 1.5 }));
  logoSvg.appendChild(rc.rectangle(18, 2, 12, 12, { roughness: 2, stroke: '#3a7d44', strokeWidth: 1.5 }));
  logoSvg.appendChild(rc.line(14, 8, 18, 8, { roughness: 1.5, stroke: '#2d2d2d', strokeWidth: 1.5 }));
  logoSvg.appendChild(rc.line(16, 5, 18, 8, { roughness: 1.5, stroke: '#2d2d2d', strokeWidth: 1.5 }));
  logoSvg.appendChild(rc.line(16, 11, 18, 8, { roughness: 1.5, stroke: '#2d2d2d', strokeWidth: 1.5 }));
}
